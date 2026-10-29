import React, { useState, useEffect } from 'react';
import { apiRequest, downloadFile } from '../services/api';
import { StorageStatus, BackupRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  HardDrive, Download, RotateCcw, ShieldCheck, Trash2, Plus,
  AlertTriangle, RefreshCw, X, Check, ShieldAlert
} from 'lucide-react';

export const StorageBackups: React.FC = () => {
  const { isAdmin } = useAuth();
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [backupActionLoading, setBackupActionLoading] = useState(false);

  // Restore Confirmation Modal state
  const [restoreCandidate, setRestoreCandidate] = useState<string | null>(null);
  const [restoreConfirmInput, setRestoreConfirmInput] = useState('');
  const [purgeConfirmOpen, setPurgeConfirmOpen] = useState(false);
  const [downloadingSnapshot, setDownloadingSnapshot] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statusRes, backupRes] = await Promise.all([
        apiRequest<StorageStatus>('/storage/status'),
        apiRequest<BackupRecord[]>('/storage/backups')
      ]);
      setStatus(statusRes);
      setBackups(backupRes || []);
    } catch (err) {
      console.error('Failed to load storage status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBackup = async () => {
    setBackupActionLoading(true);
    try {
      await apiRequest('/storage/backups', { method: 'POST' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create database backup');
    } finally {
      setBackupActionLoading(false);
    }
  };

  const handleDownloadBackup = async (filename: string) => {
    setDownloadingSnapshot(filename);
    try {
      await downloadFile(`/storage/backups/${filename}/download`, filename);
    } catch (err: any) {
      alert(err.message || 'Failed to download snapshot');
    } finally {
      setDownloadingSnapshot(null);
    }
  };

  const handleConfirmRestore = async () => {
    if (!restoreCandidate || restoreConfirmInput.trim().toUpperCase() !== 'RESTORE') return;

    setBackupActionLoading(true);
    try {
      await apiRequest(`/storage/backups/${restoreCandidate}/restore`, { method: 'POST' });
      alert(`Database successfully restored from snapshot ${restoreCandidate}.`);
      setRestoreCandidate(null);
      setRestoreConfirmInput('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to restore database');
    } finally {
      setBackupActionLoading(false);
    }
  };

  const handlePurgeOldData = async () => {
    try {
      const res = await apiRequest<{ message: string }>('/storage/purge?retention_days=90', { method: 'POST' });
      alert(res.message);
      setPurgeConfirmOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to purge backup data');
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans">
      {/* 1. Header */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <h2 className="text-lg font-bold text-[#E8EEF8] font-mono tracking-tight flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-[#38BDF8]" />
              Storage Engine & SQLite Backup Management
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Atomic SQLite online snapshots, transactional integrity verification, download & restore workflows
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={handleCreateBackup}
              disabled={backupActionLoading}
              className="px-3.5 py-2 rounded-lg bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/50 text-[#38BDF8] font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{backupActionLoading ? 'Creating Snapshot...' : 'Create Snapshot'}</span>
            </button>
            <button
              onClick={() => setPurgeConfirmOpen(true)}
              className="px-3 py-2 rounded-lg bg-[#111C32] hover:bg-[#243149] border border-[#243149] text-[#94A3B8] hover:text-[#E8EEF8] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge &gt;90d</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Storage Health & Metrics Grid */}
      {status && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          <div className="bg-[#0D1528] border border-[#243149] p-4 rounded-xl space-y-1">
            <span className="text-[#94A3B8] uppercase text-[10px]">Database File</span>
            <div className="text-base font-bold text-[#38BDF8]">{status.db_filename}</div>
            <div className="text-[#94A3B8] text-[11px]">SQLite3 Transactional</div>
          </div>

          <div className="bg-[#0D1528] border border-[#243149] p-4 rounded-xl space-y-1">
            <span className="text-[#94A3B8] uppercase text-[10px]">Current File Size</span>
            <div className="text-2xl font-bold text-[#E8EEF8]">{status.db_size_mb} MB</div>
            <div className="text-[#94A3B8] text-[11px]">{(status?.db_size_bytes ?? 0).toLocaleString()} bytes</div>
          </div>

          <div className="bg-[#0D1528] border border-[#243149] p-4 rounded-xl space-y-1">
            <span className="text-[#94A3B8] uppercase text-[10px]">Backup Snapshots</span>
            <div className="text-2xl font-bold text-[#818CF8]">{status.backup_count} Archives</div>
            <div className="text-[#94A3B8] text-[11px]">{status.backup_size_mb} MB total storage</div>
          </div>

          <div className="bg-[#0D1528] border border-[#243149] p-4 rounded-xl space-y-1">
            <span className="text-[#94A3B8] uppercase text-[10px]">Retention Policy</span>
            <div className="text-2xl font-bold text-[#FBBF24]">{status.retention_days} Days</div>
            <div className="text-[#34D399] text-[11px]">Auto-Prune Active</div>
          </div>
        </div>
      )}

      {/* 3. Backup History Table */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#243149] bg-[#111C32] flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
            <h3 className="font-bold text-[#E8EEF8] uppercase tracking-wider">
              Snapshot Archives History ({backups.length})
            </h3>
          </div>
          <span className="text-[#94A3B8]">Safe, non-blocking atomic backups</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#111C32] text-[#94A3B8] uppercase text-[10px] border-b border-[#243149]">
              <tr>
                <th className="p-3">Snapshot Filename</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Size</th>
                <th className="p-3">Created By</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243149]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#94A3B8]">Loading backup records...</td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#94A3B8]">No backup snapshots created yet.</td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.id} className="hover:bg-[#111C32] transition-colors">
                    <td className="p-3 font-bold text-[#38BDF8]">{b.filename}</td>
                    <td className="p-3 text-[#94A3B8]">{new Date(b.timestamp).toLocaleString()}</td>
                    <td className="p-3 text-[#E8EEF8]">{(b.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</td>
                    <td className="p-3 text-[#94A3B8]">{b.created_by}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/40 text-[10px] uppercase font-bold">
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadBackup(b.filename)}
                          disabled={downloadingSnapshot === b.filename}
                          className="px-2.5 py-1 rounded bg-[#111C32] hover:bg-[#243149] border border-[#243149] text-[#38BDF8] flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                          title="Download Snapshot File"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setRestoreCandidate(b.filename);
                              setRestoreConfirmInput('');
                            }}
                            className="px-2.5 py-1 rounded bg-[#FB7185]/10 hover:bg-[#FB7185]/20 border border-[#FB7185]/30 text-[#FB7185] flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                            title="Restore database from snapshot"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Restore Multi-Step Confirmation Modal */}
      {restoreCandidate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs">
          <div className="bg-[#0D1528] border border-[#FB7185]/40 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-[#FB7185] border-b border-[#243149] pb-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm">CRITICAL: Database Restore Confirmation</h3>
            </div>

            <div className="space-y-2 text-[#94A3B8]">
              <p>
                You are about to restore the live transactional database from snapshot:
              </p>
              <div className="p-2.5 bg-[#111C32] border border-[#243149] rounded text-[#E8EEF8] font-bold">
                {restoreCandidate}
              </div>
              <p className="text-[11px] text-[#FB7185]">
                WARNING: This destructive operation will replace current active records with the state from this snapshot.
              </p>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] text-[#94A3B8]">
                Type <strong className="text-[#E8EEF8]">RESTORE</strong> to confirm:
              </label>
              <input
                type="text"
                value={restoreConfirmInput}
                onChange={(e) => setRestoreConfirmInput(e.target.value)}
                placeholder="Type RESTORE in capital letters"
                className="w-full bg-[#111C32] border border-[#243149] rounded-lg px-3 py-2 text-[#E8EEF8] focus:outline-none focus:border-[#FB7185]/60"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestoreCandidate(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#111C32] border border-[#243149] text-[#94A3B8] hover:text-[#E8EEF8]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={restoreConfirmInput.trim().toUpperCase() !== 'RESTORE' || backupActionLoading}
                onClick={handleConfirmRestore}
                className="px-4 py-1.5 rounded-lg bg-[#FB7185]/20 hover:bg-[#FB7185]/30 border border-[#FB7185]/50 text-[#FB7185] font-bold disabled:opacity-40"
              >
                {backupActionLoading ? 'Restoring...' : 'Confirm Overwrite Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Purge Confirmation Modal */}
      {purgeConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs">
          <div className="bg-[#0D1528] border border-[#FBBF24]/40 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-[#FBBF24]">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm">Purge Expired Backups</h3>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Delete all backup snapshot archives older than the 90-day retention window? This releases disk storage.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPurgeConfirmOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-[#111C32] border border-[#243149] text-[#94A3B8] hover:text-[#E8EEF8]"
              >
                Cancel
              </button>
              <button
                onClick={handlePurgeOldData}
                className="px-4 py-1.5 rounded-lg bg-[#FBBF24]/20 hover:bg-[#FBBF24]/30 border border-[#FBBF24]/50 text-[#FBBF24] font-bold"
              >
                Confirm Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
