import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { HoneypotEvent } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Search, ShieldAlert, Globe, Server, AlertTriangle,
  CheckCircle2, ExternalLink, Copy, Check, Activity, Shield
} from 'lucide-react';

export const SourceIntelligence: React.FC = () => {
  const [ipInput, setIpInput] = useState('185.220.101.5');
  const [intelData, setIntelData] = useState<any | null>(null);
  const [associatedEvents, setAssociatedEvents] = useState<HoneypotEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const sampleIps = ['185.220.101.5', '193.142.146.210', '45.154.255.88', '194.26.29.112'];

  const handleLookup = async (lookupIp = ipInput) => {
    if (!lookupIp.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const [intel, eventsRes] = await Promise.all([
        apiRequest(`/intelligence/ip/${lookupIp.trim()}`),
        apiRequest<{ items: HoneypotEvent[] }>(`/events?src_ip=${lookupIp.trim()}&page_size=5`).catch(() => ({ items: [] }))
      ]);
      setIntelData(intel);
      setAssociatedEvents(eventsRes.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to lookup IP intelligence');
      setIntelData(null);
      setAssociatedEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleLookup('185.220.101.5');
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans">
      {/* 1. Search Header & Quick Fill */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <h2 className="text-lg font-bold text-[#E8EEF8] font-mono tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#38BDF8]" />
              Source IP Reputation & Network Intelligence
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Enrich external IP addresses with GeoIP location, ASN provider, reputation scoring, and honeypot attack history
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup(ipInput);
          }}
          className="flex flex-col sm:flex-row gap-3 max-w-2xl font-mono text-xs"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              placeholder="Enter IP address (e.g. 185.220.101.5)..."
              className="w-full bg-[#111C32] border border-[#243149] rounded-lg pl-9 pr-4 py-2 text-xs text-[#E8EEF8] placeholder-[#94A3B8] focus:outline-none focus:border-[#38BDF8]/60"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/50 text-[#38BDF8] font-bold text-xs transition-colors cursor-pointer"
          >
            {loading ? 'Investigating...' : 'Investigate Source'}
          </button>
        </form>

        {/* Quick Sample Selectors */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-[#94A3B8] text-[11px]">Recent Attackers:</span>
          {sampleIps.map((ip) => (
            <button
              key={ip}
              onClick={() => {
                setIpInput(ip);
                handleLookup(ip);
              }}
              className="px-2 py-0.5 rounded bg-[#111C32] hover:bg-[#243149] border border-[#243149] text-[#38BDF8] text-[11px] transition-colors cursor-pointer"
            >
              {ip}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 bg-[#FB7185]/10 border border-[#FB7185]/30 text-[#FB7185] text-xs rounded-lg flex items-center gap-2 font-mono">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* 2. Intelligence Results Cards */}
      {intelData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Score & Overview Card */}
            <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm space-y-5 flex flex-col justify-between font-mono">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  Threat Score & Risk Classification
                </span>
                <div className="mt-3 flex items-baseline justify-between">
                  <div className="text-4xl sm:text-5xl font-black text-[#38BDF8]">
                    {intelData.threat_score}
                    <span className="text-lg text-[#94A3B8] font-normal">/100</span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-xs font-bold uppercase border ${
                      intelData.risk_rating === 'Critical'
                        ? 'bg-[#FB7185]/15 text-[#FB7185] border-[#FB7185]/40'
                        : intelData.risk_rating === 'High'
                        ? 'bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/40'
                        : 'bg-[#111C32] text-[#94A3B8] border-[#243149]'
                    }`}
                  >
                    {intelData.risk_rating} Risk
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-[#243149] text-xs">
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Honeypot Attack Count:</span>
                  <strong className="text-[#E8EEF8]">{intelData.total_honeypot_attacks}</strong>
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Known Threat IOC:</span>
                  <strong className={intelData.is_known_ioc ? 'text-[#FB7185] font-bold' : 'text-[#34D399]'}>
                    {intelData.is_known_ioc ? `Yes (${intelData.ioc_category || 'Malicious'})` : 'No'}
                  </strong>
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>First Captured:</span>
                  <span className="text-[#E8EEF8]">
                    {intelData.first_seen ? new Date(intelData.first_seen).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Last Activity:</span>
                  <span className="text-[#E8EEF8]">
                    {intelData.last_seen ? new Date(intelData.last_seen).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Network & Geo Details Card */}
            <div className="lg:col-span-2 bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm space-y-5">
              <h3 className="text-xs font-bold text-[#E8EEF8] uppercase tracking-wider flex items-center gap-2 font-mono">
                <Globe className="w-3.5 h-3.5 text-[#38BDF8]" />
                Geographic & Autonomous System (ASN) Metadata
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 bg-[#111C32] rounded-lg border border-[#243149]">
                  <span className="text-[#94A3B8] uppercase text-[10px]">Targeted IP</span>
                  <div className="font-bold text-[#38BDF8] text-sm flex items-center gap-1.5 mt-0.5">
                    <span>{intelData.ip}</span>
                    <button
                      onClick={() => copyToClipboard(intelData.ip)}
                      className="text-[#94A3B8] hover:text-[#E8EEF8]"
                      title="Copy IP"
                    >
                      {copiedText === intelData.ip ? <Check className="w-3 h-3 text-[#34D399]" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-[#111C32] rounded-lg border border-[#243149]">
                  <span className="text-[#94A3B8] uppercase text-[10px]">Country Origin</span>
                  <div className="font-bold text-[#E8EEF8] text-sm mt-0.5">
                    {intelData.country || 'Unknown'} ({intelData.country_code || '—'})
                  </div>
                </div>
                <div className="p-3 bg-[#111C32] rounded-lg border border-[#243149]">
                  <span className="text-[#94A3B8] uppercase text-[10px]">City Location</span>
                  <div className="font-bold text-[#E8EEF8] text-sm mt-0.5">{intelData.city || 'Unknown'}</div>
                </div>
                <div className="col-span-2 sm:col-span-3 p-3 bg-[#111C32] rounded-lg border border-[#243149]">
                  <span className="text-[#94A3B8] uppercase text-[10px]">ASN Organization / Provider</span>
                  <div className="font-bold text-[#E8EEF8] text-xs mt-0.5">{intelData.asn || 'Unspecified Provider'}</div>
                </div>
              </div>

              {/* Targeted Usernames by this IP */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider font-mono">
                  Credentials Targeted by this Source
                </span>
                <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                  {!intelData.targeted_usernames || intelData.targeted_usernames.length === 0 ? (
                    <span className="text-xs text-[#94A3B8]">No targeted usernames recorded.</span>
                  ) : (
                    intelData.targeted_usernames.map((u: string) => (
                      <span key={u} className="px-2.5 py-1 rounded bg-[#111C32] border border-[#243149] text-[#E8EEF8]">
                        {u}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Associated Honeypot Captures Table */}
          <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm space-y-3 font-mono text-xs">
            <h3 className="text-xs font-bold text-[#E8EEF8] uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#38BDF8]" />
              Associated Honeypot Intrusion Captures ({associatedEvents.length})
            </h3>

            {associatedEvents.length === 0 ? (
              <p className="text-[#94A3B8] py-4 text-center">No recent direct honeypot events recorded for this IP.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#111C32] text-[#94A3B8] border-b border-[#243149] uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Event ID</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Protocol</th>
                      <th className="py-2.5 px-3">Target User</th>
                      <th className="py-2.5 px-3">Command / Action</th>
                      <th className="py-2.5 px-3">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#243149]">
                    {associatedEvents.map((ev) => (
                      <tr key={ev.id} className="hover:bg-[#111C32] transition-colors">
                        <td className="py-2.5 px-3 font-bold text-[#E8EEF8]">#{ev.id}</td>
                        <td className="py-2.5 px-3 text-[#94A3B8]">{new Date(ev.timestamp).toLocaleString()}</td>
                        <td className="py-2.5 px-3"><StatusBadge status={ev.protocol} type="protocol" /></td>
                        <td className="py-2.5 px-3 text-[#E8EEF8]">{ev.username || '—'}</td>
                        <td className="py-2.5 px-3 text-[#94A3B8] max-w-xs truncate">{ev.command || ev.file_hash || '—'}</td>
                        <td className="py-2.5 px-3"><StatusBadge status={ev.severity} type="severity" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
