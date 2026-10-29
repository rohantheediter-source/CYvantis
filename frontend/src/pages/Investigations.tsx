import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Investigation } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Briefcase, Plus, MessageSquare, User, Clock, FileText, Send,
  Shield, CheckCircle2, AlertTriangle, X, ChevronRight
} from 'lucide-react';

export const Investigations: React.FC = () => {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [statusTab, setStatusTab] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // New Investigation Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('high');

  // Drawer detail state
  const [selectedInv, setSelectedInv] = useState<Investigation | null>(null);
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const fetchInvestigations = async () => {
    setLoading(true);
    try {
      const endpoint = statusTab === 'all' ? '/investigations' : `/investigations?status_filter=${statusTab}`;
      const data = await apiRequest<Investigation[]>(endpoint);
      setInvestigations(data || []);
    } catch (err) {
      console.error('Failed to fetch investigations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, [statusTab]);

  const handleCreateInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/investigations', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          severity,
          status: 'open'
        })
      });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      fetchInvestigations();
    } catch (err: any) {
      alert(err.message || 'Failed to create investigation');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInv || !newNote.trim()) return;

    setIsSubmittingNote(true);
    try {
      await apiRequest(`/investigations/${selectedInv.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note_text: newNote })
      });
      setNewNote('');
      const updated = await apiRequest<Investigation>(`/investigations/${selectedInv.id}`);
      setSelectedInv(updated);
      fetchInvestigations();
    } catch (err: any) {
      alert(err.message || 'Failed to add analyst note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleStatusChange = async (invId: number, newStatus: string) => {
    try {
      await apiRequest(`/investigations/${invId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (selectedInv && selectedInv.id === invId) {
        setSelectedInv((prev) => (prev ? { ...prev, status: newStatus as any } : null));
      }
      fetchInvestigations();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans">
      {/* 1. Header & Create Button */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <h2 className="text-lg font-bold text-[#E8EEF8] font-mono tracking-tight flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#38BDF8]" />
              Incident Investigations Case Management
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Collaborative case management, evidence aggregation, timeline reconstruction, and resolution tracking
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/50 text-[#38BDF8] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto font-mono"
        >
          <Plus className="w-4 h-4" />
          <span>New Case</span>
        </button>
      </div>

      {/* 2. Filter Status Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#243149] pb-2 font-mono text-xs">
        {['all', 'open', 'in_progress', 'resolved', 'closed'].map((t) => (
          <button
            key={t}
            onClick={() => setStatusTab(t)}
            className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-colors cursor-pointer ${
              statusTab === t
                ? 'bg-[#111C32] text-[#38BDF8] border border-[#38BDF8]/40 font-bold'
                : 'text-[#94A3B8] hover:text-[#E8EEF8] hover:bg-[#111C32]/60'
            }`}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* 3. Investigations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-[#94A3B8] text-xs font-mono">
            Loading active incident cases...
          </div>
        ) : investigations.length === 0 ? (
          <div className="col-span-full text-center py-12 text-[#94A3B8] text-xs font-mono bg-[#0D1528] rounded-xl border border-[#243149]">
            No incident investigations found matching this status filter.
          </div>
        ) : (
          investigations.map((inv) => (
            <div
              key={inv.id}
              onClick={() => setSelectedInv(inv)}
              className="bg-[#0D1528] border border-[#243149] hover:border-[#38BDF8]/40 rounded-xl p-5 shadow-sm space-y-3 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#38BDF8] font-bold">CASE #{inv.id}</span>
                  <StatusBadge status={inv.severity} type="severity" />
                </div>
                <h3 className="font-bold text-[#E8EEF8] text-sm group-hover:text-[#38BDF8] transition-colors line-clamp-1">
                  {inv.title}
                </h3>
                <p className="text-xs text-[#94A3B8] line-clamp-2">{inv.description}</p>
              </div>

              <div className="pt-3 border-t border-[#243149] space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Status:</span>
                  <StatusBadge status={inv.status} />
                </div>
                <div className="flex items-center justify-between text-[#94A3B8] text-[11px]">
                  <span>Analyst: <strong className="text-[#E8EEF8]">{inv.assigned_to_username || 'Unassigned'}</strong></span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-[#38BDF8]" />
                    {inv.notes?.length || 0} notes
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Case Detail & Notes Modal / Drawer */}
      {selectedInv && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1528] border border-[#243149] rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-mono text-xs">
            <div className="flex items-start justify-between border-b border-[#243149] pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#38BDF8] font-bold">CASE #{selectedInv.id}</span>
                  <StatusBadge status={selectedInv.severity} type="severity" />
                  <StatusBadge status={selectedInv.status} />
                </div>
                <h3 className="text-sm font-bold text-[#E8EEF8] font-sans">{selectedInv.title}</h3>
              </div>
              <button
                onClick={() => setSelectedInv(null)}
                className="text-[#94A3B8] hover:text-[#E8EEF8] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[#94A3B8] text-[10px] uppercase">Incident Narrative</span>
              <p className="text-xs text-[#E8EEF8] font-sans leading-relaxed bg-[#111C32] p-3 rounded-lg border border-[#243149]">
                {selectedInv.description}
              </p>
            </div>

            {/* Quick Status Update Controls */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#111C32] border border-[#243149]">
              <span className="text-[#94A3B8] text-[11px]">Lifecycle Status:</span>
              <div className="flex items-center gap-1.5">
                {(['open', 'in_progress', 'resolved', 'closed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedInv.id, st)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize transition-colors ${
                      selectedInv.status === st
                        ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/50 font-bold'
                        : 'bg-[#0D1528] text-[#94A3B8] hover:text-[#E8EEF8] border border-[#243149]'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Analyst Notes Thread */}
            <div className="space-y-3 pt-2">
              <span className="text-[#94A3B8] text-[11px] uppercase flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#38BDF8]" />
                Analyst Investigation Notes ({selectedInv.notes?.length || 0})
              </span>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {!selectedInv.notes || selectedInv.notes.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] py-2">No analyst notes recorded yet. Add initial observations below.</p>
                ) : (
                  selectedInv.notes.map((note) => (
                    <div key={note.id} className="p-2.5 rounded bg-[#111C32] border border-[#243149] space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-[#94A3B8]">
                        <span className="text-[#38BDF8] font-bold">{note.author_username}</span>
                        <span>{new Date(note.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-[#E8EEF8] font-sans">{note.note_text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Input */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record forensic observation or triage note..."
                  className="flex-1 bg-[#111C32] border border-[#243149] rounded-lg px-3 py-1.5 text-xs text-[#E8EEF8] placeholder-[#94A3B8] focus:outline-none focus:border-[#38BDF8]/60"
                />
                <button
                  type="submit"
                  disabled={isSubmittingNote || !newNote.trim()}
                  className="px-3 py-1.5 rounded-lg bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/50 text-[#38BDF8] text-xs font-bold transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 5. Create Investigation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateInvestigation}
            className="bg-[#0D1528] border border-[#243149] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs"
          >
            <div className="flex items-center justify-between border-b border-[#243149] pb-3">
              <h3 className="font-bold text-[#E8EEF8] text-sm">Initiate New Incident Investigation</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#E8EEF8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[#94A3B8] text-[11px]">CASE TITLE</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Multi-source SSH Brute-Force Campaign against Sensor #1"
                  className="w-full bg-[#111C32] border border-[#243149] rounded-lg px-3 py-2 text-xs text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8]/60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] text-[11px]">SEVERITY LEVEL</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-[#111C32] border border-[#243149] rounded-lg px-3 py-2 text-xs text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8]/60 cursor-pointer"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] text-[11px]">INCIDENT DESCRIPTION & INITIAL EVIDENCE</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize attacker actions, targeted honeypot ports, indicators, and initial response steps..."
                  className="w-full bg-[#111C32] border border-[#243149] rounded-lg p-3 text-xs text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8]/60"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-[#111C32] border border-[#243149] text-[#94A3B8] hover:text-[#E8EEF8]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/50 text-[#38BDF8] font-bold"
              >
                Create Investigation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
