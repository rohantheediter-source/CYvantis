import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Server, Trash2, Eye, ChevronLeft, ChevronRight, ShieldAlert,
  Search, AlertTriangle, X, Copy, Check, RefreshCw
} from 'lucide-react';

interface TableStat {
  table_key: string;
  table_name: string;
  record_count: number;
}

export const AdminDataManagement: React.FC = () => {
  const { isAdmin } = useAuth();
  const [tables, setTables] = useState<TableStat[]>([]);
  const [activeTable, setActiveTable] = useState<string>('events');
  const [tableData, setTableData] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Raw JSON Inspection Modal
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const fetchTableStats = async () => {
    try {
      const stats = await apiRequest<TableStat[]>('/admin-data/tables');
      setTables(stats || []);
    } catch (err) {
      console.error('Failed to fetch table stats:', err);
    }
  };

  const fetchTableRecords = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        page_size: '15'
      });
      if (search) queryParams.append('search', search);

      const data = await apiRequest(`/admin-data/tables/${activeTable}?${queryParams.toString()}`);
      setTableData(data);
    } catch (err) {
      console.error('Failed to fetch table records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchTableStats();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchTableRecords();
    }
  }, [activeTable, page, isAdmin]);

  const handleDeleteRecord = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/admin-data/tables/${activeTable}/${deleteConfirmId}`, { method: 'DELETE' });
      setDeleteConfirmId(null);
      fetchTableStats();
      fetchTableRecords();
    } catch (err: any) {
      alert(err.message || 'Failed to delete record');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyJson = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  if (!isAdmin) {
    return (
      <div className="bg-[#0D1528] border border-[#243149] p-8 rounded-xl text-center space-y-3 max-w-lg mx-auto mt-12 font-mono">
        <ShieldAlert className="w-10 h-10 text-[#FB7185] mx-auto" />
        <h2 className="text-sm font-bold text-[#E8EEF8]">Administrator Privileges Required</h2>
        <p className="text-xs text-[#94A3B8]">
          You must be logged in as an Administrator to query, inspect, and modify central database tables.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans">
      {/* 1. Header */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
          <h2 className="text-lg font-bold text-[#E8EEF8] font-mono tracking-tight flex items-center gap-2">
            <Server className="w-5 h-5 text-[#38BDF8]" />
            Centralized Admin Data Management Panel
          </h2>
        </div>
        <p className="text-xs text-[#94A3B8]">
          Direct database administration interface to inspect, query, and audit all primary SQLite models
        </p>
      </div>

      {/* 2. Table Selector Tabs */}
      <div className="flex flex-wrap gap-2 font-mono text-xs">
        {tables.map((t) => (
          <button
            key={t.table_key}
            onClick={() => {
              setActiveTable(t.table_key);
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 border transition-colors cursor-pointer ${
              activeTable === t.table_key
                ? 'bg-[#111C32] text-[#38BDF8] border-[#38BDF8]/50 shadow-sm'
                : 'bg-[#0D1528] text-[#94A3B8] border-[#243149] hover:text-[#E8EEF8]'
            }`}
          >
            <span>{t.table_name}</span>
            <span className="bg-[#080E1E] text-[#E8EEF8] text-[10px] px-2 py-0.5 rounded border border-[#243149]">
              {t.record_count}
            </span>
          </button>
        ))}
      </div>

      {/* 3. Table Records Container */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#111C32] text-[#94A3B8] uppercase text-[10px] border-b border-[#243149]">
              <tr>
                {tableData?.columns?.map((col: string) => (
                  <th key={col} className="p-3">
                    {col}
                  </th>
                ))}
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243149]">
              {loading ? (
                <tr>
                  <td colSpan={tableData?.columns?.length ? tableData.columns.length + 1 : 6} className="p-8 text-center text-[#94A3B8]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#38BDF8]" />
                      <span>Loading records for '{activeTable}'...</span>
                    </div>
                  </td>
                </tr>
              ) : tableData?.items?.length === 0 ? (
                <tr>
                  <td colSpan={tableData?.columns?.length ? tableData.columns.length + 1 : 6} className="p-8 text-center text-[#94A3B8]">
                    No records found in table '{activeTable}'.
                  </td>
                </tr>
              ) : (
                tableData?.items?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-[#111C32] transition-colors">
                    {tableData?.columns?.map((col: string) => (
                      <td key={col} className="p-3 max-w-xs truncate text-[#E8EEF8]">
                        {item[col] !== null && item[col] !== undefined ? String(item[col]) : '—'}
                      </td>
                    ))}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedRecord(item)}
                          className="p-1 rounded hover:bg-[#243149] text-[#38BDF8]"
                          title="Inspect JSON Record"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1 rounded hover:bg-[#243149] text-[#FB7185]"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 border-t border-[#243149] bg-[#080E1E] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="text-[#94A3B8]">
            Table: <strong className="text-[#38BDF8]">{activeTable}</strong> • Total Records:{' '}
            <strong className="text-[#E8EEF8]">{tableData?.total || 0}</strong> (Page {page} of{' '}
            {tableData?.pages || 1})
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded bg-[#111C32] hover:bg-[#243149] disabled:opacity-40 border border-[#243149] text-[#E8EEF8] transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <span className="px-2 text-[#94A3B8]">
              {page} / {tableData?.pages || 1}
            </span>
            <button
              onClick={() => setPage(Math.min(tableData?.pages || 1, page + 1))}
              disabled={page >= (tableData?.pages || 1)}
              className="px-2.5 py-1 rounded bg-[#111C32] hover:bg-[#243149] disabled:opacity-40 border border-[#243149] text-[#E8EEF8] transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. JSON Inspection Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1528] border border-[#243149] rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#243149] pb-3">
              <h3 className="font-bold text-[#E8EEF8] text-sm">
                Record #{selectedRecord.id} • Table: {activeTable}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyJson(selectedRecord)}
                  className="px-2.5 py-1 rounded bg-[#111C32] hover:bg-[#243149] border border-[#243149] text-[#38BDF8] flex items-center gap-1"
                >
                  {copiedJson ? <Check className="w-3 h-3 text-[#34D399]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-[#94A3B8] hover:text-[#E8EEF8]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <pre className="p-4 bg-[#080E1E] border border-[#243149] rounded-lg text-[#E8EEF8] overflow-x-auto max-h-96 text-xs leading-relaxed">
              {JSON.stringify(selectedRecord, null, 2)}
            </pre>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-1.5 rounded-lg bg-[#111C32] hover:bg-[#243149] border border-[#243149] text-[#E8EEF8]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Dialog */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1528] border border-[#FB7185]/40 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center gap-2.5 text-[#FB7185]">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm">Confirm Permanent Deletion</h3>
            </div>

            <p className="text-xs text-[#94A3B8]">
              Are you sure you want to permanently delete record{' '}
              <strong className="text-[#E8EEF8]">#{deleteConfirmId}</strong> from table{' '}
              <strong className="text-[#38BDF8]">{activeTable}</strong>? This action is immutable and logged in the audit trail.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#111C32] border border-[#243149] text-[#94A3B8] hover:text-[#E8EEF8]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRecord}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-lg bg-[#FB7185]/20 hover:bg-[#FB7185]/30 border border-[#FB7185]/50 text-[#FB7185] font-bold"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
