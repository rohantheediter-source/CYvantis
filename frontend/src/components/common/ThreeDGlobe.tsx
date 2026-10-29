import React, { useState, useEffect, useRef } from 'react';
import { Globe, Pause, Play, Volume2, VolumeX, MapPin, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

export interface RealTimeThreatEvent {
  id: string;
  source: {
    country: string;
    flag: string;
    lat: number;
    lng: number;
    ip: string;
  };
  target: {
    country: string;
    flag: string;
    lat: number;
    lng: number;
    node: string;
  };
  attack_type: 'Web Attackers' | 'DDoS Attackers' | 'Intruders' | 'Scanners' | 'Anonymizers';
  color: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  timestamp: string;
}

export const ATTACK_TYPE_CONFIG = [
  { name: 'Web Attackers', color: '#FF5264', bg: 'rgba(255,82,100,0.35)', label: 'Web Attacks' },
  { name: 'DDoS Attackers', color: '#FFD84D', bg: 'rgba(255,216,77,0.35)', label: 'DDoS Attacks' },
  { name: 'Intruders', color: '#4DABFF', bg: 'rgba(77,171,255,0.35)', label: 'Intruders' },
  { name: 'Scanners', color: '#625CFF', bg: 'rgba(98,92,255,0.35)', label: 'Scanners' },
  { name: 'Anonymizers', color: '#974DFF', bg: 'rgba(151,77,255,0.35)', label: 'Anonymizers' }
];

// Prescribed real geographic attack locations (City coordinates)
const REAL_LOCATIONS = {
  US_NY: { country: 'United States', flag: '🇺🇸', lat: 40.7128, lng: -74.0060, node: 'US-East (New York)' },
  US_SF: { country: 'United States', flag: '🇺🇸', lat: 37.7749, lng: -122.4194, node: 'US-West (San Francisco)' },
  BRAZIL: { country: 'Brazil', flag: '🇧🇷', lat: -23.5505, lng: -46.6333, node: 'South America (São Paulo)' },
  UK: { country: 'United Kingdom', flag: '🇬🇧', lat: 51.5074, lng: -0.1278, node: 'UK Gateway (London)' },
  GERMANY: { country: 'Germany', flag: '🇩🇪', lat: 52.5200, lng: 13.4050, node: 'EU-Central (Berlin)' },
  INDIA: { country: 'India', flag: '🇮🇳', lat: 28.6139, lng: 77.2090, node: 'Asia-South (New Delhi)' },
  CHINA: { country: 'China', flag: '🇨🇳', lat: 39.9042, lng: 116.4074, node: 'Asia-East (Beijing)' },
  JAPAN: { country: 'Japan', flag: '🇯🇵', lat: 35.6762, lng: 139.6503, node: 'Asia-Pacific (Tokyo)' },
  RUSSIA: { country: 'Russia', flag: '🇷🇺', lat: 55.7558, lng: 37.6173, node: 'Eurasia (Moscow)' },
  SAUDI: { country: 'Saudi Arabia', flag: '🇸🇦', lat: 24.7136, lng: 46.6753, node: 'Middle East (Riyadh)' },
  AUSTRALIA: { country: 'Australia', flag: '🇦🇺', lat: -33.8688, lng: 151.2093, node: 'Oceania (Sydney)' }
};

const INITIAL_MOCK_FEED: RealTimeThreatEvent[] = [
  { id: '1', source: { ...REAL_LOCATIONS.CHINA, ip: '103.253.42.18' }, target: REAL_LOCATIONS.US_NY, attack_type: 'Anonymizers', color: '#974DFF', severity: 'CRITICAL', timestamp: '2026-10-05T21:55:00Z' },
  { id: '2', source: { ...REAL_LOCATIONS.RUSSIA, ip: '193.142.146.210' }, target: REAL_LOCATIONS.GERMANY, attack_type: 'Intruders', color: '#4DABFF', severity: 'CRITICAL', timestamp: '2026-10-05T21:55:02Z' },
  { id: '3', source: { ...REAL_LOCATIONS.US_SF, ip: '162.243.10.12' }, target: REAL_LOCATIONS.INDIA, attack_type: 'Web Attackers', color: '#FF5264', severity: 'HIGH', timestamp: '2026-10-05T21:55:04Z' },
  { id: '4', source: { ...REAL_LOCATIONS.BRAZIL, ip: '198.51.100.44' }, target: REAL_LOCATIONS.UK, attack_type: 'DDoS Attackers', color: '#FFD84D', severity: 'HIGH', timestamp: '2026-10-05T21:55:07Z' },
  { id: '5', source: { ...REAL_LOCATIONS.INDIA, ip: '103.12.40.5' }, target: REAL_LOCATIONS.UK, attack_type: 'Scanners', color: '#625CFF', severity: 'MEDIUM', timestamp: '2026-10-05T21:55:10Z' },
  { id: '6', source: { ...REAL_LOCATIONS.SAUDI, ip: '185.12.30.9' }, target: REAL_LOCATIONS.GERMANY, attack_type: 'Web Attackers', color: '#FF5264', severity: 'CRITICAL', timestamp: '2026-10-05T21:55:12Z' }
];

export const ThreeDGlobe: React.FC<{ totalAttacks?: number }> = () => {
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');
  const [rotation, setRotation] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [events, setEvents] = useState<RealTimeThreatEvent[]>(INITIAL_MOCK_FEED);
  const [hoveredEvent, setHoveredEvent] = useState<RealTimeThreatEvent | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Synth laser audio feedback on threat detection
  const playLaserSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      // Ignore web audio errors
    }
  };

  // Auto 3D globe rotation
  useEffect(() => {
    if (!autoRotate || viewMode !== '3D') return;
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.6) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, [autoRotate, viewMode]);

  // Real-time threat data feed architecture (Simulates WebSocket updates)
  useEffect(() => {
    const streamInterval = setInterval(() => {
      const locationKeys = Object.keys(REAL_LOCATIONS);
      const srcKey = locationKeys[Math.floor(Math.random() * locationKeys.length)];
      let dstKey = locationKeys[Math.floor(Math.random() * locationKeys.length)];
      while (dstKey === srcKey) {
        dstKey = locationKeys[Math.floor(Math.random() * locationKeys.length)];
      }

      const srcLoc = REAL_LOCATIONS[srcKey as keyof typeof REAL_LOCATIONS];
      const dstLoc = REAL_LOCATIONS[dstKey as keyof typeof REAL_LOCATIONS];
      const randomCategory = ATTACK_TYPE_CONFIG[Math.floor(Math.random() * ATTACK_TYPE_CONFIG.length)];

      const newEvent: RealTimeThreatEvent = {
        id: Math.random().toString(),
        source: { ...srcLoc, ip: `${Math.floor(Math.random() * 200 + 10)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` },
        target: dstLoc,
        attack_type: randomCategory.name as any,
        color: randomCategory.color,
        severity: Math.random() > 0.4 ? 'CRITICAL' : 'HIGH',
        timestamp: new Date().toISOString()
      };

      setEvents((prev) => [newEvent, ...prev.slice(0, 6)]);
      playLaserSound();
    }, 2500);

    return () => clearInterval(streamInterval);
  }, [soundEnabled]);

  // Convert Lat/Lng to Mercator projection 2D Canvas coordinates (Width: 1000, Height: 500)
  const get2DPos = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 500;
    return { x, y };
  };

  return (
    <div className="relative w-full h-full min-h-[600px] bg-[#050B10] overflow-hidden flex flex-col justify-between p-4 font-mono select-none">
      {/* Subtle Cyber Grid */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0, 140, 155, 0.2) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(0, 140, 155, 0.2) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Screen Edge Vignette */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(5,11,16,0.9)_100%)]" />

      {/* Top Floating Controls: 2D MAP / 3D GLOBE Switcher & Zoom */}
      <div className="relative z-20 flex items-center justify-between font-sans px-2">
        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00D5E6] animate-ping" />
          <span>REAL-TIME STREAM: <strong className="text-white">WEBSOCKET CONNECTED</strong></span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          {viewMode === '2D' && (
            <div className="flex bg-[#050F16]/90 p-1 rounded-lg border border-[rgba(0,190,210,0.45)] backdrop-blur-md text-xs">
              <button 
                onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.2))}
                className="p-1.5 hover:text-[#00D5E6] transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setZoomLevel(1)}
                className="px-2 py-1 text-[10px] font-mono hover:text-[#00D5E6] transition-colors"
                title="Reset Zoom"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button 
                onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
                className="p-1.5 hover:text-[#00D5E6] transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Projection Mode Switcher */}
          <div className="flex bg-[#050F16]/90 p-1 rounded-lg border border-[rgba(0,190,210,0.45)] backdrop-blur-md text-xs">
            <button
              onClick={() => setViewMode('2D')}
              className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === '2D' ? 'bg-[#00D5E6]/20 text-[#00D5E6] border border-[#00D5E6]/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              2D Map
            </button>
            <button
              onClick={() => setViewMode('3D')}
              className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === '3D' ? 'bg-[#00D5E6]/20 text-[#00D5E6] border border-[#00D5E6]/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              3D Globe
            </button>
          </div>

          {viewMode === '3D' && (
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className="px-3 py-1.5 rounded bg-[#050F16]/90 border border-[rgba(0,190,210,0.45)] text-slate-300 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
            >
              {autoRotate ? <Pause className="w-3.5 h-3.5 text-[#00D5E6]" /> : <Play className="w-3.5 h-3.5 text-[#10B981]" />}
              {autoRotate ? 'Orbiting' : 'Paused'}
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded border text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              soundEnabled ? 'bg-[#10B981]/20 border-[#10B981]/50 text-[#10B981]' : 'bg-[#050F16]/90 border-[rgba(0,190,210,0.45)] text-slate-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#10B981]" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            {soundEnabled ? 'Audio ON' : 'Mute'}
          </button>
        </div>
      </div>

      {/* 2D FLAT REAL GEOGRAPHIC MERCATOR WORLD MAP VIEW */}
      {viewMode === '2D' && (
        <div className="relative z-10 my-auto w-full h-[520px] flex items-center justify-center overflow-hidden">
          <svg 
            viewBox="0 0 1000 500" 
            className="w-full h-full select-none transition-transform duration-300 ease-out"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <defs>
              {/* Cyan Glow Filter */}
              <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Latitude / Longitude Grid Lines */}
            <g stroke="#008C9B" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3">
              <line x1="0" y1="250" x2="1000" y2="250" /> {/* Equator */}
              <line x1="500" y1="0" x2="500" y2="500" /> {/* Prime Meridian */}
              <line x1="0" y1="125" x2="1000" y2="125" />
              <line x1="0" y1="375" x2="1000" y2="375" />
              <line x1="250" y1="0" x2="250" y2="500" />
              <line x1="750" y1="0" x2="750" y2="500" />
            </g>

            {/* REAL GEOGRAPHIC COUNTRY BOUNDARIES WITH DIRECT THREAT REGION FILLS (#00AFC0 BORDER STROKE) */}
            <g stroke="#00AFC0" strokeWidth="1.2" strokeLinejoin="round" opacity="0.9" filter="url(#cyanGlow)">
              {/* UNITED STATES (Red Threat Region #FF5264 @ 35% opacity) */}
              <path 
                d="M 175,145 L 210,135 L 255,135 L 295,120 L 305,140 L 305,170 L 275,190 L 235,195 L 195,190 L 160,165 Z" 
                fill={hoveredCountry === 'United States' ? 'rgba(255,82,100,0.6)' : 'rgba(255,82,100,0.35)'}
                onMouseEnter={() => setHoveredCountry('United States')}
                onMouseLeave={() => setHoveredCountry(null)}
                className="cursor-pointer transition-colors"
              />
              {/* Alaska */}
              <path d="M 50,60 L 110,40 L 135,70 L 85,95 Z" fill="#08141F" />

              {/* CANADA */}
              <path 
                d="M 115,35 L 175,25 L 245,20 L 305,30 L 335,60 L 295,120 L 255,135 L 210,135 L 175,145 L 135,115 Z" 
                fill={hoveredCountry === 'Canada' ? 'rgba(77,171,255,0.4)' : '#08141F'}
                onMouseEnter={() => setHoveredCountry('Canada')}
                onMouseLeave={() => setHoveredCountry(null)}
                className="cursor-pointer transition-colors"
              />

              {/* MEXICO */}
              <path d="M 160,165 L 195,190 L 235,195 L 255,230 L 230,245 L 195,215 L 175,190 Z" fill="#08141F" />

              {/* BRAZIL (Purple Threat Region #974DFF @ 40% opacity) */}
              <path 
                d="M 285,235 L 350,240 L 375,285 L 340,345 L 290,325 L 270,270 Z" 
                fill={hoveredCountry === 'Brazil' ? 'rgba(151,77,255,0.65)' : 'rgba(151,77,255,0.40)'}
                onMouseEnter={() => setHoveredCountry('Brazil')}
                onMouseLeave={() => setHoveredCountry(null)}
                className="cursor-pointer transition-colors"
              />

              {/* ARGENTINA & CHILE */}
              <path d="M 290,325 L 340,345 L 320,430 L 285,435 L 275,370 L 290,325 Z" fill="#08141F" />

              {/* UNITED KINGDOM (Red Threat Region) */}
              <path 
                d="M 490,95 L 508,90 L 504,115 L 486,115 Z" 
                fill={hoveredCountry === 'United Kingdom' ? 'rgba(255,82,100,0.6)' : 'rgba(255,82,100,0.35)'}
                onMouseEnter={() => setHoveredCountry('United Kingdom')}
                onMouseLeave={() => setHoveredCountry(null)}
                className="cursor-pointer transition-colors"
              />

              {/* FRANCE & SPAIN */}
              <path d="M 480,120 L 515,112 L 510,145 L 475,150 L 468,135 Z" fill="rgba(151,77,255,0.30)" />

              {/* GERMANY (Red Threat Region #FF5264 @ 45% opacity) */}
              <path 
                d="M 515,112 L 545,102 L 550,128 L 515,130 Z" 
                fill={hoveredCountry === 'Germany' ? 'rgba(255,82,100,0.65)' : 'rgba(255,82,100,0.45)'}
                onMouseEnter={() => setHoveredCountry('Germany')}
                onMouseLeave={() => setHoveredCountry(null)}
                className="cursor-pointer transition-colors"
              />

              {/* POLAND & UKRAINE */}
              <path d="M 545,102 L 600,92 L 605,135 L 550,138 Z" fill="rgba(151,77,255,0.35)" />

              {/* ITALY */}
              <path d="M 520,130 L 542,127 L 550,158 L 538,162 Z" fill="#08141F" />

              {/* RUSSIA (Blue Threat Region #4DABFF @ 25% opacity) */}
              <path 
                d="M 545,35 L 870,20 L 920,80 L 830,118 L 710,108 L 575,85 Z" 
                fill={hoveredCountry === 'Russia' ? 'rgba(77,171,255,0.45)' : 'rgba(77,171,255,0.25)'}
                onMouseEnter={() => setHoveredCountry('Russia')}
                onMouseLeave={() => setHoveredCountry(null)}
                className="cursor-pointer transition-colors"
              />

              {/* CHINA (Purple Threat Region #974DFF @ 45% opacity) */}
              <path 
                d="M 710,108 L 830,118 L 850,170 L 770,190 L 725,165 Z" 
                fill={hoveredCountry === 'China' ? 'rgba(151,77,255,0.65)' : 'rgba(151,77,255,0.45)'}
                onMouseEnter={() => setHoveredCountry('China')}
                onMouseLeave={() => setHoveredCountry(null)}
                className="cursor-pointer transition-colors"
              />

              {/* INDIA (Blue/Purple Threat Region #4DABFF @ 35% opacity) */}
              <path 
                d="M 670,170 L 740,160 L 720,255 L 685,235 Z" 
                fill={hoveredCountry === 'India' ? 'rgba(77,171,255,0.55)' : 'rgba(77,171,255,0.35)'}
                onMouseEnter={() => setHoveredCountry('India')}
                onMouseLeave={() => setHoveredCountry(null)}
                className="cursor-pointer transition-colors"
              />

              {/* JAPAN (Electric Blue Threat Region #625CFF @ 35% opacity) */}
              <path 
                d="M 865,110 L 890,105 L 880,145 L 860,150 Z" 
                fill={hoveredCountry === 'Japan' ? 'rgba(98,92,255,0.55)' : 'rgba(98,92,255,0.35)'}
                onMouseEnter={() => setHoveredCountry('Japan')}
                onMouseLeave={() => setHoveredCountry(null)}
                className="cursor-pointer transition-colors"
              />

              {/* SAUDI ARABIA & MIDDLE EAST */}
              <path d="M 575,145 C 625,135 665,150 675,195 C 645,210 595,200 575,145 Z" fill="rgba(255,82,100,0.30)" />

              {/* NORTH AFRICA & EGYPT */}
              <path d="M 445,155 L 560,145 L 575,185 L 460,195 Z" fill="rgba(77,171,255,0.20)" />

              {/* SUB-SAHARAN AFRICA */}
              <path d="M 440,195 L 575,185 L 610,230 L 585,305 L 520,280 L 440,225 Z" fill="#08141F" />

              {/* SOUTH AFRICA */}
              <path d="M 520,280 L 585,305 L 565,370 L 510,375 Z" fill="rgba(77,171,255,0.20)" />

              {/* AUSTRALIA */}
              <path 
                d="M 780,305 L 890,295 L 900,380 L 800,390 Z" 
                fill={hoveredCountry === 'Australia' ? 'rgba(0,213,230,0.3)' : '#08141F'}
                onMouseEnter={() => setHoveredCountry('Australia')}
                onMouseLeave={() => setHoveredCountry(null)}
                className="cursor-pointer transition-colors"
              />

              {/* NEW ZEALAND */}
              <path d="M 915,385 L 935,380 L 930,425 L 910,430 Z" fill="#08141F" />
            </g>

            {/* REAL GEOGRAPHIC ATTACK TRAJECTORY ARCS & BULLETS */}
            {events.map((ev) => {
              const srcPos = get2DPos(ev.source.lat, ev.source.lng);
              const dstPos = get2DPos(ev.target.lat, ev.target.lng);
              const midX = (srcPos.x + dstPos.x) / 2;
              const midY = Math.min(srcPos.y, dstPos.y) - 55;
              const pathD = `M ${srcPos.x} ${srcPos.y} Q ${midX} ${midY} ${dstPos.x} ${dstPos.y}`;

              const isHovered = hoveredEvent?.id === ev.id;

              return (
                <g key={ev.id} onMouseEnter={() => setHoveredEvent(ev)} onMouseLeave={() => setHoveredEvent(null)} className="cursor-pointer">
                  {/* Laser Arc Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={ev.color}
                    strokeWidth={isHovered ? "3.5" : "2"}
                    strokeDasharray="6 3"
                    opacity="0.9"
                    className="transition-all duration-300"
                  />

                  {/* Moving Particle Bullet */}
                  <circle r={isHovered ? "5" : "3.5"} fill={ev.color} className="shadow-[0_0_12px_#00D5E6]">
                    <animateMotion path={pathD} dur="2.2s" repeatCount="indefinite" />
                  </circle>

                  {/* Source Node (Lat/Lng) */}
                  <g transform={`translate(${srcPos.x}, ${srcPos.y})`}>
                    <circle r="10" fill={ev.color} fillOpacity="0.3" className="animate-ping" />
                    <circle r="4" fill={ev.color} stroke="#050B10" strokeWidth="1.5" />
                    <text x="10" y="-6" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace" className="uppercase tracking-wider">
                      {ev.source.flag} {ev.source.country}
                    </text>
                  </g>

                  {/* Target Node (Lat/Lng) */}
                  <g transform={`translate(${dstPos.x}, ${dstPos.y})`}>
                    <circle r="8" fill={ev.color} fillOpacity="0.2" className="animate-pulse" />
                    <circle r="3.5" fill="#00D5E6" stroke="#050B10" strokeWidth="1" />
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Floating Telemetry Tooltip for Hovered Event or Country */}
          {(hoveredEvent || hoveredCountry) && (
            <div className="absolute top-4 right-4 bg-[#050F16]/95 border border-[rgba(0,190,210,0.45)] rounded-lg p-3.5 shadow-2xl backdrop-blur-md z-30 space-y-1 text-xs max-w-xs font-mono">
              {hoveredEvent ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <span className="font-bold text-white flex items-center gap-1.5 text-sm uppercase">
                      <span>{hoveredEvent.source.flag}</span>
                      {hoveredEvent.source.country}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold border" style={{ color: hoveredEvent.color, borderColor: hoveredEvent.color }}>
                      {hoveredEvent.attack_type}
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-300 text-[11px]">
                    <p><span className="text-slate-500 font-bold uppercase">Source IP:</span> <span className="text-[#00D5E6] font-bold">{hoveredEvent.source.ip}</span></p>
                    <p><span className="text-slate-500 font-bold uppercase">Target:</span> <span className="text-white font-bold">{hoveredEvent.target.country} ({hoveredEvent.target.node})</span></p>
                    <p><span className="text-slate-500 font-bold uppercase">Severity:</span> <span className="text-rose-400 font-bold">{hoveredEvent.severity}</span></p>
                    <p><span className="text-slate-500 font-bold uppercase">Timestamp:</span> <span className="text-slate-400">{hoveredEvent.timestamp}</span></p>
                  </div>
                </>
              ) : (
                <div className="space-y-1 text-[#00D5E6] text-[11px]">
                  <p className="font-bold text-white text-sm border-b border-slate-800 pb-1 uppercase">{hoveredCountry}</p>
                  <p><span className="text-slate-400 font-bold">Threat Status:</span> HIGH INTENSITY REGION</p>
                  <p><span className="text-slate-400 font-bold">Status:</span> 100% BLOCKED AT GATEWAY</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3D SPATIAL GLOBE EARTH PROJECTION VIEW */}
      {viewMode === '3D' && (
        <div 
          className="relative z-10 my-auto w-full h-[520px] flex items-center justify-center cursor-grab active:cursor-grabbing"
          onMouseEnter={() => setAutoRotate(false)}
          onMouseLeave={() => setAutoRotate(true)}
        >
          <div 
            className="relative w-72 h-72 rounded-full transition-transform duration-100 ease-linear flex items-center justify-center shadow-[0_0_100px_rgba(0,213,230,0.25)]"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #081820 0%, #050B10 100%)',
              boxShadow: 'inset -20px -20px 50px rgba(0,0,0,0.95), inset 10px 10px 30px rgba(0,213,230,0.2), 0 0 60px rgba(0,213,230,0.2)',
              border: '1px solid rgba(0,190,210,0.45)',
              transform: `rotateY(${rotation}deg)`
            }}
          >
            <div className="absolute inset-0 rounded-full border border-[#00D5E6]/20 opacity-60" style={{ transform: 'rotateX(30deg)' }} />
            <div className="absolute inset-0 rounded-full border border-[#00D5E6]/20 opacity-60" style={{ transform: 'rotateX(60deg)' }} />
            <div className="absolute inset-0 rounded-full border border-[#974DFF]/20 opacity-60" style={{ transform: 'rotateY(90deg)' }} />
            
            <div className="absolute z-30 flex items-center justify-center" style={{ transform: 'translate3d(0px, 10px, 140px)' }}>
              <span className="w-8 h-8 rounded-full bg-[#00D5E6]/30 animate-ping absolute" />
              <span className="w-4 h-4 rounded-full bg-[#00D5E6] border-2 border-[#050B10] shadow-[0_0_20px_#00D5E6] relative z-10" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
