import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Activity, 
  Zap, 
  Globe2, 
  Radio, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Maximize2, 
  Minimize2, 
  Layers, 
  Sparkles, 
  Crosshair, 
  ChevronRight,
  TrendingUp,
  Cpu,
  Server,
  Lock,
  ArrowUpRight,
  X
} from 'lucide-react';

export interface RegionalHub {
  id: string;
  name: string;
  tagline: string;
  threatTagline: string;
  color: string;
  dotColor: string;
  borderGlow: string;
  node: { x: number; y: number };
  badge: { x: number; y: number };
  leaderD: string;
  status: 'OPTIMAL' | 'ELEVATED' | 'CRITICAL';
  latency: number; // ms
  throughput: string;
  blocked24h: number;
  topVector: string;
  asnGateway: string;
  activeNodes: number;
}

export const REGIONAL_HUBS: RegionalHub[] = [
  {
    id: 'na',
    name: 'NORTH AMERICA',
    tagline: 'INNOVATION HUB',
    threatTagline: 'PRIMARY SOC GATEWAY',
    color: '#60A5FA',
    dotColor: '#38BDF8',
    borderGlow: 'rgba(56, 189, 248, 0.45)',
    node: { x: 330, y: 260 },
    badge: { x: 75, y: 80 },
    leaderD: 'M 330,260 L 255,135 L 240,110 L 200,110',
    status: 'OPTIMAL',
    latency: 18,
    throughput: '9.4 Tbps',
    blocked24h: 3429100,
    topVector: 'Distributed L7 HTTP/3 Flood',
    asnGateway: 'AS13335 (Cloudflare / Edge 01)',
    activeNodes: 48
  },
  {
    id: 'eu',
    name: 'EUROPE',
    tagline: 'TECH & EDUCATION',
    threatTagline: 'EU ZERO-DAY RADAR',
    color: '#A855F7',
    dotColor: '#C084FC',
    borderGlow: 'rgba(192, 132, 252, 0.5)',
    node: { x: 615, y: 230 },
    badge: { x: 710, y: 55 },
    leaderD: 'M 615,230 L 685,115 L 710,85',
    status: 'OPTIMAL',
    latency: 24,
    throughput: '8.1 Tbps',
    blocked24h: 2184900,
    topVector: 'BGP Hijack & DNS Reflection',
    asnGateway: 'AS3356 (Lumen Frankfurt)',
    activeNodes: 36
  },
  {
    id: 'asia',
    name: 'ASIA',
    tagline: 'SKILLS & OPPORTUNITY',
    threatTagline: 'APAC THREAT RADAR',
    color: '#C8F904',
    dotColor: '#A3E635',
    borderGlow: 'rgba(200, 249, 4, 0.55)',
    node: { x: 855, y: 275 },
    badge: { x: 975, y: 155 },
    leaderD: 'M 855,275 L 940,205 L 975,185',
    status: 'ELEVATED',
    latency: 32,
    throughput: '12.8 Tbps',
    blocked24h: 5891400,
    topVector: 'Credential Stuffing Botnets',
    asnGateway: 'AS4641 (APNIC Tokyo Nexus)',
    activeNodes: 64
  },
  {
    id: 'sa',
    name: 'SOUTH AMERICA',
    tagline: 'GROWING TALENT',
    threatTagline: 'LATAM DEFENSE NEXUS',
    color: '#C084FC',
    dotColor: '#E879F9',
    borderGlow: 'rgba(232, 121, 249, 0.45)',
    node: { x: 425, y: 445 },
    badge: { x: 75, y: 415 },
    leaderD: 'M 425,445 L 350,445 L 295,445 L 235,445',
    status: 'OPTIMAL',
    latency: 48,
    throughput: '4.2 Tbps',
    blocked24h: 1140200,
    topVector: 'IoT Mirai Scan Swarm',
    asnGateway: 'AS28573 (Claro São Paulo)',
    activeNodes: 22
  },
  {
    id: 'africa',
    name: 'AFRICA',
    tagline: 'FUTURE POTENTIAL',
    threatTagline: 'EMERGING VECTOR SHIELD',
    color: '#A3E635',
    dotColor: '#C8F904',
    borderGlow: 'rgba(200, 249, 4, 0.5)',
    node: { x: 605, y: 395 },
    badge: { x: 480, y: 550 },
    leaderD: 'M 605,395 L 605,485 L 575,540 L 530,550',
    status: 'OPTIMAL',
    latency: 56,
    throughput: '3.6 Tbps',
    blocked24h: 948120,
    topVector: 'NTP Amplification Floods',
    asnGateway: 'AS37105 (SEACOM Nairobi Gateway)',
    activeNodes: 18
  },
  {
    id: 'australia',
    name: 'AUSTRALIA',
    tagline: 'INNOVATION & IMPACT',
    threatTagline: 'OCEANIA SINKHOLE NODE',
    color: '#C084FC',
    dotColor: '#D8B4FE',
    borderGlow: 'rgba(192, 132, 252, 0.45)',
    node: { x: 920, y: 490 },
    badge: { x: 990, y: 485 },
    leaderD: 'M 920,490 L 965,490 L 990,490',
    status: 'OPTIMAL',
    latency: 38,
    throughput: '5.1 Tbps',
    blocked24h: 1420700,
    topVector: 'API Rate Limit Abuse',
    asnGateway: 'AS7575 (AARNet Sydney)',
    activeNodes: 26
  }
];

// Telemetry connection flight paths between hubs
export const TELEMETRY_ARCS = [
  { id: 'arc-na-eu', from: 'na', to: 'eu', pathD: 'M 330,260 Q 460,175 615,230', dur: '3.2s', color: '#60A5FA' },
  { id: 'arc-eu-asia', from: 'eu', to: 'asia', pathD: 'M 615,230 Q 730,170 855,275', dur: '2.8s', color: '#C084FC' },
  { id: 'arc-na-sa', from: 'na', to: 'sa', pathD: 'M 330,260 Q 355,360 425,445', dur: '3.4s', color: '#38BDF8' },
  { id: 'arc-sa-af', from: 'sa', to: 'africa', pathD: 'M 425,445 Q 515,440 605,395', dur: '3.6s', color: '#C8F904' },
  { id: 'arc-af-asia', from: 'africa', to: 'asia', pathD: 'M 605,395 Q 730,360 855,275', dur: '3.0s', color: '#A3E635' },
  { id: 'arc-eu-af', from: 'eu', to: 'africa', pathD: 'M 615,230 Q 625,310 605,395', dur: '2.9s', color: '#E879F9' },
  { id: 'arc-asia-au', from: 'asia', to: 'australia', pathD: 'M 855,275 Q 920,380 920,490', dur: '2.7s', color: '#C084FC' },
  { id: 'arc-na-asia', from: 'na', to: 'asia', pathD: 'M 330,260 Q 560,400 855,275', dur: '4.2s', color: '#6967FB' }
];

export interface GeographicalOperationsMapProps {
  className?: string;
  showControls?: boolean;
  defaultMode?: 'operations' | 'threat';
  onHubSelect?: (hub: RegionalHub) => void;
}

export const GeographicalOperationsMap: React.FC<GeographicalOperationsMapProps> = ({
  className = '',
  showControls = true,
  defaultMode = 'operations',
  onHubSelect
}) => {
  const [mode, setMode] = useState<'operations' | 'threat'>(defaultMode);
  const [activeHub, setActiveHub] = useState<RegionalHub | null>(null);
  const [hoveredHub, setHoveredHub] = useState<RegionalHub | null>(null);
  const [isLiveTelemetry, setIsLiveTelemetry] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [liveClock, setLiveClock] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Live UTC Clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setLiveClock(
        d.toUTCString().replace('GMT', 'UTC')
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const playChirp = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(940, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Audio fallback
    }
  };

  const handleHubClick = (hub: RegionalHub) => {
    setActiveHub(activeHub?.id === hub.id ? null : hub);
    playChirp();
    if (onHubSelect) onHubSelect(hub);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full bg-[#050B10] text-white rounded-2xl overflow-hidden border border-slate-800/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] select-none font-sans ${className}`}
      style={{
        background: 'radial-gradient(ellipse 90% 80% at 50% 45%, #0B1924 0%, #050B10 85%, #020609 100%)'
      }}
    >
      {/* Background Subtle Coordinate Lines & Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(rgba(105, 103, 251, 0.25) 1px, transparent 1px), radial-gradient(rgba(200, 249, 4, 0.15) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 20px 20px'
          }}
        />
      </div>

      {/* TOP HEADER CONTROLS & BADGES */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800/60 bg-[#050F16]/70 backdrop-blur-md">
        {/* Top-Left Exact Badge: ● LIVE GLOBAL OPERATIONS */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 border border-slate-700/80 shadow-[0_0_20px_rgba(200,249,4,0.15)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C8F904] shadow-[0_0_10px_#C8F904] animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-widest text-white uppercase">
              {mode === 'operations' ? 'LIVE GLOBAL OPERATIONS' : 'SOC THREAT INTERCEPTION RADAR'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="text-slate-600">|</span>
            <span className="text-[#60A5FA]">6 GLOBAL HUBS</span>
            <span className="text-slate-600">•</span>
            <span className="text-[#C8F904]">43.2 TBPS ACTIVE</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-semibold">{liveClock}</span>
          </div>
        </div>

        {/* Top-Right Controls */}
        {showControls && (
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-black/60 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setMode('operations')}
                className={`px-3 py-1 rounded-lg transition-all font-semibold uppercase tracking-wider ${
                  mode === 'operations'
                    ? 'bg-[#6967FB] text-white shadow-[0_0_15px_rgba(105,103,251,0.5)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Operations
              </button>
              <button
                onClick={() => setMode('threat')}
                className={`px-3 py-1 rounded-lg transition-all font-semibold uppercase tracking-wider ${
                  mode === 'threat'
                    ? 'bg-[#C8F904] text-black shadow-[0_0_15px_rgba(200,249,4,0.5)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Threat Radar
              </button>
            </div>

            {/* Live Telemetry Pause/Play */}
            <button
              onClick={() => setIsLiveTelemetry(!isLiveTelemetry)}
              className={`p-2 rounded-xl border transition-all ${
                isLiveTelemetry 
                  ? 'bg-slate-900/80 border-slate-700 text-[#C8F904]' 
                  : 'bg-slate-900/80 border-slate-800 text-slate-500'
              }`}
              title={isLiveTelemetry ? 'Pause Stream' : 'Resume Stream'}
            >
              {isLiveTelemetry ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playChirp();
              }}
              className={`p-2 rounded-xl border transition-all ${
                soundEnabled 
                  ? 'bg-[#6967FB]/20 border-[#6967FB] text-[#6967FB]' 
                  : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={soundEnabled ? 'Mute Sonar' : 'Enable Sonar'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition-all"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* MAIN VECTOR STAGE */}
      <div className="relative w-full aspect-[16/9] min-h-[520px] max-h-[820px] flex items-center justify-center p-2 sm:p-4">
        <svg
          viewBox="0 0 1200 650"
          className="w-full h-full overflow-visible select-none"
        >
          <defs>
            {/* SVG GLOW FILTERS */}
            <filter id="neonBlur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur1" />
              <feGaussianBlur stdDeviation="16" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="pillShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000000" floodOpacity="0.75" />
            </filter>

            {/* CONTINENT GRADIENTS MATCHING USER REFERENCE IMAGE */}
            
            {/* North America: Soft sky blue to deep cyan */}
            <linearGradient id="gradNorthAmerica" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#38BDF8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.85" />
            </linearGradient>

            {/* Greenland: Pale champagne / ivory glow */}
            <linearGradient id="gradGreenland" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#FEF3C7" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.75" />
            </linearGradient>

            {/* Europe: Violet to lavender */}
            <linearGradient id="gradEurope" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C084FC" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#A855F7" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#7E22CE" stopOpacity="0.85" />
            </linearGradient>

            {/* Asia: Dual-tone transition from violet/blue to vibrant lime/green! */}
            <linearGradient id="gradAsia" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.85" />
              <stop offset="25%" stopColor="#60A5FA" stopOpacity="0.85" />
              <stop offset="55%" stopColor="#38BDF8" stopOpacity="0.9" />
              <stop offset="78%" stopColor="#A3E635" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#C8F904" stopOpacity="0.98" />
            </linearGradient>

            {/* Africa: Vibrant lime / chartreuse */}
            <linearGradient id="gradAfrica" x1="0%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#BEF264" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#C8F904" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#65A30D" stopOpacity="0.85" />
            </linearGradient>

            {/* South America: Lavender to purple */}
            <linearGradient id="gradSouthAmerica" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E879F9" stopOpacity="0.92" />
              <stop offset="50%" stopColor="#C084FC" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#9333EA" stopOpacity="0.85" />
            </linearGradient>

            {/* Australia: Lavender to rose purple */}
            <linearGradient id="gradAustralia" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E879F9" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#C084FC" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* AMBIENT DECORATIVE SPARKLES & DOT MATRICES */}
          <g opacity="0.75">
            {/* Top-Right Dot Matrix */}
            <g transform="translate(1040, 160)" fill="#60A5FA" opacity="0.35">
              {[0, 1, 2, 3].map((r) =>
                [0, 1, 2, 3].map((c) => (
                  <circle key={`tm-${r}-${c}`} cx={c * 9} cy={r * 9} r="1.5" />
                ))
              )}
            </g>

            {/* Mid-Right Dot Matrix */}
            <g transform="translate(1040, 360)" fill="#C8F904" opacity="0.3">
              {[0, 1, 2, 3].map((r) =>
                [0, 1, 2, 3].map((c) => (
                  <circle key={`mm-${r}-${c}`} cx={c * 9} cy={r * 9} r="1.5" />
                ))
              )}
            </g>

            {/* 4-Point Sparkle Stars (✦) as in reference */}
            {/* Star 1: Above North America/Greenland */}
            <g transform="translate(540, 140)">
              <path d="M 0,-10 Q 0,0 10,0 Q 0,0 0,10 Q 0,0 -10,0 Q 0,0 0,-10 Z" fill="#93C5FD" opacity="0.85" filter="url(#softGlow)" />
            </g>

            {/* Star 2: East Asia Ocean */}
            <g transform="translate(1015, 305)">
              <path d="M 0,-8 Q 0,0 8,0 Q 0,0 0,8 Q 0,0 -8,0 Q 0,0 0,-8 Z" fill="#C8F904" opacity="0.8" filter="url(#softGlow)" />
            </g>

            {/* Star 3: West Africa / Atlantic */}
            <g transform="translate(150, 345)">
              <path d="M 0,-7 Q 0,0 7,0 Q 0,0 0,7 Q 0,0 -7,0 Q 0,0 0,-7 Z" fill="#C8F904" opacity="0.7" filter="url(#softGlow)" />
            </g>

            {/* Mini Capsule Pill Accents */}
            {/* Bottom-Left Pill Bars */}
            <g transform="translate(100, 500)">
              <rect x="0" y="0" width="36" height="5" rx="2.5" fill="#38BDF8" opacity="0.8" />
              <rect x="20" y="8" width="40" height="5" rx="2.5" fill="#C8F904" opacity="0.85" />
              <circle cx="70" cy="10.5" r="3" fill="#6967FB" opacity="0.8" />
              <circle cx="80" cy="10.5" r="2.5" fill="#38BDF8" opacity="0.8" />
            </g>

            {/* Bottom-Right Pill Bars */}
            <g transform="translate(1070, 580)">
              <rect x="0" y="0" width="46" height="5" rx="2.5" fill="#38BDF8" opacity="0.8" />
              <rect x="24" y="8" width="38" height="5" rx="2.5" fill="#C8F904" opacity="0.85" />
            </g>
          </g>

          {/* CONTINENT SILHOUETTES WITH RADIANT GRADIENTS & NEON AURA */}
          <g>
            {/* 1. GREENLAND */}
            <g filter="url(#softGlow)">
              <path
                d="M 400,120 C 420,110 460,115 480,135 C 500,155 490,195 460,205 C 435,215 420,190 410,165 C 400,145 390,130 400,120 Z"
                fill="url(#gradGreenland)"
                stroke="#FEF3C7"
                strokeWidth="1.2"
                strokeOpacity="0.8"
                className="transition-all duration-300 hover:opacity-100"
              />
            </g>

            {/* 2. NORTH AMERICA */}
            <g filter="url(#softGlow)">
              <path
                d="M 175,170 C 190,160 215,145 245,140 C 275,135 320,125 350,135 C 380,145 395,160 400,180 C 405,200 375,205 355,215 C 365,225 370,240 350,265 C 360,285 365,305 340,325 C 315,345 295,350 280,360 C 265,370 245,355 240,335 C 235,315 210,310 195,295 C 180,280 160,265 165,235 C 170,205 160,180 175,170 Z"
                fill="url(#gradNorthAmerica)"
                stroke="#60A5FA"
                strokeWidth="1.6"
                strokeOpacity="0.9"
                className="transition-all duration-300 hover:brightness-110 cursor-pointer"
                onClick={() => handleHubClick(REGIONAL_HUBS[0])}
              />
              {/* Alaska & Canadian Archipelago Islands */}
              <path
                d="M 160,175 C 145,170 120,175 110,185 C 95,200 115,220 135,215 C 150,210 160,195 160,175 Z"
                fill="url(#gradNorthAmerica)"
                stroke="#38BDF8"
                strokeWidth="1"
              />
              <path
                d="M 285,115 C 300,110 320,115 315,125 C 310,135 290,130 285,115 Z"
                fill="url(#gradNorthAmerica)"
              />
              <path
                d="M 345,110 C 360,105 375,115 370,125 C 360,130 345,120 345,110 Z"
                fill="url(#gradNorthAmerica)"
              />
            </g>

            {/* 3. EUROPE */}
            <g filter="url(#softGlow)">
              <path
                d="M 545,175 C 555,160 575,150 595,155 C 615,160 635,170 655,175 C 670,180 685,190 680,210 C 675,230 650,235 635,245 C 625,255 610,265 595,260 C 580,255 570,270 555,270 C 540,270 535,255 540,240 C 545,225 530,215 530,200 C 530,185 535,180 545,175 Z"
                fill="url(#gradEurope)"
                stroke="#C084FC"
                strokeWidth="1.5"
                strokeOpacity="0.9"
                className="transition-all duration-300 hover:brightness-110 cursor-pointer"
                onClick={() => handleHubClick(REGIONAL_HUBS[1])}
              />
              {/* United Kingdom & Ireland */}
              <path
                d="M 525,185 C 530,175 545,180 540,195 C 535,210 520,205 525,185 Z"
                fill="url(#gradEurope)"
                stroke="#C084FC"
                strokeWidth="1"
              />
              {/* Scandinavia */}
              <path
                d="M 585,130 C 595,120 625,130 630,150 C 620,165 590,160 585,130 Z"
                fill="url(#gradEurope)"
                stroke="#C084FC"
                strokeWidth="1"
              />
            </g>

            {/* 4. ASIA & EURASIA */}
            <g filter="url(#softGlow)">
              <path
                d="M 660,175 C 685,160 740,150 790,155 C 840,160 900,165 940,185 C 970,200 980,225 965,245 C 950,265 940,290 920,300 C 900,310 885,325 870,345 C 855,365 835,360 820,340 C 805,320 780,310 760,295 C 740,280 720,275 700,260 C 680,245 665,230 660,205 C 655,185 650,180 660,175 Z"
                fill="url(#gradAsia)"
                stroke="#C8F904"
                strokeWidth="1.8"
                strokeOpacity="0.95"
                className="transition-all duration-300 hover:brightness-110 cursor-pointer"
                onClick={() => handleHubClick(REGIONAL_HUBS[2])}
              />
              {/* India Peninsula */}
              <path
                d="M 745,285 C 760,280 775,295 770,320 C 765,345 745,360 735,355 C 725,350 730,320 735,300 C 740,290 740,285 745,285 Z"
                fill="url(#gradAsia)"
                stroke="#38BDF8"
                strokeWidth="1"
              />
              {/* Japan Archipelago */}
              <path
                d="M 975,220 C 985,215 990,230 985,245 C 980,260 965,255 975,220 Z"
                fill="url(#gradAsia)"
                stroke="#C8F904"
                strokeWidth="1"
              />
              {/* Southeast Asia Islands & Indochina */}
              <path
                d="M 850,335 C 865,335 880,355 870,370 C 860,385 840,375 850,335 Z"
                fill="url(#gradAsia)"
              />
              <path
                d="M 885,365 C 910,360 930,375 920,390 C 905,400 885,385 885,365 Z"
                fill="url(#gradAsia)"
              />
              <path
                d="M 810,380 C 835,375 850,390 840,405 C 820,410 805,395 810,380 Z"
                fill="url(#gradAsia)"
              />
            </g>

            {/* 5. AFRICA */}
            <g filter="url(#softGlow)">
              <path
                d="M 545,285 C 570,275 625,270 655,295 C 675,315 675,345 660,375 C 645,405 635,445 625,480 C 615,505 595,515 580,500 C 565,485 555,455 550,425 C 545,395 530,370 520,345 C 510,320 525,295 545,285 Z"
                fill="url(#gradAfrica)"
                stroke="#C8F904"
                strokeWidth="1.6"
                strokeOpacity="0.9"
                className="transition-all duration-300 hover:brightness-110 cursor-pointer"
                onClick={() => handleHubClick(REGIONAL_HUBS[4])}
              />
              {/* Madagascar */}
              <path
                d="M 665,445 C 675,440 680,455 675,480 C 670,495 660,490 665,445 Z"
                fill="url(#gradAfrica)"
                stroke="#C8F904"
                strokeWidth="1"
              />
            </g>

            {/* 6. SOUTH AMERICA */}
            <g filter="url(#softGlow)">
              <path
                d="M 365,345 C 390,340 435,350 460,380 C 475,400 465,430 450,460 C 435,490 415,520 395,550 C 380,570 370,565 365,545 C 360,520 355,480 355,450 C 355,420 345,395 345,375 C 345,355 355,350 365,345 Z"
                fill="url(#gradSouthAmerica)"
                stroke="#C084FC"
                strokeWidth="1.6"
                strokeOpacity="0.9"
                className="transition-all duration-300 hover:brightness-110 cursor-pointer"
                onClick={() => handleHubClick(REGIONAL_HUBS[3])}
              />
            </g>

            {/* 7. AUSTRALIA */}
            <g filter="url(#softGlow)">
              <path
                d="M 865,450 C 895,435 945,435 975,455 C 995,470 995,510 970,535 C 945,555 905,555 880,540 C 860,525 850,500 855,475 C 860,460 855,455 865,450 Z"
                fill="url(#gradAustralia)"
                stroke="#C084FC"
                strokeWidth="1.5"
                strokeOpacity="0.9"
                className="transition-all duration-300 hover:brightness-110 cursor-pointer"
                onClick={() => handleHubClick(REGIONAL_HUBS[5])}
              />
              {/* New Zealand */}
              <path
                d="M 1010,515 C 1018,510 1022,525 1018,545 C 1014,555 1005,550 1010,515 Z"
                fill="url(#gradAustralia)"
                stroke="#C084FC"
                strokeWidth="1"
              />
            </g>
          </g>

          {/* TELEMETRY CONNECTION ARCS WITH TRAVELING DATA PACKETS */}
          <g>
            {TELEMETRY_ARCS.map((arc) => (
              <g key={arc.id}>
                {/* Background soft glowing arc line */}
                <path
                  d={arc.pathD}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth="2.5"
                  strokeOpacity="0.25"
                  filter="url(#softGlow)"
                />
                {/* Foreground crisp arc line */}
                <path
                  d={arc.pathD}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                  strokeOpacity="0.8"
                />

                {/* Animated traveling data photon */}
                {isLiveTelemetry && (
                  <circle r="3.5" fill="#FFFFFF" filter="url(#softGlow)">
                    <animateMotion
                      path={arc.pathD}
                      dur={arc.dur}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                {isLiveTelemetry && (
                  <circle r="6" fill={arc.color} opacity="0.4">
                    <animateMotion
                      path={arc.pathD}
                      dur={arc.dur}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            ))}
          </g>

          {/* LEADER LINES CONNECTING CONTINENT NODES TO CALLOUT BADGES */}
          <g>
            {REGIONAL_HUBS.map((hub) => {
              const isSelected = activeHub?.id === hub.id;
              const isHovered = hoveredHub?.id === hub.id;
              const strokeColor = isSelected || isHovered ? '#FFFFFF' : hub.color;

              return (
                <g key={`leader-${hub.id}`}>
                  {/* Glowing Leader Path */}
                  <path
                    d={hub.leaderD}
                    fill="none"
                    stroke={hub.color}
                    strokeWidth={isSelected || isHovered ? '2.5' : '1.5'}
                    strokeOpacity={isSelected || isHovered ? '1' : '0.65'}
                    filter="url(#softGlow)"
                  />
                  <path
                    d={hub.leaderD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="1"
                    strokeOpacity="0.9"
                  />
                </g>
              );
            })}
          </g>

          {/* CONTINENT NODE PULSES (CIRCULAR RINGS ON CONTINENTS) */}
          <g>
            {REGIONAL_HUBS.map((hub) => {
              const isSelected = activeHub?.id === hub.id;
              const isHovered = hoveredHub?.id === hub.id;

              return (
                <g 
                  key={`node-${hub.id}`} 
                  transform={`translate(${hub.node.x}, ${hub.node.y})`}
                  className="cursor-pointer"
                  onClick={() => handleHubClick(hub)}
                  onMouseEnter={() => setHoveredHub(hub)}
                  onMouseLeave={() => setHoveredHub(null)}
                >
                  {/* Outer Ripple Wave */}
                  <circle
                    r="14"
                    fill="none"
                    stroke={hub.dotColor}
                    strokeWidth="1.5"
                    opacity="0.6"
                    className="animate-ping"
                  />
                  {/* Mid Pulse Ring */}
                  <circle
                    r="10"
                    fill={hub.dotColor}
                    fillOpacity="0.25"
                    stroke={hub.dotColor}
                    strokeWidth="1.2"
                  />
                  {/* Center Dot */}
                  <circle
                    r={isSelected || isHovered ? '6' : '4.5'}
                    fill="#FFFFFF"
                    stroke={hub.dotColor}
                    strokeWidth="2"
                    filter="url(#softGlow)"
                  />
                </g>
              );
            })}
          </g>

          {/* INTERACTIVE CALLOUT BADGES (ROUNDED GLASS PILLS MATCHING IMAGE) */}
          <g>
            {REGIONAL_HUBS.map((hub) => {
              const isSelected = activeHub?.id === hub.id;
              const isHovered = hoveredHub?.id === hub.id;
              const subtitle = mode === 'operations' ? hub.tagline : hub.threatTagline;

              // Calculate width based on label length
              const cardWidth = Math.max(160, hub.name.length * 8.5 + 40);
              const cardHeight = 44;

              return (
                <g
                  key={`badge-${hub.id}`}
                  transform={`translate(${hub.badge.x}, ${hub.badge.y})`}
                  className="cursor-pointer transition-all duration-300"
                  onClick={() => handleHubClick(hub)}
                  onMouseEnter={() => setHoveredHub(hub)}
                  onMouseLeave={() => setHoveredHub(null)}
                >
                  {/* Card Outer Glow Aura */}
                  <rect
                    x="0"
                    y="0"
                    width={cardWidth}
                    height={cardHeight}
                    rx="22"
                    fill="none"
                    stroke={hub.dotColor}
                    strokeWidth={isSelected || isHovered ? '3' : '1.8'}
                    strokeOpacity={isSelected || isHovered ? '0.9' : '0.45'}
                    filter="url(#softGlow)"
                  />

                  {/* Card Main Body Pill */}
                  <rect
                    x="0"
                    y="0"
                    width={cardWidth}
                    height={cardHeight}
                    rx="22"
                    fill={isSelected ? '#0E1A1F' : 'rgba(255, 255, 255, 0.94)'}
                    filter="url(#pillShadow)"
                    className="transition-colors duration-200"
                  />

                  {/* Left Emblem Dot with Concentric Ring */}
                  <g transform="translate(20, 22)">
                    <circle
                      r="6.5"
                      fill={hub.dotColor}
                      opacity={isSelected ? '0.9' : '0.85'}
                    />
                    <circle
                      r="3"
                      fill="#FFFFFF"
                    />
                  </g>

                  {/* Text Container: Title + Tagline */}
                  <g transform="translate(36, 17)">
                    {/* Continent Title */}
                    <text
                      x="0"
                      y="0"
                      fill={isSelected ? '#FFFFFF' : '#0F172A'}
                      fontSize="10.5"
                      fontWeight="800"
                      letterSpacing="0.06em"
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      {hub.name}
                    </text>

                    {/* Subtitle / Role */}
                    <text
                      x="0"
                      y="14"
                      fill={isSelected ? hub.dotColor : '#475569'}
                      fontSize="8"
                      fontWeight="700"
                      letterSpacing="0.08em"
                      fontFamily="monospace"
                      textAnchor="start"
                    >
                      {subtitle}
                    </text>
                  </g>

                  {/* Small Active Pulse Indicator on Right */}
                  <circle
                    cx={cardWidth - 14}
                    cy="22"
                    r="2.5"
                    fill={hub.dotColor}
                    opacity="0.8"
                    className="animate-pulse"
                  />
                </g>
              );
            })}
          </g>

          {/* BOTTOM-LEFT RETICLE & BRAND ACCENT (EXACT FROM IMAGE) */}
          <g transform="translate(45, 570)">
            {/* Target Reticle / Compass */}
            <circle cx="20" cy="20" r="14" fill="none" stroke="#60A5FA" strokeWidth="1.2" opacity="0.6" />
            <circle cx="20" cy="20" r="7" fill="none" stroke="#6967FB" strokeWidth="1" opacity="0.4" />
            <line x1="20" y1="2" x2="20" y2="38" stroke="#60A5FA" strokeWidth="1" opacity="0.6" />
            <line x1="2" y1="20" x2="38" y2="20" stroke="#60A5FA" strokeWidth="1" opacity="0.6" />
            {/* Central Diamond Cross */}
            <polygon points="20,12 23,20 20,28 17,20" fill="#93C5FD" opacity="0.85" />

            {/* Adjacent Micro Labels */}
            <text x="48" y="16" fill="#60A5FA" fontSize="8.5" fontWeight="700" letterSpacing="0.16em" fontFamily="monospace">
              GLOBAL REACH
            </text>
            <text x="48" y="28" fill="#94A3B8" fontSize="7.5" fontWeight="600" letterSpacing="0.14em" fontFamily="monospace">
              LOCAL IMPACT
            </text>
          </g>

          {/* BOTTOM-RIGHT BADGE: ✦ EST. BENGALURU, INDIA (EXACT FROM IMAGE) */}
          <g transform="translate(980, 585)">
            {/* Rectangular Tech Border Box */}
            <rect
              x="0"
              y="0"
              width="170"
              height="30"
              rx="4"
              fill="#050B10"
              stroke="#C8F904"
              strokeWidth="1.4"
              filter="url(#softGlow)"
            />
            {/* Internal Corner Accents */}
            <rect x="2" y="2" width="4" height="4" fill="#C8F904" opacity="0.6" />
            <rect x="164" y="2" width="4" height="4" fill="#C8F904" opacity="0.6" />
            <rect x="2" y="24" width="4" height="4" fill="#C8F904" opacity="0.6" />
            <rect x="164" y="24" width="4" height="4" fill="#C8F904" opacity="0.6" />

            {/* Badge Content */}
            <text
              x="12"
              y="19"
              fill="#C8F904"
              fontSize="9.5"
              fontWeight="800"
              letterSpacing="0.14em"
              fontFamily="monospace"
            >
              ✦ EST. BENGALURU, INDIA
            </text>
          </g>
        </svg>

        {/* FLOATING TELEMETRY DRAWER / INSPECTION MODAL */}
        {activeHub && (
          <div className="absolute bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-96 bg-[#050F16]/95 border border-[rgba(0,190,210,0.4)] rounded-2xl p-5 shadow-2xl backdrop-blur-xl z-30 font-mono animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <span 
                  className="w-3.5 h-3.5 rounded-full" 
                  style={{ backgroundColor: activeHub.dotColor, boxShadow: `0 0 10px ${activeHub.dotColor}` }} 
                />
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">{activeHub.name}</h3>
                  <p className="text-[10px] text-slate-400">{activeHub.tagline} • {activeHub.threatTagline}</p>
                </div>
              </div>

              <button
                onClick={() => setActiveHub(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="p-2.5 rounded-xl bg-black/50 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block mb-0.5">LATENCY</span>
                <span className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#C8F904]" />
                  {activeHub.latency} ms
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/50 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block mb-0.5">THROUGHPUT</span>
                <span className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#60A5FA]" />
                  {activeHub.throughput}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/50 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block mb-0.5">24H MITIGATIONS</span>
                <span className="font-bold text-white text-xs text-[#C8F904]">
                  {activeHub.blocked24h.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/50 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block mb-0.5">ACTIVE CLUSTERS</span>
                <span className="font-bold text-white text-xs">
                  {activeHub.activeNodes} Nodes
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">EDGE GATEWAY:</span>
                <span className="text-slate-200 font-semibold">{activeHub.asnGateway}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PRIMARY VECTOR:</span>
                <span className="text-[#FF5264] font-semibold">{activeHub.topVector}</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
              <span className="flex items-center gap-1 text-[#C8F904]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C8F904] animate-ping" />
                STATUS: {activeHub.status}
              </span>
              <span className="font-semibold text-slate-300">CYVANTIS DEFENSE GRID</span>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM FOOTER TELEMETRY STATUS BAR */}
      <div className="relative z-20 px-6 py-2.5 bg-[#050F16]/80 border-t border-slate-800/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-4 text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6967FB] animate-pulse" />
            <span className="text-[11px]">GLOBAL ORCHESTRATION: <strong className="text-white">SYNCHRONIZED</strong></span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-slate-400 text-[11px]">
            <span>•</span>
            <span>PROTECTED TENANTS: <strong className="text-[#C8F904]">1,420+</strong></span>
            <span>•</span>
            <span>ZERO-DAY DEFLECTION RATE: <strong className="text-white">99.98%</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="text-slate-500">PRESS ANY HUB CARD TO INSPECT REAL-TIME PACKET FLOW</span>
        </div>
      </div>
    </div>
  );
};
