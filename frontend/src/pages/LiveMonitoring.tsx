import React, { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { HoneypotEvent } from '../types';
import {
  Radio, Pause, Play, Trash2, Filter, Terminal, Wifi,
  Search, ArrowDown, Eye, Copy, Check, Download, Shield
} from 'lucide-react';

export const LiveMonitoring: React.FC = () => {
  const { liveEvents, isConnected, isPaused, togglePause, clearLiveEvents } = useWebSocket();
  const [protocolFilter, setProtocolFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'structured' | 'terminal'>('structured');
  const [selectedEvent, setSelectedEvent] = useState<HoneypotEvent | null>(null);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const filteredEvents = liveEvents.filter((ev) => {
    if (protocolFilter !== 'all' && ev.protocol.toLowerCase() !== protocolFilter.toLowerCase()) {
      return false;
    }
    if (severityFilter !== 'all' && ev.severity.toLowerCase() !== severityFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchIp = ev.src_ip.toLowerCase().includes(q);
      const matchUser = ev.username?.toLowerCase().includes(q);
      const matchCmd = ev.command?.toLowerCase().includes(q);
      const matchCountry = ev.country?.toLowerCase().includes(q);
      if (!matchIp && !matchUser && !matchCmd && !matchCountry) return false;
    }
    return true;
  });

  useEffect(() => {
    if (autoScroll && !isPaused && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredEvents.length, autoScroll, isPaused]);

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedIp(text);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-10">
      {/* 1. Header & Connection Status */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8] shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#E8EEF8] font-mono tracking-tight">
                Live Honeypot Telemetry Monitor
              </h2>
              {isConnected ? (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#34D399]/15 border border-[#34D399]/40 text-[#34D399] font-mono text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-ping" />
                  WS CONNECTED
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#FB7185]/15 border border-[#FB7185]/40 text-[#FB7185] font-mono text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FB7185]" />
                  RECONNECTING
                </span>
              )}
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Continuous Cowrie intrusion stream • Captured attacks, auth attempts, and shell activity
            </p>
          </div>
        </div>

        {/* Stream Actions */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {/* Pause / Resume */}
          <button
            onClick={togglePause}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 border transition-all cursor-pointer ${
              isPaused
                ? 'bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/40 hover:bg-[#FBBF24]/25'
                : 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/40 hover:bg-[#38BDF8]/25'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume Display' : 'Pause Display'}</span>
          </button>

          {/* Clear Buffer */}
          <button
            onClick={clearLiveEvents}
            className="px-3 py-1.5 rounded-lg bg-[#111C32] hover:bg-[#243149] text-[#94A3B8] hover:text-[#E8EEF8] border border-[#243149] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Buffer</span>
          </button>
        </div>
      </div>

      {/* 2. Filter & View Mode Bar */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search filter */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search IP, user, command..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111C32] border border-[#243149] rounded-lg pl-8 pr-3 py-1 text-xs text-[#E8EEF8] placeholder-[#94A3B8] focus:outline-none focus:border-[#38BDF8]/60"
            />
          </div>

          {/* Protocol filter */}
          <div className="flex items-center gap-1.5 bg-[#111C32] border border-[#243149] rounded-lg px-2.5 py-1">
            <span className="text-[#94A3B8] text-[11px]">Proto:</span>
            <select
              value={protocolFilter}
              onChange={(e) => setProtocolFilter(e.target.value)}
              className="bg-transparent text-[#E8EEF8] focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0D1528]">All</option>
              <option value="ssh" className="bg-[#0D1528]">SSH Only</option>
              <option value="telnet" className="bg-[#0D1528]">Telnet Only</option>
            </select>
          </div>

          {/* Severity filter */}
          <div className="flex items-center gap-1.5 bg-[#111C32] border border-[#243149] rounded-lg px-2.5 py-1">
            <span className="text-[#94A3B8] text-[11px]">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-[#E8EEF8] focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0D1528]">All</option>
              <option value="critical" className="bg-[#0D1528]">Critical</option>
              <option value="high" className="bg-[#0D1528]">High</option>
              <option value="medium" className="bg-[#0D1528]">Medium</option>
              <option value="low" className="bg-[#0D1528]">Low</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto Scroll toggle */}
          <label className="flex items-center gap-1.5 text-[#94A3B8] cursor-pointer hover:text-[#E8EEF8]">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded bg-[#111C32] border-[#243149] text-[#38BDF8] focus:ring-0"
            />
            <span className="text-[11px]">Auto-Scroll</span>
          </label>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#111C32] p-0.5 rounded-lg border border-[#243149]">
            <button
              onClick={() => setViewMode('structured')}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                viewMode === 'structured'
                  ? 'bg-[#0D1528] text-[#38BDF8] font-bold border border-[#38BDF8]/40'
                  : 'text-[#94A3B8] hover:text-[#E8EEF8]'
              }`}
            >
              Structured
            </button>
            <button
              onClick={() => setViewMode('terminal')}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors flex items-center gap-1 ${
                viewMode === 'terminal'
                  ? 'bg-[#0D1528] text-[#38BDF8] font-bold border border-[#38BDF8]/40'
                  : 'text-[#94A3B8] hover:text-[#E8EEF8]'
              }`}
            >
              <Terminal className="w-3 h-3" />
              Raw Terminal
            </button>
          </div>

          {/* Buffer Counter */}
          <span className="text-[11px] text-[#94A3B8]">
            Showing <strong className="text-[#38BDF8]">{filteredEvents.length}</strong> / {liveEvents.length}
          </span>
        </div>
      </div>

      {/* 3. Live Stream Body */}
      {viewMode === 'structured' ? (
        <div className="bg-[#0D1528] border border-[#243149] rounded-xl overflow-hidden shadow-sm">
          <div className="h-[560px] overflow-y-auto divide-y divide-[#243149] font-mono text-xs">
            {filteredEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#94A3B8] p-8 text-center">
                <Radio className="w-8 h-8 text-[#38BDF8]/40 animate-pulse mb-3" />
                <p className="font-semibold text-[#E8EEF8]">Listening for Honeypot Telemetry...</p>
                <p className="text-xs text-[#94A3B8] mt-1">
                  {isPaused
                    ? 'Stream display is paused. Click "Resume Display" to update.'
                    : 'Attacks will appear here as incoming packets are captured on ports 22 & 23.'}
                </p>
              </div>
            ) : (
              filteredEvents.map((ev, idx) => (
                <div
                  key={`${ev.id}-${ev.timestamp}-${idx}`}
                  onClick={() => setSelectedEvent(ev)}
                  className="p-3.5 hover:bg-[#111C32] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                    <span className="text-[11px] text-[#94A3B8] shrink-0">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                    <StatusBadge status={ev.protocol} type="protocol" />
                    <span className="font-bold text-[#38BDF8] flex items-center gap-1">
                      {ev.src_ip}
                      <button
                        onClick={(e) => copyToClipboard(ev.src_ip, e)}
                        className="text-[#94A3B8] hover:text-[#E8EEF8] opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy IP"
                      >
                        {copiedIp === ev.src_ip ? <Check className="w-3 h-3 text-[#34D399]" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </span>
                    <span className="text-[#94A3B8] text-[11px] truncate">
                      {ev.country || 'Unknown'} {ev.city ? `(${ev.city})` : ''}
                    </span>
                    <span className="text-[11px] text-[#E8EEF8] bg-[#111C32] px-2 py-0.5 rounded border border-[#243149]">
                      {ev.eventid}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 text-[11px] shrink-0">
                    {ev.username && (
                      <span className="text-[#94A3B8]">
                        user:<strong className="text-[#E8EEF8]">{ev.username}</strong>
                      </span>
                    )}
                    {ev.command && (
                      <span className="bg-[#080E1E] px-2 py-0.5 rounded text-[#38BDF8] border border-[#243149] max-w-xs truncate">
                        $ {ev.command}
                      </span>
                    )}
                    <StatusBadge status={ev.severity} type="severity" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(ev);
                      }}
                      className="p-1 rounded hover:bg-[#243149] text-[#94A3B8] hover:text-[#38BDF8]"
                      title="Inspect Event"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>
      ) : (
        /* Raw Terminal Log View */
        <div className="bg-[#080E1E] border border-[#243149] rounded-xl overflow-hidden font-mono shadow-sm">
          <div className="bg-[#0D1528] px-4 py-2 border-b border-[#243149] flex items-center justify-between text-xs text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FB7185]/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#34D399]/80" />
              <span className="text-[#E8EEF8] font-bold ml-2">cowrie.telemetry.stream.log</span>
            </div>
            <span>{isPaused ? '[STREAM BUFFER PAUSED]' : '[STREAM ACTIVE]'}</span>
          </div>

          <div className="p-4 h-[560px] overflow-y-auto space-y-1.5 text-xs text-[#94A3B8]">
            {filteredEvents.length === 0 ? (
              <div className="text-[#94A3B8] font-mono py-8 text-center">
                [+] Awaiting live telemetry frames...
              </div>
            ) : (
              filteredEvents.map((ev, i) => (
                <div key={i} className="hover:bg-[#111C32]/60 px-2 py-0.5 rounded flex items-start gap-2">
                  <span className="text-[#94A3B8]/60 shrink-0">
                    [{new Date(ev.timestamp).toISOString()}]
                  </span>
                  <span className="text-[#818CF8] shrink-0">[{ev.protocol}:{ev.dst_port}]</span>
                  <span className="text-[#38BDF8] shrink-0">{ev.src_ip}</span>
                  <span className="text-[#E8EEF8] truncate">
                    {ev.eventid}
                    {ev.username ? ` (user=${ev.username})` : ''}
                    {ev.command ? ` [cmd="${ev.command}"]` : ''}
                  </span>
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>
      )}

      {/* 4. Event Detail Modal Drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1528] border border-[#243149] rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#243149] pb-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedEvent.severity} type="severity" />
                <h3 className="font-bold text-[#E8EEF8] font-mono text-sm">
                  Telemetry Record #{selectedEvent.id} • {selectedEvent.eventid}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-[#94A3B8] hover:text-[#E8EEF8] font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
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
                <span className="text-[#94A3B8] block text-[10px]">CREDENTIALS ATTEMPT</span>
                <span className="text-[#E8EEF8]">
                  {selectedEvent.username || '—'} : {selectedEvent.password ? '••••••••' : '—'}
                </span>
              </div>
            </div>

            {selectedEvent.command && (
              <div className="space-y-1">
                <span className="text-xs font-mono text-[#94A3B8]">EXECUTED COMMAND</span>
                <pre className="p-3 bg-[#080E1E] border border-[#243149] rounded-lg text-xs font-mono text-[#38BDF8] overflow-x-auto">
                  {selectedEvent.command}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 rounded-lg bg-[#111C32] hover:bg-[#243149] border border-[#243149] text-xs font-mono text-[#E8EEF8]"
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
