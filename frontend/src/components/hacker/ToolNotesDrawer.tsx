import React, { useState } from 'react';
import { 
  X, Save, FileText, Code2, Plus, Trash2, Copy, Check, 
  Sparkles, Tag, Terminal, Bookmark, ChevronRight, Play
} from 'lucide-react';
import { useHackerProfile } from '../../context/HackerProfileContext';

interface ToolNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeToolId: string;
  activeToolName?: string;
  onInsertCommand?: (command: string) => void;
}

export const ToolNotesDrawer: React.FC<ToolNotesDrawerProps> = ({
  isOpen,
  onClose,
  activeToolId,
  activeToolName = 'Active Cyber Tool',
  onInsertCommand
}) => {
  const { profile, saveToolNote, addCommandSnippet, deleteCommandSnippet } = useHackerProfile();
  
  const currentNote = profile.personalNotes[activeToolId] || '';
  const [noteText, setNoteText] = useState(currentNote);
  const [activeTab, setActiveTab] = useState<'notes' | 'snippets'>('notes');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Snippet form state
  const [showAddSnippet, setShowAddSnippet] = useState(false);
  const [snippetTitle, setSnippetTitle] = useState('');
  const [snippetCommand, setSnippetCommand] = useState('');
  const [snippetDesc, setSnippetDesc] = useState('');
  const [snippetTags, setSnippetTags] = useState('recon, cheat');

  if (!isOpen) return null;

  const handleSaveNote = () => {
    saveToolNote(activeToolId, noteText);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleAddSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snippetTitle || !snippetCommand) return;
    addCommandSnippet({
      title: snippetTitle,
      toolId: activeToolId,
      command: snippetCommand,
      description: snippetDesc,
      tags: snippetTags.split(',').map(t => t.trim()).filter(Boolean)
    });
    setSnippetTitle('');
    setSnippetCommand('');
    setSnippetDesc('');
    setShowAddSnippet(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter snippets for active tool or generic
  const relevantSnippets = profile.savedSnippets.filter(
    s => s.toolId === activeToolId || s.toolId === 'global' || !s.toolId
  );

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-[#0E1A1F] border-l border-[#6967FB]/30 shadow-[-10px_0_40px_rgba(0,0,0,0.8)] flex flex-col animate-slideLeft">
      
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-[#6967FB]/25 bg-[#122026] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#C8F904]/10 border border-[#C8F904]/40 flex items-center justify-center text-[#C8F904]">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
              <span>SCRATCHPAD & SNIPPETS</span>
              <span className="text-[10px] text-[#C8F904] font-bold">LOCK-IN</span>
            </h3>
            <p className="text-[11px] text-[#9FB0B7] truncate max-w-[280px]">
              {activeToolName}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#9FB0B7] hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#6967FB]/20 bg-[#0E1A1F]">
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-2.5 text-xs font-mono font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'notes'
              ? 'border-[#C8F904] text-[#C8F904] bg-[#122026]/50'
              : 'border-transparent text-[#9FB0B7] hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Tool Notes</span>
        </button>

        <button
          onClick={() => setActiveTab('snippets')}
          className={`flex-1 py-2.5 text-xs font-mono font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'snippets'
              ? 'border-[#C8F904] text-[#C8F904] bg-[#122026]/50'
              : 'border-transparent text-[#9FB0B7] hover:text-white'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Saved Snippets ({relevantSnippets.length})</span>
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        
        {activeTab === 'notes' ? (
          <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#9FB0B7] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C8F904]" />
                Personal Cheat Sheet (+15 XP)
              </span>
              {savedSuccess && (
                <span className="text-[#C8F904] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved!
                </span>
              )}
            </div>

            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={`Write personal notes, bypass flags, or investigation leads for ${activeToolName}...`}
              className="flex-1 min-h-[300px] w-full bg-[#122026] border border-[#6967FB]/30 rounded-xl p-4 text-xs font-mono text-white focus:outline-none focus:border-[#C8F904] resize-none leading-relaxed placeholder:text-[#9FB0B7]/50"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-[#9FB0B7] font-mono">
                Auto-saved locally & synced to your hacker persona
              </span>
              <button
                onClick={handleSaveNote}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#C8F904] hover:bg-[#b0dc03] text-black font-mono font-bold text-xs rounded-lg transition-all shadow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Notes</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Header + Add button */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#9FB0B7]">
                Quick-Execution Templates (+25 XP)
              </span>
              <button
                onClick={() => setShowAddSnippet(!showAddSnippet)}
                className="flex items-center gap-1 text-xs font-mono text-[#C8F904] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddSnippet ? 'Cancel' : 'New Snippet'}</span>
              </button>
            </div>

            {/* Add Snippet Inline Form */}
            {showAddSnippet && (
              <form onSubmit={handleAddSnippet} className="p-4 rounded-xl bg-[#122026] border border-[#C8F904]/40 space-y-3">
                <div className="text-xs font-mono font-bold text-white">Create Command Snippet</div>
                <input
                  type="text"
                  required
                  placeholder="Snippet Title (e.g., Quick Subnet Sweep)"
                  value={snippetTitle}
                  onChange={(e) => setSnippetTitle(e.target.value)}
                  className="w-full bg-[#0E1A1F] border border-[#6967FB]/30 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#C8F904]"
                />
                <textarea
                  required
                  rows={2}
                  placeholder="Command or Payload (e.g. nmap -sV -T4 -p 80,443 <ip>)"
                  value={snippetCommand}
                  onChange={(e) => setSnippetCommand(e.target.value)}
                  className="w-full bg-[#0E1A1F] border border-[#6967FB]/30 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#C8F904]"
                />
                <input
                  type="text"
                  placeholder="Tags (comma separated: recon, fast)"
                  value={snippetTags}
                  onChange={(e) => setSnippetTags(e.target.value)}
                  className="w-full bg-[#0E1A1F] border border-[#6967FB]/30 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#C8F904]"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#C8F904] text-black font-mono font-bold text-xs rounded-lg hover:bg-[#b0dc03]"
                  >
                    Save Snippet
                  </button>
                </div>
              </form>
            )}

            {/* Snippet List */}
            {relevantSnippets.length === 0 ? (
              <div className="text-center py-12 text-[#9FB0B7] space-y-2">
                <Code2 className="w-8 h-8 mx-auto text-[#6967FB]/40" />
                <p className="text-xs font-mono">No command snippets saved for this tool yet.</p>
                <button
                  onClick={() => setShowAddSnippet(true)}
                  className="text-xs text-[#C8F904] font-mono hover:underline"
                >
                  Add your first custom command
                </button>
              </div>
            ) : (
              relevantSnippets.map((snippet) => (
                <div
                  key={snippet.id}
                  className="p-3.5 rounded-xl bg-[#122026] border border-[#6967FB]/25 space-y-2 group hover:border-[#6967FB]/60 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-[#C8F904]" />
                      {snippet.title}
                    </span>
                    <button
                      onClick={() => deleteCommandSnippet(snippet.id)}
                      className="text-[#9FB0B7] hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete snippet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="bg-[#0E1A1F] p-2.5 rounded-lg border border-black/40 font-mono text-xs text-[#C8F904] break-all relative">
                    {snippet.command}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex flex-wrap gap-1">
                      {snippet.tags.map((tg, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-[#6967FB]/20 text-[#9FB0B7] font-mono">
                          #{tg}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onInsertCommand && (
                        <button
                          onClick={() => onInsertCommand(snippet.command)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-[#6967FB]/30 hover:bg-[#6967FB]/50 text-white text-[10px] font-mono"
                          title="Inject into active input"
                        >
                          <Play className="w-3 h-3 text-[#C8F904]" />
                          <span>Insert</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleCopy(snippet.command, snippet.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white text-[10px] font-mono"
                      >
                        {copiedId === snippet.id ? (
                          <Check className="w-3 h-3 text-[#C8F904]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedId === snippet.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

          </div>
        )}

      </div>

    </div>
  );
};
