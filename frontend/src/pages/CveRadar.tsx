import React, { useState, useEffect } from 'react';
import { 
  Radio, Search, AlertTriangle, ShieldAlert, CheckCircle2, 
  ExternalLink, Filter, RefreshCw, Cpu, Tag, BookOpen, ChevronDown, ChevronUp
} from 'lucide-react';
import { apiRequest } from '../services/api';

interface Advisory {
  cve_id: string;
  title: string;
  severity: string;
  cvss_score: number;
  vendor: string;
  product: string;
  published_date: string;
  cisa_kev: boolean;
  exploitation_status: string;
  summary: string;
  mitigation: string;
  references: string[];
}

interface RadarData {
  timestamp: string;
  total_advisories: number;
  critical_count: number;
  cisa_kev_count: number;
  average_cvss: number;
  returned_count: number;
  advisories: Advisory[];
}

export const CveRadar: React.FC = () => {
  const [data, setData] = useState<RadarData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [kevOnly, setKevOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Expanded advisory state
  const [expandedCve, setExpandedCve] = useState<string | null>(null);

  const fetchRadarData = async () => {
    setLoading(true);
    try {
      let queryParams = `?severity=${encodeURIComponent(severityFilter)}&cisa_kev_only=${kevOnly}`;
      if (searchQuery) {
        queryParams += `&q=${encodeURIComponent(searchQuery)}`;
      }
      const json = await apiRequest(`/advisories/cve-radar${queryParams}`);
      setData(json);
    } catch (err) {
      console.error("Failed to fetch CVE Radar feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRadarData();
  }, [severityFilter, kevOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRadarData();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Radio className="w-7 h-7 text-rose-500 animate-pulse" />
            <h1 className="text-xl font-bold text-white tracking-wide">
              Threat Advisory & CVE Radar Feed
            </h1>
            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              Live CISA KEV Radar
            </span>
          </div>
          <p className="text-slate-400 text-xs max-w-2xl">
            Real-time threat intelligence feed tracking critical vulnerabilities (CVEs), CISA Known Exploited Vulnerabilities (KEV), vendor patch advisories, and defensive mitigation steps.
          </p>
        </div>

        <button
          onClick={() => fetchRadarData()}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-medium text-xs px-4 py-2.5 rounded-lg shadow-lg shadow-rose-900/30 transition-all disabled:opacity-50 shrink-0 font-mono"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Radar Feed
        </button>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Total Active Advisories</span>
            <BookOpen className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{data?.total_advisories || 0} CVEs</div>
          <p className="text-[11px] text-cyan-400 mt-1 font-mono">Real-time Intelligence Dataset</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Critical Vulnerabilities</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{data?.critical_count || 0} Critical</div>
          <p className="text-[11px] text-rose-400 mt-1 font-mono">CVSS Score 9.0 - 10.0</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">CISA KEV Active Exploits</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{data?.cisa_kev_count || 0} KEV Active</div>
          <p className="text-[11px] text-amber-400 mt-1 font-mono">In-The-Wild Exploitation</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Average Feed CVSS Score</span>
            <Tag className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{data?.average_cvss || 0} / 10</div>
          <p className="text-[11px] text-purple-400 mt-1 font-mono">Weighted Risk Exposure</p>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
        {/* Severity Filter Pills */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold uppercase text-[11px] mr-1">Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                severityFilter === sev
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-glow-rose'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* CISA KEV Only Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 font-bold">
          <input
            type="checkbox"
            checked={kevOnly}
            onChange={(e) => setKevOnly(e.target.checked)}
            className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-rose-500 focus:ring-rose-500"
          />
          CISA KEV Active Exploits Only
        </label>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search CVE, Vendor, Product..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>
          <button
            type="submit"
            className="bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-all"
          >
            Search
          </button>
        </form>
      </div>

      {/* Advisory Feed Cards */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex items-center gap-3 text-rose-400 font-mono text-sm">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Polling Threat Advisory & CVE Radar Feed...
          </div>
        </div>
      ) : data?.advisories.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 text-center text-slate-400 font-mono text-xs">
          No threat advisories matched the selected filter criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {data?.advisories.map((advisory) => {
            const isExpanded = expandedCve === advisory.cve_id;

            return (
              <div 
                key={advisory.cve_id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 font-mono space-y-4 hover:border-slate-700 transition-all"
              >
                {/* Advisory Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-slate-950 text-cyan-300 font-bold border border-cyan-500/40 text-xs px-3 py-1 rounded-lg">
                      {advisory.cve_id}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      advisory.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                      advisory.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                    }`}>
                      {advisory.severity} (CVSS {advisory.cvss_score})
                    </span>

                    {advisory.cisa_kev && (
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] px-2.5 py-0.5 rounded font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                        CISA KEV ACTIVE
                      </span>
                    )}
                  </div>

                  <span className="text-slate-400 text-[11px]">
                    Published: {advisory.published_date}
                  </span>
                </div>

                {/* Title & Product Info */}
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {advisory.title}
                  </h3>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-4">
                    <span>Vendor: <span className="text-cyan-300 font-bold">{advisory.vendor}</span></span>
                    <span>Product: <span className="text-purple-300 font-bold">{advisory.product}</span></span>
                    <span>Status: <span className="text-amber-300 font-bold">{advisory.exploitation_status}</span></span>
                  </div>
                </div>

                {/* Technical Summary */}
                <p className="text-slate-300 text-xs leading-relaxed bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
                  {advisory.summary}
                </p>

                {/* Expandable Mitigation Section Toggle */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => setExpandedCve(isExpanded ? null : advisory.cve_id)}
                    className="text-cyan-400 hover:text-cyan-300 text-xs font-bold flex items-center gap-1.5"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {isExpanded ? 'Hide Mitigation & References' : 'View Defensive Mitigation Steps & Patching Advice'}
                  </button>

                  <div className="flex items-center gap-2">
                    {advisory.references.map((ref, idx) => (
                      <a
                        key={idx}
                        href={ref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-white text-[10px] inline-flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800"
                      >
                        Ref #{idx + 1} <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs font-mono mt-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs border-b border-slate-800 pb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Defensive Mitigation & Patching Guidance:
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {advisory.mitigation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
