import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, Play, ArrowRight, Radio, Activity, Eye, Compass,
  Sparkles, Layers, Cpu, Terminal, Globe, Lock, RefreshCw, Zap
} from 'lucide-react';

interface SpaceCyberShowcaseProps {
  onLoginClick: () => void;
  onOpenVideoModal: () => void;
  onOpenTour?: () => void;
}

interface CelestialSector {
  id: string;
  number: string;
  name: string;
  codename: string;
  headline: string;
  subheadline: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentGlow: string;
  metrics: {
    label: string;
    value: string;
    unit?: string;
    sublabel: string;
  }[];
  coordinates: string;
  classification: string;
  defenseStatus: string;
  containmentRate: string;
}

const SECTORS: CelestialSector[] = [
  {
    id: 'deception-core',
    number: '01',
    name: 'DECEPTION CORE',
    codename: 'COWRIE-NEXUS-ALPHA',
    headline: 'High-Fidelity Autonomous Deception Core',
    subheadline: 'Medium-Interaction SSH & Telnet Decoy Jails',
    description: 'An impenetrable celestial defense envelope emulating complete Linux operating systems in real time. Traps adversaries inside isolated chroot jails while recording every keystroke, binary injection, and lateral probe.',
    primaryColor: '#C8F904',
    secondaryColor: '#00FF88',
    accentGlow: 'rgba(200, 249, 4, 0.45)',
    metrics: [
      { label: 'CONTAINMENT RATE', value: '100%', sublabel: 'Zero host kernel escapes' },
      { label: 'ATTACKER PERSISTENCE', value: '4.8m', sublabel: 'Mean decoy dwell time' },
      { label: 'HONEYTOKEN TRAPS', value: '24', unit: 'FLEET', sublabel: 'Active decoy endpoints' },
      { label: 'DECEPTION DELTA', value: '< 2ms', sublabel: 'Emulation turnaround' },
    ],
    coordinates: 'RA 18h 36m // DEC +38° 47′',
    classification: 'CLASS-V DECEPTION JAIL',
    defenseStatus: 'SECURE // AUTONOMOUS INTERCEPTION',
    containmentRate: '100% CONTAINED'
  },
  {
    id: 'ai-anomaly',
    number: '02',
    name: 'NEURAL RADAR',
    codename: 'ISOLATION-FOREST-V9',
    headline: 'Unsupervised Machine Learning Anomaly Core',
    subheadline: 'TF-IDF Command Tokenization & Threat Scoring',
    description: 'Neural intelligence matrix analyzing live terminal commands in real time. Dissects rootkit behaviors, polymorphic payload scripts, and reconnaissance patterns with instantaneous mathematical severity indexing.',
    primaryColor: '#6967FB',
    secondaryColor: '#B537F2',
    accentGlow: 'rgba(105, 103, 251, 0.55)',
    metrics: [
      { label: 'ML ACCURACY', value: '99.4%', sublabel: 'Unsupervised scoring' },
      { label: 'INFERENCE SPEED', value: '4.2ms', sublabel: 'Per command stream' },
      { label: 'ANOMALY VECTOR', value: '98.7', unit: '/100', sublabel: 'Max heuristic severity' },
      { label: 'TOKENIZED VECTORS', value: '14.2k', sublabel: 'Adversary behaviors indexed' },
    ],
    coordinates: 'RA 20h 42m // DEC -12° 15′',
    classification: 'NEURAL CLASSIFIER MATRIX',
    defenseStatus: 'ACTIVE INFERENCE // ONLINE',
    containmentRate: 'ISOLATION LEVEL 4'
  },
  {
    id: 'geospatial-map',
    number: '03',
    name: 'GEOSPATIAL NEXUS',
    codename: 'ORBITAL-GEO-TRACKER',
    headline: 'Global Threat Origin & Interception Radar',
    subheadline: 'Sub-12ms Planetary Telemetry Pipeline',
    description: 'Planetary radar array tracking adversary ingress coordinates worldwide. Maps live IP trajectories, ASN provenance, Tor relay hops, and brute-force botnets across 140+ countries directly onto tactical vectors.',
    primaryColor: '#00D2FF',
    secondaryColor: '#0072FF',
    accentGlow: 'rgba(0, 210, 255, 0.5)',
    metrics: [
      { label: 'ORIGIN COVERAGE', value: '148', unit: 'NATIONS', sublabel: 'Global intercept reach' },
      { label: 'STREAM LATENCY', value: '< 12ms', sublabel: 'WebSocket live pipeline' },
      { label: 'CAPTURED ATTACKS', value: '248+', sublabel: 'Persisted incident events' },
      { label: 'GEO ACCURACY', value: '98.9%', sublabel: 'MaxMind local database' },
    ],
    coordinates: 'RA 05h 22m // DEC +04° 19′',
    classification: 'TACTICAL GEOSPATIAL RADAR',
    defenseStatus: 'RADAR SWEEP // CONTINUOUS',
    containmentRate: 'GLOBAL TELEMETRY ACTIVE'
  },
  {
    id: 'defense-guardrails',
    number: '04',
    name: 'DEFENSIVE SUITE',
    codename: 'WAR-ROOM-SENTINEL',
    headline: 'Automated Penetration Guardrails & War Room',
    subheadline: 'MITRE ATT&CK Matrix & Remediations',
    description: 'Proactive adversary emulation laboratory that tests network perimeters against CVE exploits, lateral movements, and zero-day attack paths with enterprise-grade scope boundaries and safety guardrails.',
    primaryColor: '#FF5252',
    secondaryColor: '#FF9100',
    accentGlow: 'rgba(255, 82, 82, 0.5)',
    metrics: [
      { label: 'MITRE TECHNIQUES', value: '42', unit: 'TACTICS', sublabel: 'Covered attack stages' },
      { label: 'GUARDRAIL INTEGRITY', value: '100%', sublabel: 'Zero out-of-scope probes' },
      { label: 'EXPLOIT SIMS', value: '18+', sublabel: 'Simulated breach paths' },
      { label: 'REMEDIATION SPEED', value: 'Instant', sublabel: 'Auto-generated runbooks' },
    ],
    coordinates: 'RA 12h 08m // DEC +62° 11′',
    classification: 'AUTONOMOUS RED-TEAM SUITE',
    defenseStatus: 'GUARDRAILS ENGAGED // SANDBOX',
    containmentRate: 'AIR-GAPPED COMPLIANCE'
  }
];

export const SpaceCyberShowcase: React.FC<SpaceCyberShowcaseProps> = ({
  onLoginClick,
  onOpenVideoModal,
  onOpenTour
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [rotationProgress, setRotationProgress] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);
  const [showWireframe, setShowWireframe] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeSector = SECTORS[activeIdx];

  // Auto rotation timer between sectors
  useEffect(() => {
    if (!isAutoRotating) return;
    const interval = 80;
    const totalDuration = 7000;
    const step = (interval / totalDuration) * 100;

    const timer = setInterval(() => {
      setRotationProgress(prev => {
        if (prev >= 100) {
          setActiveIdx(current => (current + 1) % SECTORS.length);
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isAutoRotating, activeIdx]);

  // Handle Sector Click
  const handleSelectSector = (idx: number) => {
    setActiveIdx(idx);
    setRotationProgress(0);
  };

  // Mouse parallax on canvas
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMouseOffset({ x, y });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
    setIsHoveringCanvas(false);
  };

  // 3D Canvas Cyber Planet Renderer (High-Performance RequestAnimationFrame)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;
    let ringAngle = 0;

    // Responsive Canvas Resizing
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = parent.clientWidth * dpr;
        canvas.height = parent.clientHeight * dpr;
        ctx.scale(dpr, dpr);
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle Stars
    const stars: { x: number; y: number; size: number; alpha: number; speed: number }[] = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * 800,
        y: Math.random() * 800,
        size: Math.random() * 1.8 + 0.5,
        alpha: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.02 + 0.005
      });
    }

    // Render Loop
    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width <= 0 || height <= 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2 + mouseOffset.x * 25;
      const centerY = height / 2 + mouseOffset.y * 25;
      const radius = Math.max(5, Math.min(width, height) * 0.28);

      angle += 0.008;
      ringAngle += 0.005;

      const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');

      // 1. Draw Starfield
      stars.forEach(star => {
        star.alpha += Math.sin(angle * 3 + star.x) * 0.01;
        ctx.fillStyle = isLight
          ? `rgba(105, 103, 251, ${Math.max(0.15, Math.min(0.6, star.alpha))})`
          : `rgba(255, 255, 255, ${Math.max(0.2, Math.min(0.9, star.alpha))})`;
        ctx.beginPath();
        ctx.arc((star.x / 800) * width, (star.y / 800) * height, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Atmospheric Outer Glow
      const ambientGlow = ctx.createRadialGradient(
        centerX, centerY, radius * 0.8,
        centerX, centerY, radius * 2.2
      );
      ambientGlow.addColorStop(0, activeSector.accentGlow);
      ambientGlow.addColorStop(0.5, isLight ? 'rgba(105, 103, 251, 0.08)' : 'rgba(14, 26, 31, 0.4)');
      ambientGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = ambientGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // 3. Behind-Planet Orbit Rings (Tilted 3D Ellipses)
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(0.35 + mouseOffset.x * 0.1);

      // Back half of tilted ring
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.85, radius * 0.55, 0, Math.PI, Math.PI * 2);
      ctx.strokeStyle = `${activeSector.primaryColor}33`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 2.15, radius * 0.65, 0, Math.PI, Math.PI * 2);
      ctx.strokeStyle = `${activeSector.secondaryColor}22`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 4. Central Celestial Sphere
      const sphereGradient = ctx.createRadialGradient(
        centerX - radius * 0.35 + mouseOffset.x * 15,
        centerY - radius * 0.35 + mouseOffset.y * 15,
        radius * 0.1,
        centerX,
        centerY,
        radius
      );
      sphereGradient.addColorStop(0, activeSector.primaryColor);
      sphereGradient.addColorStop(0.25, activeSector.secondaryColor);
      sphereGradient.addColorStop(0.7, '#0E1A1F');
      sphereGradient.addColorStop(1, '#050B0E');

      ctx.fillStyle = sphereGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // 5. Wireframe Longitude & Latitude Grids (Cyber Sphere)
      if (showWireframe) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(1, radius - 1), 0, Math.PI * 2);
        ctx.clip();

        ctx.strokeStyle = `${activeSector.primaryColor}40`;
        ctx.lineWidth = 1;

        // Longitudes
        for (let i = -3; i <= 3; i++) {
          const shift = ((angle + (i * Math.PI) / 4) % Math.PI) - Math.PI / 2;
          const ellipseWidth = Math.cos(shift) * radius;
          ctx.beginPath();
          ctx.ellipse(
            centerX + Math.sin(shift) * radius * 0.5,
            centerY,
            Math.abs(ellipseWidth),
            radius,
            0,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }

        // Latitudes
        for (let j = 1; j <= 5; j++) {
          const yOffset = (j / 6 - 0.5) * radius * 1.8;
          const latRadius = Math.sqrt(Math.max(0, radius * radius - yOffset * yOffset));
          ctx.beginPath();
          ctx.ellipse(centerX, centerY + yOffset, latRadius, latRadius * 0.3, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 6. Atmospheric Rim Light (Fresnel Edge Glow)
      const rimGradient = ctx.createRadialGradient(
        centerX, centerY, radius * 0.75,
        centerX, centerY, radius
      );
      rimGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      rimGradient.addColorStop(0.85, `${activeSector.primaryColor}22`);
      rimGradient.addColorStop(1, `${activeSector.primaryColor}DD`);

      ctx.fillStyle = rimGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // 7. Front-Half Orbit Rings (Over Planet with 3D Depth)
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(0.35 + mouseOffset.x * 0.1);

      // Front half of inner ring
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.85, radius * 0.55, 0, 0, Math.PI);
      ctx.strokeStyle = `${activeSector.primaryColor}99`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = activeSector.primaryColor;
      ctx.shadowBlur = 12;
      ctx.stroke();

      // Front half of outer ring
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 2.15, radius * 0.65, 0, 0, Math.PI);
      ctx.strokeStyle = `${activeSector.secondaryColor}66`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Orbiting Satellite Node 1
      const sat1X = Math.cos(ringAngle * 2.2) * (radius * 1.85);
      const sat1Y = Math.sin(ringAngle * 2.2) * (radius * 0.55);
      if (Math.sin(ringAngle * 2.2) > 0) {
        ctx.fillStyle = activeSector.primaryColor;
        ctx.shadowColor = activeSector.primaryColor;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(sat1X, sat1Y, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(sat1X, sat1Y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Orbiting Satellite Node 2
      const sat2X = Math.cos(-ringAngle * 1.5 + 2) * (radius * 2.15);
      const sat2Y = Math.sin(-ringAngle * 1.5 + 2) * (radius * 0.65);
      if (Math.sin(-ringAngle * 1.5 + 2) > 0) {
        ctx.fillStyle = activeSector.secondaryColor;
        ctx.shadowColor = activeSector.secondaryColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(sat2X, sat2Y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // 8. Cyber HUD Crosshairs
      ctx.strokeStyle = isLight ? 'rgba(105, 103, 251, 0.35)' : 'rgba(159, 176, 183, 0.25)';
      ctx.lineWidth = 1;
      const crossSize = 12;

      // Top-left
      ctx.beginPath();
      ctx.moveTo(centerX - radius * 1.4 - crossSize, centerY - radius * 1.1);
      ctx.lineTo(centerX - radius * 1.4 + crossSize, centerY - radius * 1.1);
      ctx.moveTo(centerX - radius * 1.4, centerY - radius * 1.1 - crossSize);
      ctx.lineTo(centerX - radius * 1.4, centerY - radius * 1.1 + crossSize);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(centerX + radius * 1.4 - crossSize, centerY + radius * 1.1);
      ctx.lineTo(centerX + radius * 1.4 + crossSize, centerY + radius * 1.1);
      ctx.moveTo(centerX + radius * 1.4, centerY + radius * 1.1 - crossSize);
      ctx.lineTo(centerX + radius * 1.4, centerY + radius * 1.1 + crossSize);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [activeSector, mouseOffset, showWireframe]);

  return (
    <section
      id="space-showcase"
      className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 font-sans"
    >
      {/* Background Deep Cosmic Atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none rounded-3xl opacity-35"
        style={{
          background: `radial-gradient(circle at 70% 40%, ${activeSector.accentGlow} 0%, transparent 60%),
                       radial-gradient(circle at 20% 80%, rgba(105, 103, 251, 0.15) 0%, transparent 50%)`
        }}
      />

      {/* Outer Chamber Frame (Space Education Aesthetic) */}
      <div className="relative rounded-3xl bg-[#091114]/90 backdrop-blur-2xl border-2 border-[#6967FB]/30 p-4 sm:p-8 lg:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.9),0_0_80px_rgba(105,103,251,0.2)] overflow-hidden">
        {/* Specular Edge Highlights */}
        <div
          className="absolute top-0 left-16 right-16 h-[2px] transition-all duration-700 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${activeSector.primaryColor}, transparent)`
          }}
        />

        {/* Cyber Tech Corner Brackets */}
        <div className="tech-corner-tl" />
        <div className="tech-corner-tr" />
        <div className="tech-corner-bl" />
        <div className="tech-corner-br" />

        {/* Top Header Bar: Status & Telemetry Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#6967FB]/25 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <span
              className="px-3.5 py-1.5 rounded-lg text-xs font-black tracking-widest border transition-all duration-500 flex items-center gap-2 shadow-[0_0_20px_rgba(200,249,4,0.25)]"
              style={{
                backgroundColor: `${activeSector.primaryColor}20`,
                borderColor: `${activeSector.primaryColor}60`,
                color: activeSector.primaryColor
              }}
            >
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: activeSector.primaryColor }} />
              <span>MISSION SECTOR {activeSector.number}</span>
            </span>
            <span 
              className="text-xs sm:text-sm font-black tracking-wider transition-colors duration-500 drop-shadow-[0_0_12px_rgba(200,249,4,0.35)]"
              style={{ color: activeSector.primaryColor }}
            >
              // {activeSector.codename}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-[11px] text-[#9FB0B7]">
            <button
              onClick={() => setIsAutoRotating(prev => !prev)}
              className="px-2.5 py-1 rounded border border-[#6967FB]/30 hover:border-white text-[10px] text-white transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isAutoRotating ? 'animate-spin text-[#C8F904]' : 'text-[#9FB0B7]'}`} />
              <span>{isAutoRotating ? 'AUTO-ORBIT: ON' : 'AUTO-ORBIT: PAUSED'}</span>
            </button>
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: activeSector.primaryColor }}
              />
              <span className="text-white font-bold">{activeSector.defenseStatus}</span>
            </div>
            <button
              onClick={() => setShowWireframe(prev => !prev)}
              className="px-2.5 py-1 rounded border border-[#6967FB]/30 hover:border-white text-[10px] text-white transition hidden md:inline-flex cursor-pointer"
            >
              {showWireframe ? 'WIREFRAME: ON' : 'WIREFRAME: OFF'}
            </button>
          </div>
        </div>

        {/* Main Split Grid: Left Storytelling & Metrics, Right 3D Planetary Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-8">
          
          {/* Left Column: Orbital Navigation & Deep Telemetry */}
          <div className="lg:col-span-6 space-y-6 text-left">
            
            {/* Space Education Inspired Planet / Node Selector Tabs */}
            <div className="flex items-center gap-2 sm:gap-3 p-1.5 rounded-2xl bg-[#0E1A1F]/90 border border-[#6967FB]/30 overflow-x-auto">
              {SECTORS.map((sector, index) => {
                const isActive = activeIdx === index;
                return (
                  <button
                    key={sector.id}
                    onClick={() => handleSelectSector(index)}
                    onMouseEnter={() => setIsAutoRotating(false)}
                    onMouseLeave={() => setIsAutoRotating(true)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-300 shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#182C35] text-white shadow-lg border'
                        : 'text-[#9FB0B7] hover:text-white hover:bg-white/5'
                    }`}
                    style={{
                      borderColor: isActive ? sector.primaryColor : 'transparent'
                    }}
                  >
                    <span
                      className="text-[10px]"
                      style={{ color: isActive ? sector.primaryColor : '#9FB0B7' }}
                    >
                      {sector.number}
                    </span>
                    <span>{sector.name}</span>
                    {isActive && (
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: sector.primaryColor }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Orbit Auto-Advance Progress Line */}
            <div className="h-[2px] w-full bg-[#182C35] rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-100"
                style={{
                  width: `${rotationProgress}%`,
                  backgroundColor: activeSector.primaryColor
                }}
              />
            </div>

            {/* Headline and Narrative Description */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs text-[#9FB0B7]">
                <Compass className="w-3.5 h-3.5 text-[#C8F904]" />
                <span>{activeSector.coordinates}</span>
                <span className="text-[#6967FB]">•</span>
                <span className="text-white font-bold">{activeSector.classification}</span>
              </div>

              <h3 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-mono leading-tight">
                {activeSector.headline}
              </h3>

              <p className="text-xs sm:text-sm font-mono tracking-wide" style={{ color: activeSector.primaryColor }}>
                ► {activeSector.subheadline}
              </p>

              <p className="text-sm sm:text-base text-[#9FB0B7] leading-relaxed font-sans pt-1">
                {activeSector.description}
              </p>
            </div>

            {/* Space-Education Telemetry Metrics 4-Box Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
              {activeSector.metrics.map((m, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-[#0E1A1F]/80 border border-[#6967FB]/25 hover:border-white/40 transition-colors"
                >
                  <div className="text-[10px] text-[#9FB0B7] uppercase tracking-wider font-bold">
                    {m.label}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span
                      className="text-xl sm:text-2xl font-black font-mono tracking-tight"
                      style={{ color: activeSector.primaryColor }}
                    >
                      {m.value}
                    </span>
                    {m.unit && (
                      <span className="text-[10px] text-white font-bold">{m.unit}</span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#9FB0B7] normal-case mt-0.5">
                    {m.sublabel}
                  </div>
                </div>
              ))}
            </div>

            {/* High-Impact Engagement Action Buttons */}
            <div className="pt-4 flex flex-wrap items-center gap-3 font-mono">
              <button
                type="button"
                onClick={onLoginClick}
                className="btn-lime py-3 px-6 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(200,249,4,0.35)]"
              >
                <span>ENTER SOC CONSOLE</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenVideoModal}
                className="btn-secondary py-3 px-5 text-xs sm:text-sm flex items-center gap-2 cursor-pointer hover:border-[#C8F904]"
              >
                <Play className="w-3.5 h-3.5 text-[#C8F904] fill-[#C8F904]" />
                <span>WATCH 60FPS MOTION DEMO</span>
              </button>
            </div>
          </div>

          {/* Right Column: Interactive 3D Cyber Planet Canvas (Space Education Hero) */}
          <div
            className="lg:col-span-6 relative flex items-center justify-center min-h-[460px] sm:min-h-[540px] rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => { setIsHoveringCanvas(true); setIsAutoRotating(false); }}
            onMouseLeave={() => { handleMouseLeave(); setIsAutoRotating(true); }}
          >
            {/* HTML5 Canvas 3D Planetary Sphere */}
            <canvas
              ref={canvasRef}
              className="w-full h-full absolute inset-0 z-10"
            />

            {/* Futuristic Overlay Badges & Telemetry Corners */}
            <div className="absolute top-4 left-4 z-20 pointer-events-none font-mono text-[10px] space-y-1">
              <div className="px-2.5 py-1 rounded-md bg-[#0E1A1F]/90 border border-[#6967FB]/40 text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C8F904] animate-ping" />
                <span>CORE DYNAMICS: 60 FPS</span>
              </div>
              <div className="px-2.5 py-1 rounded-md bg-[#0E1A1F]/90 border border-[#6967FB]/40 text-[#9FB0B7]">
                TILT PARALLAX: {mouseOffset.x.toFixed(2)} / {mouseOffset.y.toFixed(2)}
              </div>
            </div>

            <div className="absolute top-4 right-4 z-20 pointer-events-none font-mono text-[10px]">
              <div className="px-2.5 py-1 rounded-md bg-[#0E1A1F]/90 border border-[#C8F904]/40 text-[#C8F904] font-bold">
                {activeSector.containmentRate}
              </div>
            </div>

            {/* Bottom Floating Interactive Lightbox Trigger */}
            <div className="absolute bottom-5 z-20 flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenVideoModal}
                className="px-4 py-2 rounded-xl bg-[#0E1A1F]/95 backdrop-blur-md border border-[#C8F904] text-white hover:bg-[#182C35] text-xs font-mono font-bold flex items-center gap-2 shadow-[0_0_25px_rgba(200,249,4,0.3)] transition transform hover:scale-105 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-[#C8F904]" />
                <span>EXPAND PLATFORM DEMO</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Orbit Station Footer Strip */}
        <div className="mt-8 pt-6 border-t border-[#6967FB]/20 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-[#9FB0B7]">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[#C8F904] animate-pulse" />
            <span>CYVANTIS TELEMETRY NEXUS • AUTONOMOUS THREAT INTERCEPTION</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white font-bold">LIVE PERIMETER: 100% SECURE</span>
            <span className="text-[#6967FB]">•</span>
            <button
              onClick={onLoginClick}
              className="text-[#C8F904] hover:underline font-bold"
            >
              Authenticate Gateway →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
