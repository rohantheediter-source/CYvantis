import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { ThreatIntelIOC } from '../types';
import {
  Database, Plus, Key, Shield, Hash, Globe, Server, Check,
  Search, Filter, ExternalLink, X, AlertTriangle, Eye, Copy
} from 'lucide-react';

export const ThreatIntelligence: React.FC = () => {
  const [iocs, setIocs] = useState<ThreatIntelIOC[]>([]);
  const [loading, setLoading] = useState(true);
  const [iocSearch, setIocSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Add IOC modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [indicator, setIndicator] = useState('');
  const [iocType, setIocType] = useState<'ip' | 'domain' | 'hash'>('ip');
  const [threatScore, setThreatScore] = useState(75);
  const [category, setCategory] = useState('Malicious Host');
  const [description, setDescription] = useState('');
  const [isSubmittingIoc, setIsSubmittingIoc] = useState(false);

  // URL Scanner state
  const [scanUrlInput, setScanUrlInput] = useState('');
  const [scanningUrl, setScanningUrl] = useState(false);
  const [urlScanResult, setUrlScanResult] = useState<any>(null);
  const [copiedIndicator, setCopiedIndicator] = useState<string | null>(null);

  const fetchIocs = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<ThreatIntelIOC[]>('/intelligence/iocs');
      setIocs(data || []);
    } catch (err) {
      console.error('Failed to fetch IOCs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIocs();
  }, []);

  const handleAddIoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingIoc(true);
    try {
      await apiRequest('/intelligence/iocs', {
        method: 'POST',
        body: JSON.stringify({
          indicator,
          ioc_type: iocType,
          threat_score: threatScore,
          category,
          description,
          source: 'CYVANTIS Analyst Entry'
        })
      });
      setIsModalOpen(false);
      setIndicator('');
      setDescription('');
      fetchIocs();
    } catch (err: any) {
      alert(err.message || 'Failed to add IOC');
    } finally {
      setIsSubmittingIoc(false);
    }
  };

  const handleScanUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanUrlInput.trim()) return;
    setScanningUrl(true);
    setUrlScanResult(null);
    try {
      const data = await apiRequest('/intelligence/url-scan', {
        method: 'POST',
        body: JSON.stringify({
          url: scanUrlInput
        })
      });
      setUrlScanResult(data);
    } catch (err: any) {
      alert(err.message || 'URL Scan failed');
    } finally {
      setScanningUrl(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndicator(text);
    setTimeout(() => setCopiedIndicator(null), 2000);
  };

  const filteredIocs = iocs.filter((ioc) => {
    if (typeFilter !== 'all' && ioc.ioc_type.toLowerCase() !== typeFilter.toLowerCase()) {
      return false;
    }
    if (iocSearch.trim()) {
      const q = iocSearch.toLowerCase();
      return (
        ioc.indicator.toLowerCase().includes(q) ||
        ioc.category.toLowerCase().includes(q) ||
        ioc.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans">
      {/* 1. Header & Add IOC Button */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <h2 className="text-lg font-bold text-[#E8EEF8] font-mono tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-[#38BDF8]" />
              Threat Intelligence & IOC Management
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Indicators of Compromise (IOCs), reputation correlation feeds, and live URL threat intelligence
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/50 text-[#38BDF8] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto font-mono"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Indicator</span>
        </button>
      </div>

      {/* 2. Integration Status Overview (Display status without exposing secrets) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
        <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#E8EEF8] block">VirusTotal Enrichment Service</span>
              <span className="text-[11px] text-[#94A3B8]">Key: ••••••••••••••••• (Active Backend Integration)</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-[#34D399]/15 border border-[#34D399]/40 text-[#34D399] font-bold text-[10px]">
            CONNECTED
          </span>
        </div>

        <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#818CF8]/10 border border-[#818CF8]/30 flex items-center justify-center text-[#818CF8]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#E8EEF8] block">AbuseIPDB Threat Feed</span>
              <span className="text-[11px] text-[#94A3B8]">Key: ••••••••••••••••• (Reputation Feed Sync)</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-[#34D399]/15 border border-[#34D399]/40 text-[#34D399] font-bold text-[10px]">
            SYNCHRONIZED
          </span>
        </div>
      </div>

      {/* 3. Live URL Threat & Virus Scanner */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#E8EEF8] uppercase tracking-wider flex items-center gap-2 font-mono">
              <Globe className="w-3.5 h-3.5 text-[#38BDF8]" />
              Live URL Threat & Malware Reputation Scanner
            </h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Inspect suspicious domain and URL payloads for redirect chains, SSL certificates, and threat heuristics
            </p>
          </div>
        </div>

        <form onSubmit={handleScanUrl} className="flex flex-col sm:flex-row gap-2.5 font-mono text-xs">
          <input
            type="text"
            required
            value={scanUrlInput}
            onChange={(e) => setScanUrlInput(e.target.value)}
            placeholder="Enter URL to inspect (e.g. http://malicious-node.xyz/dropper or https://example.com)..."
            className="flex-1 bg-[#111C32] border border-[#243149] rounded-lg px-3.5 py-2 text-xs text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8]/60"
          />
          <button
            type="submit"
            disabled={scanningUrl}
            className="px-4 py-2 rounded-lg bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/50 text-[#38BDF8] font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {scanningUrl ? 'Scanning...' : 'Scan Target URL'}
          </button>
        </form>

        {urlScanResult && (
          <div className="p-4 rounded-lg bg-[#111C32] border border-[#243149] space-y-3 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#243149] pb-2">
              <span className="text-[#E8EEF8] font-bold truncate max-w-md">{urlScanResult.url}</span>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                    urlScanResult.verdict?.includes('CLEAN')
                      ? 'bg-[#34D399]/15 text-[#34D399] border-[#34D399]/40'
                      : 'bg-[#FB7185]/15 text-[#FB7185] border-[#FB7185]/40'
                  }`}
                >
                  {urlScanResult.verdict}
                </span>
                <span className="text-[#94A3B8]">
                  Score: <strong className="text-[#38BDF8]">{urlScanResult.risk_score}</strong>/100
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded bg-[#0D1528] border border-[#243149]">
                <span className="text-[#94A3B8] block text-[10px]">RESOLVED IPS</span>
                <span className="text-[#E8EEF8] font-bold truncate block">
                  {urlScanResult.ip_addresses?.length ? urlScanResult.ip_addresses.join(', ') : 'None'}
                </span>
              </div>
              <div className="p-2 rounded bg-[#0D1528] border border-[#243149]">
                <span className="text-[#94A3B8] block text-[10px]">HTTP STATUS</span>
                <span className="text-[#E8EEF8] font-bold block">{urlScanResult.http_status || 'Unreachable'}</span>
              </div>
              <div className="p-2 rounded bg-[#0D1528] border border-[#243149]">
                <span className="text-[#94A3B8] block text-[10px]">REDIRECTS</span>
                <span className="text-[#E8EEF8] font-bold block">{urlScanResult.is_redirected ? 'Yes' : 'No'}</span>
              </div>
              <div className="p-2 rounded bg-[#0D1528] border border-[#243149]">
                <span className="text-[#94A3B8] block text-[10px]">SSL CERTIFICATE</span>
                <span className="text-[#E8EEF8] font-bold block">
                  {urlScanResult.ssl_info ? (urlScanResult.ssl_info.valid ? 'Valid TLS' : 'Invalid') : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. IOC Indicator Table */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[#E8EEF8] uppercase tracking-wider">
              Indicators of Compromise (IOC) Database ({filteredIocs.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={iocSearch}
                onChange={(e) => setIocSearch(e.target.value)}
                placeholder="Search IOC indicator, category..."
                className="bg-[#111C32] border border-[#243149] rounded-lg pl-8 pr-3 py-1 text-xs text-[#E8EEF8] placeholder-[#94A3B8] focus:outline-none focus:border-[#38BDF8]/60"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#111C32] border border-[#243149] rounded-lg px-2.5 py-1 text-xs text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8]/60 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="ip">IP Addresses</option>
              <option value="domain">Domains</option>
              <option value="hash">File Hashes</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#111C32] text-[#94A3B8] uppercase text-[10px] border-b border-[#243149]">
              <tr>
                <th className="p-3">Indicator</th>
                <th className="p-3">Type</th>
                <th className="p-3">Category</th>
                <th className="p-3">Threat Score</th>
                <th className="p-3">Source & Provenance</th>
                <th className="p-3">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243149]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[#94A3B8]">Loading threat IOCs...</td>
                </tr>
              ) : filteredIocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[#94A3B8]">No threat IOCs found matching criteria.</td>
                </tr>
              ) : (
                filteredIocs.map((ioc) => (
                  <tr key={ioc.id} className="hover:bg-[#111C32] transition-colors group">
                    <td className="p-3 font-bold text-[#38BDF8] flex items-center gap-1.5">
                      <span>{ioc.indicator}</span>
                      <button
                        onClick={() => copyToClipboard(ioc.indicator)}
                        className="text-[#94A3B8] hover:text-[#E8EEF8] opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy Indicator"
                      >
                        {copiedIndicator === ioc.indicator ? <Check className="w-3 h-3 text-[#34D399]" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-[#111C32] border border-[#243149] text-[#818CF8] uppercase text-[10px]">
                        {ioc.ioc_type}
                      </span>
                    </td>
                    <td className="p-3 text-[#E8EEF8]">{ioc.category}</td>
                    <td className="p-3">
                      <span
                        className={`font-bold ${
                          ioc.threat_score >= 80
                            ? 'text-[#FB7185]'
                            : ioc.threat_score >= 60
                            ? 'text-[#FBBF24]'
                            : 'text-[#38BDF8]'
                        }`}
                      >
                        {ioc.threat_score}/100
                      </span>
                    </td>
                    <td className="p-3 text-[#94A3B8]">{ioc.source}</td>
                    <td className="p-3 text-[#94A3B8] text-[11px]">
                      {new Date(ioc.last_seen).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Add IOC Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddIoc}
            className="bg-[#0D1528] border border-[#243149] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs"
          >
            <div className="flex items-center justify-between border-b border-[#243149] pb-3">
              <h3 className="font-bold text-[#E8EEF8] text-sm">Add Indicator of Compromise (IOC)</h3>
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
                <label className="text-[#94A3B8] text-[11px]">INDICATOR VALUE</label>
                <input
                  type="text"
                  required
                  value={indicator}
                  onChange={(e) => setIndicator(e.target.value)}
                  placeholder="e.g. 185.220.101.5, bad-domain.xyz, or SHA256 hash"
                  className="w-full bg-[#111C32] border border-[#243149] rounded-lg px-3 py-2 text-xs text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8]/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#94A3B8] text-[11px]">TYPE</label>
                  <select
                    value={iocType}
                    onChange={(e) => setIocType(e.target.value as any)}
                    className="w-full bg-[#111C32] border border-[#243149] rounded-lg px-3 py-2 text-xs text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8]/60 cursor-pointer"
                  >
                    <option value="ip">IP Address</option>
                    <option value="domain">Domain Name</option>
                    <option value="hash">File Hash</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[#94A3B8] text-[11px]">THREAT SCORE (0-100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={threatScore}
                    onChange={(e) => setThreatScore(Number(e.target.value))}
                    className="w-full bg-[#111C32] border border-[#243149] rounded-lg px-3 py-2 text-xs text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8]/60"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] text-[11px]">CATEGORY</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Botnet C2, Brute-Force Scanner, Dropper Host"
                  className="w-full bg-[#111C32] border border-[#243149] rounded-lg px-3 py-2 text-xs text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8]/60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] text-[11px]">DESCRIPTION & PROVENANCE</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Observations from Cowrie captures or external threat intelligence..."
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
                disabled={isSubmittingIoc}
                className="px-4 py-1.5 rounded-lg bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/50 text-[#38BDF8] font-bold"
              >
                {isSubmittingIoc ? 'Adding...' : 'Add Indicator'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
