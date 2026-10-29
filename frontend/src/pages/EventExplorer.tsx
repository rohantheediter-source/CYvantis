import React, { useState, useEffect } from 'react';
import { apiRequest, downloadFile } from '../services/api';
import { HoneypotEvent } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Search, Download, Filter, ChevronLeft, ChevronRight, Eye, Code,
  Calendar, Copy, Check, RefreshCw, X, Shield, ArrowUpDown
} from 'lucide-react';

export const EventExplorer: React.FC = () => {
  const [events, setEvents] = useState<HoneypotEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [protocol, setProtocol] = useState('');
  const [severity, setSeverity] = useState('');
  const [country, setCountry] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected event for Drawer
  const [selectedEvent, setSelectedEvent] = useState<HoneypotEvent | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<'csv' | 'json' | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('page_size', pageSize.toString());
      if (search) params.append('search', search);
      if (protocol) params.append('protocol', protocol);
      if (severity) params.append('severity', severity);
      if (country) params.append('country', country);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const data = await apiRequest<{
        total: number;
        page: number;
        page_size: number;
        pages: number;
        items: HoneypotEvent[];
      }>(`/events?${params.toString()}`);

      setEvents(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, pageSize, protocol, severity, country]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleExportCsv = async () => {
    setIsExporting('csv');
    try {
      await downloadFile(
        `/events/export/csv?protocol=${protocol}&severity=${severity}&search=${search}`,
        'cyvantis_events.csv'
      );
    } catch (err: any) {
      alert('CSV Export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportJson = async () => {
    setIsExporting('json');
    try {
      await downloadFile(
        `/events/export/json?protocol=${protocol}&severity=${severity}&search=${search}`,
        'cyvantis_events.json'
      );
    } catch (err: any) {
      alert('JSON Export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExporting(null);
    }
  };

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-12">
      {/* 1. Header & Actions Bar */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
              <h2 className="text-lg font-bold text-[#E8EEF8] font-mono tracking-tight">
                Honeypot Event Explorer
              </h2>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Query, filter, inspect, and export immutable captured intrusion records ({total.toLocaleString()} total)
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={handleExportCsv}
              disabled={isExporting !== null}
              className="px-3 py-1.5 rounded-lg bg-[#111C32] hover:bg-[#243149] text-[#38BDF8] border border-[#243149] hover:border-[#38BDF8]/40 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting === 'csv' ? 'Exporting...' : 'Export CSV'}</span>
            </button>
            <button
              onClick={handleExportJson}
              disabled={isExporting !== null}
              className="px-3 py-1.5 rounded-lg bg-[#111C32] hover:bg-[#243149] text-[#818CF8] border border-[#243149] hover:border-[#818CF8]/40 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
              <span>{isExporting === 'json' ? 'Exporting...' : 'Export JSON'}</span>
            </button>
          </div>
        </div>

        {/* 2. Multi-Parameter Filter Form */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 font-mono text-xs">
          {/* Keyword Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search IP, User, Command, Session..."
              className="w-full bg-[#111C32] border border-[#243149] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#E8EEF8] placeholder-[#94A3B8] focus:outline-none focus:border-[#38BDF8]/60"
            />
          </div>

          {/* Protocol Filter */}
          <select
            value={protocol}
            onChange={(e) => { setProtocol(e.target.value); setPage(1); }}
            className="bg-[#111C32] border border-[#243149] rounded-lg px-2.5 py-1.5 text-xs text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8]/60 cursor-pointer"
          >
            <option value="" className="bg-[#0D1528]">All Protocols</option>
            <option value="SSH" className="bg-[#0D1528]">SSH</option>
            <option value="Telnet" className="bg-[#0D1528]">Telnet</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severity}
            onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
            className="bg-[#111C32] border border-[#243149] rounded-lg px-2.5 py-1.5 text-xs text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8]/60 cursor-pointer"
          >
            <option value="" className="bg-[#0D1528]">All Severities</option>
            <option value="critical" className="bg-[#0D1528]">Critical</option>
            <option value="high" className="bg-[#0D1528]">High</option>
            <option value="medium" className="bg-[#0D1528]">Medium</option>
            <option value="low" className="bg-[#0D1528]">Low</option>
          </select>

          {/* Country Filter */}
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Country (e.g. Russia)..."
            className="bg-[#111C32] border border-[#243149] rounded-lg px-2.5 py-1.5 text-xs text-[#E8EEF8] placeholder-[#94A3B8] focus:outline-none focus:border-[#38BDF8]/60"
          />

          {/* Submit / Apply Filter */}
          <button
            type="submit"
            className="bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 text-[#38BDF8] border border-[#38BDF8]/40 rounded-lg px-3 py-1.5 font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            Apply Filters
          </button>
        </form>
      </div>

      {/* 3. Event Table */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#111C32] text-[#94A3B8] border-b border-[#243149] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Source IP</th>
                <th className="py-3 px-4">Protocol</th>
                <th className="py-3 px-4">Country / ASN</th>
                <th className="py-3 px-4">Target User</th>
                <th className="py-3 px-4">Command / Payload</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243149]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#94A3B8]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#38BDF8]" />
                      <span>Loading captured security events...</span>
                    </div>
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#94A3B8]">
                    No security events found matching current criteria.
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="hover:bg-[#111C32] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-bold text-[#E8EEF8]">
                      #{ev.id}
                    </td>
                    <td className="py-3 px-4 text-[#94A3B8] text-[11px]">
                      {new Date(ev.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#38BDF8]">
                      <div className="flex items-center gap-1.5">
                        <span>{ev.src_ip}</span>
                        <button
                          onClick={(e) => copyToClipboard(ev.src_ip, e)}
                          className="text-[#94A3B8] hover:text-[#E8EEF8] opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Copy Source IP"
                        >
                          {copiedText === ev.src_ip ? <Check className="w-3 h-3 text-[#34D399]" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={ev.protocol} type="protocol" />
                    </td>
                    <td className="py-3 px-4 text-[#E8EEF8] text-[11px]">
                      {ev.country || 'Unknown'} {ev.asn ? `(${ev.asn})` : ''}
                    </td>
                    <td className="py-3 px-4 text-[#E8EEF8]">
                      {ev.username || '—'}
                    </td>
                    <td className="py-3 px-4 text-[#94A3B8] max-w-xs truncate">
                      {ev.command || ev.file_hash || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={ev.severity} type="severity" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                        }}
                        className="p-1 rounded hover:bg-[#243149] text-[#94A3B8] hover:text-[#38BDF8]"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Pagination Footer */}
        <div className="p-3.5 border-t border-[#243149] bg-[#080E1E] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="text-[#94A3B8]">
            Showing <strong className="text-[#E8EEF8]">{events.length}</strong> of{' '}
            <strong className="text-[#38BDF8]">{total.toLocaleString()}</strong> events (Page {page} of {pages})
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
              {page} / {pages}
            </span>
            <button
              onClick={() => setPage(Math.min(pages, page + 1))}
              disabled={page >= pages}
              className="px-2.5 py-1 rounded bg-[#111C32] hover:bg-[#243149] disabled:opacity-40 border border-[#243149] text-[#E8EEF8] transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Event Detail Slide-Out Drawer / Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1528] border border-[#243149] rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#243149] pb-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedEvent.severity} type="severity" />
                <h3 className="font-bold text-[#E8EEF8] text-sm">
                  Event #{selectedEvent.id} • {selectedEvent.eventid}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-[#94A3B8] hover:text-[#E8EEF8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded bg-[#111C32] border border-[#243149]">
                <span className="text-[#94A3B8] block text-[10px]">SOURCE IP</span>
                <span className="text-[#38BDF8] font-bold">{selectedEvent.src_ip}</span>
              </div>
              <div className="p-2.5 rounded bg-[#111C32] border border-[#243149]">
                <span className="text-[#94A3B8] block text-[10px]">PROTOCOL / PORT</span>
                <span className="text-[#E8EEF8]">{selectedEvent.protocol} : {selectedEvent.dst_port}</span>
              </div>
              <div className="p-2.5 rounded bg-[#111C32] border border-[#243149]">
                <span className="text-[#94A3B8] block text-[10px]">GEOLOCATION</span>
                <span className="text-[#E8EEF8]">{selectedEvent.country || 'Unknown'} ({selectedEvent.asn || 'N/A'})</span>
              </div>
              <div className="p-2.5 rounded bg-[#111C32] border border-[#243149]">
                <span className="text-[#94A3B8] block text-[10px]">TIMESTAMP</span>
                <span className="text-[#E8EEF8]">{new Date(selectedEvent.timestamp).toISOString()}</span>
              </div>
            </div>

            {selectedEvent.username && (
              <div className="p-2.5 rounded bg-[#111C32] border border-[#243149]">
                <span className="text-[#94A3B8] block text-[10px]">TARGET CREDENTIALS</span>
                <span className="text-[#E8EEF8]">
                  Username: <strong>{selectedEvent.username}</strong> | Password: <strong>{selectedEvent.password ? '••••••••' : 'None'}</strong>
                </span>
              </div>
            )}

            {selectedEvent.command && (
              <div className="space-y-1">
                <span className="text-[#94A3B8] text-[10px]">CAPTURED SHELL COMMAND</span>
                <pre className="p-3 bg-[#080E1E] border border-[#243149] rounded-lg text-[#38BDF8] overflow-x-auto text-xs">
                  {selectedEvent.command}
                </pre>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[#94A3B8] text-[10px]">RAW JSON TELEMETRY RECORD</span>
              <pre className="p-3 bg-[#080E1E] border border-[#243149] rounded-lg text-[#E8EEF8] overflow-x-auto max-h-40 text-[11px]">
                {JSON.stringify(selectedEvent, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 rounded-lg bg-[#111C32] hover:bg-[#243149] border border-[#243149] text-[#E8EEF8]"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
