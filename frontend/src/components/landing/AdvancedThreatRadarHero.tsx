import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, AlertTriangle, Radio, Activity, Terminal, Crosshair, Zap, Eye, CheckCircle2 } from 'lucide-react';

interface ThreatNode {
  id: string;
  ip: string;
  country: string;
  attackType: string;
  mitreCode: string;
  severity: 'critical' | 'high' | 'medium';
  score: number;
  sector: string;
  angle: number; // degrees
  radius: number; // percent distance from center (25% - 85%)
  status: string;
}

const LIVE_THREATS: ThreatNode[] = [
  {
    id: 't-1',
    ip: '185.220.101.5',
    country: 'DE (Frankfurt)',
    attackType: 'SSH Root Brute-Force',
    mitreCode: 'T1110.001',
    severity: 'critical',
    score: 96,
    sector: 'SEC-ALPHA',
    angle: 35,
    radius: 72,
    status: 'Trapped in Honeypot Jail',
  },
  {
    id: 't-2',
    ip: '193.142.146.210',
    country: 'RU (Moscow)',
    attackType: 'C2 Reverse Shell Beacon',
    mitreCode: 'T1071.001',
    severity: 'critical',
    score: 94,
    sector: 'SEC-GAMMA',
    angle: 145,
    radius: 62,
    status: 'Isolated & Fingerprinted',
  },
  {
    id: 't-3',
    ip: '45.154.255.88',
    country: 'NL (Amsterdam)',
    attackType: 'Polymorphic Worm Dropper',
    mitreCode: 'T1190',
    severity: 'high',
    score: 84,
    sector: 'SEC-BETA',
    angle: 220,
    radius: 80,
    status: 'Hash Blocked at Boundary',
  },
  {
    id: 't-4',
    ip: '104.244.76.13',
    country: 'US (Chicago)',
    attackType: 'Automated Port Scanner',
    mitreCode: 'T1046',
    severity: 'medium',
    score: 68,
    sector: 'SEC-DELTA',
    angle: 310,
    radius: 46,
    status: 'Deception Lure Engaged',
  },
  {
    id: 't-5',
    ip: '91.240.118.24',
    country: 'RO (Bucharest)',
    attackType: 'Privilege Escalation Probe',
    mitreCode: 'T1068',
    severity: 'high',
    score: 88,
    sector: 'SEC-ALPHA',
    angle: 280,
    radius: 65,
    status: 'Sandbox Interception Active',
  },
];

export const AdvancedThreatRadarHero: React.FC<{ onExploreClick?: () => void }> = ({ onExploreClick }) => {
  const [selectedThreat, setSelectedThreat] = useState<ThreatNode | null>(LIVE_THREATS[0]);
  const [activeThreatIndex, setActiveThreatIndex] = useState(0);
  const [radarAngle, setRadarAngle] = useState(0);

  // Auto-rotate selected threat every 4.5 seconds if none hovered
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveThreatIndex((prev) => {
        const next = (prev + 1) % LIVE_THREATS.length;
        setSelectedThreat(LIVE_THREATS[next]);
        return next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Smooth continuous radar sweep line rotation
  useEffect(() => {
    let animationFrame: number;
    let start: number | null = null;
    const speed = 0.08; // degrees per ms -> ~4.5s per full 360 rotation

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      setRadarAngle((progress * speed) % 360);
      animationFrame = requestAnimationFrame(step);
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="relative w-full max-w-xl mx-auto select-none">
      {/* Outer Glow Halo using existing brand colors */}
      <div className="absolute -inset-2 bg-gradient-to-r from-[#6967FB]/20 via-[#38BDF8]/15 to-[#C8F904]/20 rounded-3xl blur-2xl opacity-70 pointer-events-none" />

      {/* Main Radar Card Container */}
      <div className="relative rounded-3xl bg-[#0B132B]/90 backdrop-blur-2xl border border-[#243149] hover:border-[#38BDF8]/50 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(105,103,251,0.15)] p-4 sm:p-6 overflow-hidden transition-all duration-300">
        {/* Futuristic Corner Brackets */}
        <div className="tech-corner-tl" />
        <div className="tech-corner-tr" />
        <div className="tech-corner-bl" />
        <div className="tech-corner-br" />

        {/* Specular Top Edge Light */}
        <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-[#C8F904]/50 to-transparent pointer-events-none" />

        {/* Header HUD Bar */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#243149]/80 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8F904] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C8F904]" />
            </span>
            <span className="text-[#E8EEF8] font-bold tracking-wider">CYBER THREAT RADAR</span>
            <span className="px-1.5 py-0.5 rounded bg-[#C8F904]/10 border border-[#C8F904]/30 text-[9px] font-bold text-[#C8F904]">
              LIVE 360°
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#94A3B8]">
            <span className="hidden sm:inline">SWEEP: 2.4 GHz</span>
            <span className="text-[#38BDF8] font-bold">100% CONTAINED</span>
          </div>
        </div>

        {/* Radar Circular Scope Display */}
        <div className="relative w-full aspect-square max-w-[380px] mx-auto my-2 flex items-center justify-center">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 rounded-full bg-[#080E1E]/95 border border-[#243149] shadow-inner overflow-hidden">
            {/* Crosshair Axes */}
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#38BDF8]/20" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-[#38BDF8]/20" />

            {/* Diagonal Grid Rays */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-[1px] bg-[#243149]/50 rotate-45" />
              <div className="w-full h-[1px] bg-[#243149]/50 -rotate-45" />
            </div>

            {/* Concentric Orbital Rings */}
            <div className="absolute inset-[10%] rounded-full border border-[#243149]/70" />
            <div className="absolute inset-[25%] rounded-full border border-dashed border-[#38BDF8]/25" />
            <div className="absolute inset-[40%] rounded-full border border-[#243149]/80" />
            <div className="absolute inset-[58%] rounded-full border border-[#C8F904]/20" />
            <div className="absolute inset-[75%] rounded-full border border-[#38BDF8]/30" />

            {/* Animated Rotating Radar Sweep Cone */}
            <div
              className="absolute inset-0 origin-center pointer-events-none transition-transform"
              style={{
                transform: `rotate(${radarAngle}deg)`,
              }}
            >
              <div
                className="w-1/2 h-1/2 ml-auto origin-bottom-left"
                style={{
                  background: 'conic-gradient(from 0deg at 0% 100%, rgba(200, 249, 4, 0.28) 0deg, rgba(56, 189, 248, 0.12) 30deg, transparent 65deg)',
                }}
              />
              <div className="absolute top-1/2 right-0 w-1/2 h-[1.5px] bg-gradient-to-r from-transparent via-[#C8F904] to-[#C8F904] shadow-[0_0_8px_#C8F904]" />
            </div>
          </div>

          {/* Central Nexus Core Emblem */}
          <div className="relative z-20 w-16 h-16 rounded-2xl bg-[#0D1528] border-2 border-[#38BDF8] shadow-[0_0_20px_rgba(56,189,248,0.4)] flex flex-col items-center justify-center cursor-pointer group hover:scale-105 transition-transform">
            <div className="absolute -inset-1 rounded-2xl bg-[#38BDF8]/20 animate-pulse pointer-events-none" />
            <Shield className="w-7 h-7 text-[#C8F904] drop-shadow-[0_0_8px_rgba(200,249,4,0.6)]" />
            <span className="text-[7px] font-mono font-bold text-white tracking-widest mt-0.5">CYVANTIS</span>
          </div>

          {/* Render Threat Nodes on Radar */}
          {LIVE_THREATS.map((threat, index) => {
            const rad = (threat.angle * Math.PI) / 180;
            // Center is 50%, 50%. Radius scaled to fit within circle bounds (40% max reach)
            const x = 50 + (threat.radius * 0.44) * Math.cos(rad);
            const y = 50 + (threat.radius * 0.44) * Math.sin(rad);
            const isSelected = selectedThreat?.id === threat.id;

            return (
              <div
                key={threat.id}
                onClick={() => setSelectedThreat(threat)}
                onMouseEnter={() => setSelectedThreat(threat)}
                style={{ left: `${x}%`, top: `${y}%` }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer group/node"
              >
                {/* Ping wave for critical threats */}
                <span
                  className={`absolute -inset-1.5 rounded-full animate-ping pointer-events-none ${
                    threat.severity === 'critical'
                      ? 'bg-rose-500/50'
                      : threat.severity === 'high'
                      ? 'bg-[#6967FB]/50'
                      : 'bg-amber-400/40'
                  }`}
                />

                {/* Node Dot */}
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    isSelected
                      ? 'scale-125 border-white bg-[#C8F904] shadow-[0_0_15px_#C8F904]'
                      : threat.severity === 'critical'
                      ? 'border-rose-400 bg-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                      : threat.severity === 'high'
                      ? 'border-[#818CF8] bg-[#6967FB]/80 shadow-[0_0_10px_rgba(105,103,251,0.6)]'
                      : 'border-amber-400 bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>

                {/* Micro IP Label on Radar */}
                <div className="absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none opacity-80 group-hover/node:opacity-100 transition-opacity">
                  <span className="px-1.5 py-0.5 rounded bg-[#080E1E]/90 border border-[#243149] text-[9px] font-mono text-[#E8EEF8] font-bold shadow-md">
                    {threat.ip}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Threat Contextual Dossier Card */}
        {selectedThreat && (
          <div className="mt-3 p-3.5 rounded-2xl bg-[#080E1E]/95 border border-[#38BDF8]/40 shadow-[0_8px_20px_rgba(0,0,0,0.6)] font-mono text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[#C8F904] font-bold text-sm">{selectedThreat.ip}</span>
                <span className="text-[10px] text-[#94A3B8]">({selectedThreat.country})</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  selectedThreat.severity === 'critical'
                    ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                    : selectedThreat.severity === 'high'
                    ? 'bg-[#6967FB]/20 border border-[#6967FB]/40 text-[#818CF8]'
                    : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                }`}
              >
                {selectedThreat.severity} • RISK {selectedThreat.score}/100
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] mb-2.5">
              <div>
                <span className="text-[#94A3B8] block text-[10px]">ATTACK VECTOR</span>
                <span className="text-white font-semibold">{selectedThreat.attackType}</span>
              </div>
              <div>
                <span className="text-[#94A3B8] block text-[10px]">MITRE TECHNIQUE</span>
                <span className="text-[#38BDF8] font-semibold">{selectedThreat.mitreCode}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#243149] text-[10px]">
              <div className="flex items-center gap-1.5 text-[#C8F904]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{selectedThreat.status}</span>
              </div>
              <span className="text-[#94A3B8]">{selectedThreat.sector}</span>
            </div>
          </div>
        )}

        {/* Bottom Micro Ticker */}
        <div className="mt-3 pt-2.5 border-t border-[#243149]/80 flex items-center justify-between text-[10px] font-mono text-[#94A3B8]">
          <span className="flex items-center gap-1 text-[#38BDF8]">
            <Zap className="w-3 h-3 text-[#C8F904]" />
            ISOLATION FOREST AI ANOMALY DETECTION: ARMED
          </span>
          <span className="text-[#C8F904] font-bold cursor-pointer hover:underline" onClick={onExploreClick}>
            VIEW THREAT FEED →
          </span>
        </div>
      </div>
    </div>
  );
};

