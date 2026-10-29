import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { AuditLog } from '../types';
import { FileCode2, Search, Filter, ShieldCheck, Eye, X, Copy, Check } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const endpoint = actionFilter ? `/audit?action=${actionFilter}&limit=100` : '/audit?limit=100';
      const data = await apiRequest<AuditLog[]>(endpoint);
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter]);

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.username.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.resource?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans">
      {/* 1. Header */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <h2 className="text-lg font-bold text-[#E8EEF8] font-mono tracking-tight flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-[#38BDF8]" />
              Immutable Administrative Audit Trail
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Cryptographically tracked audit records logging operator sign-ins, policy toggles, database snapshot operations, and user changes
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, action..."
              className="bg-[#111C32] border border-[#243149] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#E8EEF8] placeholder-[#94A3B8] focus:outline-none focus:border-[#38BDF8]/60"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#111C32] border border-[#243149] rounded-lg px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-transparent text-[#E8EEF8] focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-[#0D1528]">All Actions</option>
              <option value="USER_LOGIN" className="bg-[#0D1528]">USER_LOGIN</option>
              <option value="USER_CREATED" className="bg-[#0D1528]">USER_CREATED</option>
              <option value="USER_UPDATED" className="bg-[#0D1528]">USER_UPDATED</option>
              <option value="BACKUP_CREATED" className="bg-[#0D1528]">BACKUP_CREATED</option>
              <option value="RULE_TOGGLED" className="bg-[#0D1528]">RULE_TOGGLED</option>
              <option value="INVESTIGATION_CREATED" className="bg-[#0D1528]">INVESTIGATION_CREATED</option>
              <option value="ADMIN_RECORD_DELETED" className="bg-[#0D1528]">ADMIN_RECORD_DELETED</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Audit Log Table */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#111C32] text-[#94A3B8] uppercase text-[10px] border-b border-[#243149]">
              <tr>
                <th className="p-3">Log ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor / Username</th>
                <th className="p-3">Action Type</th>
                <th className="p-3">Target Resource</th>
                <th className="p-3">Operation Details</th>
                <th className="p-3">Client IP</th>
                <th className="p-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243149]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#94A3B8]">Loading immutable audit trail...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#94A3B8]">No audit log records found.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#111C32] transition-colors">
                    <td className="p-3 font-bold text-[#94A3B8]">#{log.id}</td>
                    <td className="p-3 text-[#94A3B8] text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-[#38BDF8]">@{log.username}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#111C32] border border-[#243149] text-[#818CF8]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-[#E8EEF8]">{log.resource || '—'}</td>
                    <td className="p-3 text-[#94A3B8] max-w-sm truncate">{log.details || '—'}</td>
                    <td className="p-3 text-[#94A3B8] text-[11px]">{log.ip_address || '127.0.0.1'}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 rounded hover:bg-[#243149] text-[#94A3B8] hover:text-[#38BDF8]"
                        title="View Full Entry"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Audit Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1528] border border-[#243149] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#243149] pb-3">
              <h3 className="font-bold text-[#E8EEF8] text-sm">
                Audit Record #{selectedLog.id} • {selectedLog.action}
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-[#94A3B8] hover:text-[#E8EEF8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-[#111C32] rounded border border-[#243149] flex justify-between">
                <span className="text-[#94A3B8]">ACTOR:</span>
                <span className="text-[#38BDF8] font-bold">@{selectedLog.username}</span>
              </div>
              <div className="p-2.5 bg-[#111C32] rounded border border-[#243149] flex justify-between">
                <span className="text-[#94A3B8]">TIMESTAMP:</span>
                <span className="text-[#E8EEF8]">{new Date(selectedLog.timestamp).toISOString()}</span>
              </div>
              <div className="p-2.5 bg-[#111C32] rounded border border-[#243149] flex justify-between">
                <span className="text-[#94A3B8]">RESOURCE TARGET:</span>
                <span className="text-[#E8EEF8]">{selectedLog.resource || 'N/A'}</span>
              </div>
              <div className="p-2.5 bg-[#111C32] rounded border border-[#243149] space-y-1">
                <span className="text-[#94A3B8] block">OPERATION DETAILS:</span>
                <p className="text-[#E8EEF8]">{selectedLog.details || 'None provided'}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-lg bg-[#111C32] hover:bg-[#243149] border border-[#243149] text-[#E8EEF8]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
