import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Radio, Cpu, RefreshCw, Zap, Sparkles, AlertTriangle } from 'lucide-react';

interface HeroBannerProps {
  totalEvents?: number;
  criticalAlerts?: number;
  activeSensors?: number;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const ThreeDHeroBanner: React.FC<HeroBannerProps> = ({
  totalEvents = 1250,
  criticalAlerts = 3,
  activeSensors = 1,
  onRefresh,
  isLoading = false
}) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.5) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full glass-graph p-6 sm:p-8 rounded-2xl border border-[#6967FB]/30 shadow-2xl backdrop-blur-2xl overflow-hidden group">
      {/* Bubble Plain Design Ambient Aura */}
      <div className="bubble-plain -top-24 -right-24 w-80 h-80 bubble-lime opacity-15" />
      <div className="bubble-plain -bottom-24 -left-24 w-80 h-80 bubble-indigo opacity-20" />

      {/* High-tech Subtle Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(105, 103, 251, 0.2) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(105, 103, 251, 0.2) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left Information & Controls */}
        <div className="space-y-4 max-w-xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#6967FB]/15 border border-[#C8F904]/40 text-[#C8F904] text-xs font-mono font-bold shadow-[0_0_15px_rgba(200,249,4,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-[#C8F904]" />
            <span>CYVANTIS AEGISNEX SOC CONTROL CENTER</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Enterprise Security Gateway & Threat Intelligence
          </h1>

          <p className="text-xs sm:text-sm text-[#9FB0B7] font-sans leading-relaxed">
            Real-time honeypot attack telemetry, spatial threat analytics, automated payload de-obfuscation, and active defense rule generator.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="btn-lime"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-mono text-white bg-[#0E1A1F]/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#6967FB]/30">
              <span className="w-2 h-2 rounded-full bg-[#C8F904] animate-radar shrink-0" />
              <span>Status: <strong className="text-[#C8F904]">OPERATIONAL</strong></span>
            </div>
          </div>
        </div>

        {/* Right 3D Sensor Hologram */}
        <div className="relative w-56 h-56 flex items-center justify-center shrink-0 my-2">
          {/* Outer Rotating Ring */}
          <div 
            className="absolute inset-0 rounded-full border border-[#C8F904]/30"
            style={{ transform: 'rotateX(55deg) rotateY(15deg)' }}
          />

          {/* Inner Counter Ring */}
          <div 
            className="absolute inset-4 rounded-full border border-[#6967FB]/40"
            style={{ transform: 'rotateX(65deg) rotateY(-20deg)' }}
          />

          {/* Central Core */}
          <div 
            className="w-28 h-28 rounded-2xl bg-[#0E1A1F]/90 backdrop-blur-xl border border-[#6967FB]/50 flex flex-col items-center justify-center shadow-[0_0_35px_rgba(105,103,251,0.3)] transition-transform duration-300"
            style={{ transform: `rotateY(${rotation}deg)` }}
          >
            <ShieldCheck className="w-9 h-9 text-[#C8F904]" />
            <span className="text-[10px] font-mono font-bold text-white tracking-widest mt-1">
              CYVANTIS
            </span>
          </div>

          {/* Orbiting Status Badges (Angular Squircle Chips, No Pills) */}
          <div className="absolute top-2 left-0 px-3 py-1.5 rounded-xl bg-[#0E1A1F]/90 backdrop-blur-md border border-[#6967FB]/40 text-[10px] font-mono text-[#C8F904] shadow-xl flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-[#C8F904]" />
            <span>{(totalEvents ?? 0).toLocaleString()} Captures</span>
          </div>

          <div className="absolute bottom-2 right-0 px-3 py-1.5 rounded-xl bg-[#0E1A1F]/90 backdrop-blur-md border border-[#6967FB]/40 text-[10px] font-mono text-white shadow-xl flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-[#C8F904]" />
            <span>{criticalAlerts} Alerts</span>
          </div>
        </div>
      </div>
    </div>
  );
};
