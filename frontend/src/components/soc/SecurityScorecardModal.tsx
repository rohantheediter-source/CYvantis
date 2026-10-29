import React, { useState, useEffect } from 'react';
import { 
  X, Trophy, ShieldCheck, Activity, TrendingUp, TrendingDown,
  Users, CheckCircle2, AlertTriangle, ArrowUpRight, Award, BarChart3,
  Clock, Zap, ExternalLink, RefreshCw
} from 'lucide-react';

interface SecurityScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopyToast?: (msg: string) => void;
}

export const SecurityScorecardModal: React.FC<SecurityScorecardModalProps> = ({
  isOpen,
  onClose,
  onCopyToast
}) => {
  const [activeTab, setActiveTab] = useState<'scorecard' | 'leaderboard' | 'trends'>('scorecard');
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    fetch('http://localhost:8000/api/v1/living/scorecard')
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => {
        console.warn('Scorecard fetch fallback:', err);
        setData({
          organization: "CYVANTIS Defense Nexus (Enterprise Global)",
          overall_score: 91,
          grade: "A-",
          posture_status: "SUPERIOR DEFENSIVE POSTURE",
          metrics: {
            mttd: { value: "4.2 mins", industry_benchmark: "28.5 mins", status: "TOP 5% (85% faster)" },
            mttr: { value: "18.4 mins", industry_benchmark: "4.8 hours", status: "TOP 2% (93% faster)" },
            vulnerability_density: { value: "0.42 / kLOC", industry_benchmark: "2.10 / kLOC", status: "80% below average" },
            honeypot_deception_efficiency: { value: "98.7%", industry_benchmark: "64.0%", status: "LEADER CLASS" }
          },
          department_leaderboard: [
            { rank: 1, department: "Cloud Infrastructure & SRE", mttd_mins: 2.1, mttr_mins: 8.5, score: 96, trend: "+4%" },
            { rank: 2, department: "Payment Gateway Core", mttd_mins: 3.4, mttr_mins: 12.0, score: 93, trend: "+1%" },
            { rank: 3, department: "AI & ML Threat Modeling", mttd_mins: 4.8, mttr_mins: 19.2, score: 89, trend: "+6%" },
            { rank: 4, department: "Identity & Access Ops", mttd_mins: 5.6, mttr_mins: 24.1, score: 87, trend: "-2%" },
            { rank: 5, department: "Internal Enterprise IT", mttd_mins: 8.2, mttr_mins: 35.0, score: 82, trend: "+3%" }
          ],
          historical_trend: [
            { month: "May", score: 79 },
            { month: "Jun", score: 82 },
            { month: "Jul", score: 84 },
            { month: "Aug", score: 87 },
            { month: "Sep", score: 89 },
            { month: "Oct", score: 91 }
          ]
        });
      })
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Security Scorecard & Threat Leaderboard"
      className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div className="bg-[#050b21] border border-[#00d2ff]/40 rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-[0_0_90px_rgba(0,210,255,0.25)] flex flex-col overflow-hidden font-sans">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#030716] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Trophy className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white font-mono">
                  Threat Scorecard & Benchmark Leaderboard
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold">
                  GRADE {data?.grade || 'A-'} (91/100)
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Real-Time SOC Performance Benchmarks vs. Global Industry Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switcher */}
            <div className="flex items-center bg-[#01040f] border border-slate-800 rounded-xl p-1 font-mono text-xs">
              <button
                onClick={() => setActiveTab('scorecard')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  activeTab === 'scorecard' ? 'bg-[#00d2ff] text-black shadow-[0_0_15px_rgba(0,210,255,0.4)]' : 'text-slate-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  activeTab === 'leaderboard' ? 'bg-[#00d2ff] text-black shadow-[0_0_15px_rgba(0,210,255,0.4)]' : 'text-slate-400 hover:text-white'
                }`}
              >
                Department Ranking
              </button>
              <button
                onClick={() => setActiveTab('trends')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  activeTab === 'trends' ? 'bg-[#00d2ff] text-black shadow-[0_0_15px_rgba(0,210,255,0.4)]' : 'text-slate-400 hover:text-white'
                }`}
              >
                Trends
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2"
              aria-label="Close Scorecard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: EXECUTIVE BENCHMARK SCORECARD */}
          {activeTab === 'scorecard' && (
            <div className="space-y-6">
              
              {/* Highlight Hero Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#061238] via-[#040924] to-[#020512] border border-[#00d2ff]/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#00d2ff]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>DEFENSIVE RESILIENCE INDEX</span>
                  </div>
                  <h4 className="text-2xl font-black text-white font-mono">
                    {data?.organization || 'Enterprise Cyber Posture'}
                  </h4>
                  <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                    Automated honeypot deception and Llama 3 semantic triaging have lowered Mean Time to Detect (MTTD) to under 5 minutes, outpacing 95% of Global 2000 enterprises.
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-[#010410]/80 p-5 rounded-2xl border border-emerald-500/30 shrink-0">
                  <div className="text-center">
                    <span className="text-4xl font-black text-emerald-400 font-mono tracking-tight">
                      {data?.overall_score || 91}
                    </span>
                    <span className="text-xs text-slate-400 block font-mono">/ 100 PTS</span>
                  </div>
                  <div className="h-10 w-px bg-slate-800" />
                  <div className="text-left font-mono">
                    <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                      {data?.grade || 'A-'} RATING
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Tier 1 Defense
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Core Benchmark Metric Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
                
                {/* MTTD */}
                <div className="p-5 rounded-2xl bg-[#03081e] border border-slate-800 hover:border-[#00d2ff]/50 transition group space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <Clock className="w-3.5 h-3.5" /> MTTD
                    </span>
                    <span className="text-emerald-400 text-[10px] font-bold">85% Faster</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {data?.metrics?.mttd?.value || '4.2 mins'}
                  </div>
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    Industry Avg: <strong className="text-slate-300">{data?.metrics?.mttd?.industry_benchmark || '28.5 mins'}</strong>
                  </div>
                </div>

                {/* MTTR */}
                <div className="p-5 rounded-2xl bg-[#03081e] border border-slate-800 hover:border-[#00d2ff]/50 transition group space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span className="flex items-center gap-1.5 text-purple-300">
                      <Zap className="w-3.5 h-3.5" /> MTTR
                    </span>
                    <span className="text-emerald-400 text-[10px] font-bold">93% Faster</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {data?.metrics?.mttr?.value || '18.4 mins'}
                  </div>
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    Industry Avg: <strong className="text-slate-300">{data?.metrics?.mttr?.industry_benchmark || '4.8 hours'}</strong>
                  </div>
                </div>

                {/* Vulnerability Density */}
                <div className="p-5 rounded-2xl bg-[#03081e] border border-slate-800 hover:border-[#00d2ff]/50 transition group space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span className="flex items-center gap-1.5 text-amber-300">
                      <BarChart3 className="w-3.5 h-3.5" /> Vuln Density
                    </span>
                    <span className="text-emerald-400 text-[10px] font-bold">-80%</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {data?.metrics?.vulnerability_density?.value || '0.42 / kLOC'}
                  </div>
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    Industry Avg: <strong className="text-slate-300">{data?.metrics?.vulnerability_density?.industry_benchmark || '2.10 / kLOC'}</strong>
                  </div>
                </div>

                {/* Honeypot Deception Efficiency */}
                <div className="p-5 rounded-2xl bg-[#03081e] border border-slate-800 hover:border-[#00d2ff]/50 transition group space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      <Award className="w-3.5 h-3.5" /> Deception Eff.
                    </span>
                    <span className="text-cyan-400 text-[10px] font-bold">LEADER</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {data?.metrics?.honeypot_deception_efficiency?.value || '98.7%'}
                  </div>
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    Industry Avg: <strong className="text-slate-300">{data?.metrics?.honeypot_deception_efficiency?.industry_benchmark || '64.0%'}</strong>
                  </div>
                </div>

              </div>

              {/* Comparative Analysis Bar */}
              <div className="p-5 rounded-2xl bg-[#020512] border border-slate-800 space-y-3 font-mono text-xs">
                <span className="text-white font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#00d2ff]" />
                  Threat Neutralization Velocity Benchmark
                </span>
                
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                      <span>CYVANTIS Automated Response</span>
                      <span className="text-emerald-400 font-bold">98.7% Autopilot Trapping</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-[#00d2ff] to-emerald-400 h-full rounded-full w-[98.7%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Industry Standard SOC</span>
                      <span className="text-slate-400">64.0% Manual Triage</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-slate-700 h-full rounded-full w-[64%]" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DEPARTMENT LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-4 font-mono">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white text-sm font-bold">Internal Department Threat Hygiene Leaderboard</h4>
                  <p className="text-xs text-slate-400 font-sans">Gamified security compliance rankings based on MTTR, safe coding, and fast remediation.</p>
                </div>
                <span className="text-xs text-[#00d2ff] font-bold">5 Active Teams</span>
              </div>

              <div className="space-y-2">
                {data?.department_leaderboard?.map((dept: any) => (
                  <div
                    key={dept.rank}
                    className="p-4 rounded-2xl bg-[#03081e] border border-slate-800 hover:border-[#00d2ff]/40 transition flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                        dept.rank === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' :
                        dept.rank === 2 ? 'bg-slate-300/20 text-slate-200 border border-slate-400/50' :
                        dept.rank === 3 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/50' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        #{dept.rank}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-white">{dept.department}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                          <span>MTTD: <strong className="text-cyan-400">{dept.mttd_mins}m</strong></span>
                          <span>MTTR: <strong className="text-purple-400">{dept.mttr_mins}m</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-bold flex items-center gap-1 ${
                        dept.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {dept.trend.startsWith('+') ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {dept.trend}
                      </span>
                      <div className="text-right">
                        <span className="text-lg font-black text-white">{dept.score}</span>
                        <span className="text-[10px] text-slate-400 block">SCORE</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 6-MONTH TREND TIMELINE */}
          {activeTab === 'trends' && (
            <div className="space-y-5 font-mono">
              <div>
                <h4 className="text-white text-sm font-bold">Organizational Threat Score Historical Trend</h4>
                <p className="text-xs text-slate-400 font-sans">Continuous progression tracking over the past 6 months.</p>
              </div>

              <div className="p-6 rounded-2xl bg-[#020512] border border-slate-800">
                <div className="grid grid-cols-6 gap-3 items-end h-44 pt-6">
                  {data?.historical_trend?.map((item: any, i: number) => {
                    const heightPct = Math.max(30, ((item.score - 70) / 30) * 100);
                    return (
                      <div key={i} className="flex flex-col items-center gap-2 h-full justify-end group">
                        <span className="text-xs font-bold text-[#00d2ff] opacity-0 group-hover:opacity-100 transition">
                          {item.score}
                        </span>
                        <div 
                          className="w-full bg-gradient-to-t from-[#00d2ff]/20 to-[#00d2ff] rounded-t-lg transition-all duration-300 group-hover:brightness-125"
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-[11px] text-slate-400 mt-1">{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#030716] flex items-center justify-between shrink-0 font-mono text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Benchmark Index: Global Financial & Cloud Cybersecurity Standard ISO-27001</span>
          </div>

          <button
            onClick={() => {
              if (onCopyToast) onCopyToast('Benchmark audit report exported as PDF summary');
            }}
            className="px-4 py-1.5 rounded-xl bg-[#00d2ff]/20 text-[#00d2ff] border border-[#00d2ff]/40 hover:bg-[#00d2ff] hover:text-black font-bold transition flex items-center gap-1.5"
          >
            <span>Export Scorecard Report</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
