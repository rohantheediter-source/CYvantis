/**
 * CYVANTIS – Interactive SOC Control Center
 * Realistic Live Threat Map (Leaflet + High-Res Satellite/Tactical Basemaps + Live Canvas Overlays)
 * Featuring real great-circle ballistic arcs, comet particle trails, destination impact shockwaves,
 * real-time telemetry streaming, KPI monitoring, attack inspector, donut distribution, and events log.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Shield, Crosshair, Network, AlertTriangle, Globe, X, ArrowRight,
  Maximize2, Plus, Minus, RotateCcw, Radar, Activity, ChevronDown,
  Layers, MapPin, Play, Pause, Radio, Copy, Check, Eye
} from 'lucide-react';

/* ───────────────────────── Data Model ───────────────────────── */

type CatId = 'ddos' | 'intrusion' | 'malware' | 'scan' | 'anon';
type Sev = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

const CATS: Record<CatId, { label: string; filter: string; color: string; bg: string }> = {
  ddos:      { label: 'DDoS Attacks', filter: 'DDoS',      color: '#FF2D55', bg: 'rgba(255, 45, 85, 0.2)' },
  intrusion: { label: 'Intrusions',    filter: 'Intrusion', color: '#FFB020', bg: 'rgba(255, 176, 32, 0.2)' },
  malware:   { label: 'Malware Activity', filter: 'Malware', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.2)' },
  scan:      { label: 'Port Scans',   filter: 'Scans',     color: '#22B8F0', bg: 'rgba(34, 184, 240, 0.2)' },
  anon:      { label: 'Anonymous Traffic', filter: 'Anon', color: '#34D399', bg: 'rgba(52, 211, 153, 0.2)' },
};
const CAT_IDS = Object.keys(CATS) as CatId[];
const FILTERS: { id: 'all' | CatId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ddos', label: 'DDoS' },
  { id: 'intrusion', label: 'Intrusion' },
  { id: 'malware', label: 'Malware' },
  { id: 'scan', label: 'Scans' },
  { id: 'anon', label: 'Anon' },
];

export interface GeoNode { 
  name: string; 
  city: string;
  flag: string; 
  ip: string; 
  lat: number; 
  lon: number; 
}

const NODES: GeoNode[] = [
  { name: 'United States', city: 'New York', flag: '🇺🇸', ip: '104.21.32.18',   lat: 40.71, lon: -74.01 },
  { name: 'United States', city: 'San Francisco', flag: '🇺🇸', ip: '142.93.12.45', lat: 37.77, lon: -122.42 },
  { name: 'Netherlands',   city: 'Amsterdam', flag: '🇳🇱', ip: '185.220.101.45', lat: 52.37, lon: 4.89 },
  { name: 'Germany',       city: 'Frankfurt', flag: '🇩🇪', ip: '185.199.110.153', lat: 50.11, lon: 8.68 },
  { name: 'United Kingdom',city: 'London', flag: '🇬🇧', ip: '51.15.88.140',   lat: 51.51, lon: -0.13 },
  { name: 'Russia',        city: 'Moscow', flag: '🇷🇺', ip: '91.210.45.12',   lat: 55.75, lon: 37.62 },
  { name: 'China',         city: 'Beijing', flag: '🇨🇳', ip: '39.105.192.66',  lat: 39.90, lon: 116.41 },
  { name: 'Japan',         city: 'Tokyo', flag: '🇯🇵', ip: '133.242.18.6',   lat: 35.68, lon: 139.69 },
  { name: 'India',         city: 'Bengaluru', flag: '🇮🇳', ip: '103.21.14.77', lat: 12.97, lon: 77.59 },
  { name: 'Brazil',        city: 'São Paulo', flag: '🇧🇷', ip: '177.136.54.32', lat: -23.55, lon: -46.63 },
  { name: 'Australia',     city: 'Sydney', flag: '🇦🇺', ip: '203.0.113.25',   lat: -33.87, lon: 151.21 },
  { name: 'South Africa',  city: 'Johannesburg', flag: '🇿🇦', ip: '41.76.108.9', lat: -26.20, lon: 28.04 },
  { name: 'Singapore',     city: 'Singapore', flag: '🇸🇬', ip: '165.22.100.8', lat: 1.35, lon: 103.82 },
  { name: 'Saudi Arabia',  city: 'Riyadh', flag: '🇸🇦', ip: '185.12.30.9', lat: 24.71, lon: 46.68 }
];

export interface AttackEvent {
  id: string;
  ts: number;
  cat: CatId;
  src: number;
  dst: number;
  proto: 'UDP' | 'TCP' | 'HTTP' | 'SSH';
  port: number;
  sev: Sev;
  status: string;
  gbps: number;
  attackType: string;
}

const SEV_STYLE: Record<Sev, string> = {
  CRITICAL: 'text-[#FF4D6D] border-[#FF4D6D] bg-[#FF4D6D]/15 shadow-[0_0_10px_rgba(255,77,109,0.3)]',
  HIGH:     'text-[#FF8A3D] border-[#FF8A3D] bg-[#FF8A3D]/15',
  MEDIUM:   'text-[#FFC53D] border-[#FFC53D] bg-[#FFC53D]/15',
  LOW:      'text-[#22B8F0] border-[#22B8F0] bg-[#22B8F0]/15',
};
const STATUS_COLOR: Record<string, string> = {
  'IN PROGRESS': '#FF4D6D', DETECTED: '#FFB020', BLOCKED: '#A855F7', SINKHOLED: '#34D399', MONITORING: '#22B8F0'
};

const TYPE_NAME: Record<CatId, string[]> = {
  ddos: ['Volumetric HTTP Flood', 'SYN Flood Amplification', 'DNS Reflection Swarm'],
  intrusion: ['SSH Brute-Force Key Exchange', 'Credential Stuffing Botnet', 'RCE CVE-2024-Exploit'],
  malware: ['Mirai Botnet C2 Beacon', 'Ransomware Dropper Stager', 'Backdoor Payload Injection'],
  scan: ['ZMap Port Sweep', 'Nmap OS Fingerprinting', 'Vulnerability Surface Probe'],
  anon: ['Tor Exit Node Relay', 'Residential Proxy Tunnel', 'Fast-Flux VPN Transit'],
};

const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const utc = (ms: number) => new Date(ms).toISOString().slice(11, 19);

function makeEvent(forceCat?: CatId): AttackEvent {
  const cat = forceCat ?? rand(['ddos', 'ddos', 'intrusion', 'intrusion', 'malware', 'scan', 'anon'] as CatId[]);
  const src = Math.floor(Math.random() * NODES.length);
  let dst = Math.floor(Math.random() * NODES.length);
  if (dst === src) dst = (dst + 1) % NODES.length;
  const sev: Sev = cat === 'ddos' ? rand(['CRITICAL', 'CRITICAL', 'HIGH']) :
                   cat === 'scan' ? rand(['LOW', 'MEDIUM']) : rand(['HIGH', 'MEDIUM', 'CRITICAL']);
  const status = sev === 'CRITICAL' ? 'IN PROGRESS' : rand(['SINKHOLED', 'BLOCKED', 'DETECTED']);
  return {
    id: Math.random().toString(36).slice(2),
    ts: Date.now(), cat, src, dst,
    proto: cat === 'ddos' ? 'UDP' : cat === 'malware' ? 'HTTP' : cat === 'intrusion' ? 'SSH' : 'TCP',
    port: rand([443, 22, 2222, 80, 23, 3389, 8080]),
    sev, status,
    gbps: +(2.5 + Math.random() * 9.5).toFixed(1),
    attackType: rand(TYPE_NAME[cat]),
  };
}

/* ───────────────────────── Realistic Live Threat Map (Leaflet + Overlay) ───────────────────────── */

interface Flight { 
  ev: AttackEvent; 
  start: number;
}
const FLIGHT_MS = 3200;
const IMPACT_MS = 1400;

interface RealisticLiveThreatMapProps {
  filter: 'all' | CatId;
  selectedId: string | null;
  mapType: 'dark' | 'satellite';
  isLive: boolean;
  onAttack: (ev: AttackEvent) => void;
  onSelectAttack: (ev: AttackEvent) => void;
  onActive: (n: number) => void;
}

const RealisticLiveThreatMap: React.FC<RealisticLiveThreatMapProps> = ({
  filter,
  selectedId,
  mapType,
  isLive,
  onAttack,
  onSelectAttack,
  onActive
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const flights = useRef<Flight[]>([]);
  const filterRef = useRef(filter);
  const selRef = useRef(selectedId);
  const isLiveRef = useRef(isLive);

  filterRef.current = filter;
  selRef.current = selectedId;
  isLiveRef.current = isLive;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Create Leaflet instance
    const map = L.map(containerRef.current, {
      center: [28, 15],
      zoom: 2,
      minZoom: 1.5,
      maxZoom: 9,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
    });
    mapRef.current = map;

    // Default CartoDB Dark Matter Basemap
    const darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = darkTiles;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Tile Layer when mapType changes
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    if (mapType === 'satellite') {
      // Esri World Imagery (Photorealistic satellite imagery)
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      ).addTo(map);
    } else {
      // CartoDB Dark Matter (Tactical cyber dark mode)
      tileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', maxZoom: 19 }
      ).addTo(map);
    }
  }, [mapType]);

  // Spawn Attacks Loop
  useEffect(() => {
    const spawn = () => {
      if (!isLiveRef.current) return;
      const f = filterRef.current;
      const ev = makeEvent(f === 'all' ? undefined : f);
      flights.current.push({ ev, start: performance.now() });
      onAttack(ev);
    };

    for (let i = 0; i < 5; i++) setTimeout(spawn, i * 400);
    const interval = setInterval(spawn, 1200);
    return () => clearInterval(interval);
  }, [onAttack]);

  // Render Loop on Canvas
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    let lastActive = -1;

    // Resize canvas to match container
    const resizeCanvas = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Quadratic Bézier Point Calculator
    const bez = (a: [number, number], c: [number, number], b: [number, number], u: number): [number, number] => {
      const k = 1 - u;
      return [
        k * k * a[0] + 2 * k * u * c[0] + u * u * b[0],
        k * k * a[1] + 2 * k * u * c[1] + u * u * b[1]
      ];
    };

    const render = (now: number) => {
      const map = mapRef.current;
      if (!map || !containerRef.current) {
        raf = requestAnimationFrame(render);
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Convert GPS Nodes to Screen Pixel Positions via Leaflet
      const screenPoints: [number, number][] = NODES.map((n) => {
        const pt = map.latLngToContainerPoint([n.lat, n.lon]);
        return [pt.x, pt.y];
      });

      // 1. Draw Glowing Node Beacons
      ctx.globalCompositeOperation = 'lighter';
      screenPoints.forEach(([x, y], i) => {
        if (x < -50 || x > w + 50 || y < -50 || y > h + 50) return;
        const p = (Math.sin(now / 650 + i * 0.8) + 1) / 2;
        const node = NODES[i];

        // Outer Beacon Wave
        ctx.beginPath();
        ctx.arc(x, y, 5 + p * 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Core Glowing Node Dot
        ctx.beginPath();
        ctx.arc(x, y, 2.5 + p * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#C8F904';
        ctx.shadowColor = '#C8F904';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Micro City Label
        if (map.getZoom() >= 3) {
          ctx.fillStyle = 'rgba(232, 238, 248, 0.85)';
          ctx.font = '9px monospace';
          ctx.fillText(`${node.flag} ${node.city}`, x + 8, y + 3);
        }
      });

      // Filter expired flights
      flights.current = flights.current.filter((f) => now - f.start < FLIGHT_MS + IMPACT_MS);
      if (flights.current.length !== lastActive) {
        lastActive = flights.current.length;
        onActive(lastActive);
      }

      // 2. Draw Live Attack Arcs, Comet Trails & Shockwaves
      for (const { ev, start } of flights.current) {
        const catInfo = CATS[ev.cat] || CATS.intrusion;
        const color = catInfo.color;
        const a = screenPoints[ev.src];
        const b = screenPoints[ev.dst];

        // Great-Circle Arc Curve with Parabolic Zenith
        const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const midX = (a[0] + b[0]) / 2;
        const midY = (a[1] + b[1]) / 2;
        const arcHeight = Math.min(180, Math.max(35, dist * 0.28));
        const c: [number, number] = [midX, midY - arcHeight];

        const el = now - start;
        const u = Math.min(el / FLIGHT_MS, 1);
        const sel = selRef.current === ev.id;
        const fade = el > FLIGHT_MS ? 1 - (el - FLIGHT_MS) / IMPACT_MS : 1;

        // Faint Full Path Trace
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.quadraticCurveTo(c[0], c[1], b[0], b[1]);
        ctx.strokeStyle = color;
        ctx.globalAlpha = (sel ? 0.75 : 0.16) * fade;
        ctx.lineWidth = sel ? 2.2 : 1;
        ctx.setLineDash([3, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated Comet Particle Trail
        const u0 = Math.max(0, u - 0.26);
        const N = 24;
        for (let i = 0; i < N; i++) {
          const s = u0 + ((u - u0) * i) / N;
          const e = u0 + ((u - u0) * (i + 1)) / N;
          const p1 = bez(a, c, b, s);
          const p2 = bez(a, c, b, e);

          ctx.beginPath();
          ctx.moveTo(p1[0], p1[1]);
          ctx.lineTo(p2[0], p2[1]);
          ctx.globalAlpha = (i / N) * 0.95 * fade;
          ctx.lineWidth = 1 + (i / N) * 2;
          ctx.strokeStyle = color;
          ctx.stroke();
        }

        // Leading Glowing Photon Head
        if (u < 1) {
          const [hx, hy] = bez(a, c, b, u);
          const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 10);
          g.addColorStop(0, '#FFFFFF');
          g.addColorStop(0.35, color);
          g.addColorStop(1, 'transparent');
          ctx.globalAlpha = 1;
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(hx, hy, 10, 0, Math.PI * 2);
          ctx.fill();
        }

        // Source Launch Ring
        if (el < 900) {
          const r = (el / 900) * 18;
          ctx.beginPath();
          ctx.arc(a[0], a[1], r, 0, Math.PI * 2);
          ctx.globalAlpha = 1 - el / 900;
          ctx.lineWidth = 1.4;
          ctx.strokeStyle = color;
          ctx.stroke();
        }

        // Destination Interception Shockwave Blast
        if (el > FLIGHT_MS) {
          const k = (el - FLIGHT_MS) / IMPACT_MS;
          for (let r = 0; r < 2; r++) {
            const kk = Math.max(0, k - r * 0.25);
            ctx.beginPath();
            ctx.arc(b[0], b[1], 4 + kk * 30, 0, Math.PI * 2);
            ctx.globalAlpha = (1 - kk) * 0.85;
            ctx.lineWidth = 1.8;
            ctx.strokeStyle = color;
            ctx.stroke();
          }
          const g = ctx.createRadialGradient(b[0], b[1], 0, b[0], b[1], 16);
          g.addColorStop(0, color);
          g.addColorStop(1, 'transparent');
          ctx.globalAlpha = (1 - k) * 0.75;
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(b[0], b[1], 16, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [onActive]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* 1. Underlying Realistic Leaflet Map (CartoDB or Esri Satellite) */}
      <div ref={containerRef} className="absolute inset-0 z-0 bg-[#040814]" />

      {/* 2. Top-Layer Live Threat Graphics Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-10 pointer-events-none w-full h-full block" 
      />

      {/* 3. Screen Edge Ambient Vignette */}
      <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(4,8,20,0.85)_100%)]" />
    </div>
  );
};

/* ───────────────────────── Small UI Pieces ───────────────────────── */

const Panel: React.FC<{ 
  title: string; 
  icon: React.ReactNode; 
  right?: React.ReactNode; 
  className?: string; 
  children: React.ReactNode 
}> = ({ title, icon, right, className = '', children }) => (
  <section className={`relative rounded-xl border border-[#16406b] bg-[#06122a]/90 backdrop-blur-md shadow-[0_0_24px_rgba(0,140,255,0.12),inset_0_0_30px_rgba(0,100,200,0.06)] ${className}`}>
    <header className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-[#16406b]/60">
      <h2 className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-[#e6f1ff]">
        <span className="text-[#38BDF8]">{icon}</span>{title}
      </h2>
      {right}
    </header>
    {children}
  </section>
);

const Kpi: React.FC<{ 
  icon: React.ReactNode; 
  color: string; 
  label: string; 
  value: string; 
  delta: string; 
  sub: string 
}> = ({ icon, color, label, value, delta, sub }) => (
  <div className="flex items-center gap-3 rounded-xl border border-[#16406b] bg-[#06122a]/90 backdrop-blur-md px-4 py-3 shadow-lg">
    <div 
      className="w-11 h-11 rounded-lg flex items-center justify-center border shrink-0"
      style={{ color, borderColor: `${color}66`, background: `${color}1a`, boxShadow: `0 0 16px ${color}33` }}
    >
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[11px] text-[#8fa8c8] uppercase tracking-wider font-mono">{label}</div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-semibold leading-none font-mono" style={{ color }}>{value}</span>
        <span className="text-right text-[11px]" style={{ color: '#34D399' }}>
          ↑ {delta}<br /><span className="text-[9px] text-[#6c86a8]">{sub}</span>
        </span>
      </div>
    </div>
  </div>
);

const Donut: React.FC<{ counts: Record<CatId, number> }> = ({ counts }) => {
  const total = CAT_IDS.reduce((s, k) => s + counts[k], 0) || 1;
  const R = 38;
  const C = 2 * Math.PI * R;
  let off = 0;
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <svg viewBox="0 0 100 100" className="w-[96px] h-[96px] -rotate-90 shrink-0">
        {CAT_IDS.map((k) => {
          const len = (counts[k] / total) * C;
          const el = (
            <circle 
              key={k} 
              cx="50" 
              cy="50" 
              r={R} 
              fill="none" 
              stroke={CATS[k].color} 
              strokeWidth="11"
              strokeDasharray={`${Math.max(len - 2, 0)} ${C}`} 
              strokeDashoffset={-off} 
            />
          );
          off += len;
          return el;
        })}
        <g className="rotate-90 origin-center">
          <text x="50" y="52" textAnchor="middle" fill="#fff" fontSize="19" fontWeight="700" fontFamily="monospace">
            {total}
          </text>
          <text x="50" y="64" textAnchor="middle" fill="#8fa8c8" fontSize="8" fontFamily="monospace">
            TOTAL
          </text>
        </g>
      </svg>
      <ul className="flex-1 space-y-1.5 text-[12px] font-mono">
        {CAT_IDS.map((k) => (
          <li key={k} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[#e6f1ff]">
              <i className="w-2 h-2 rounded-full" style={{ background: CATS[k].color, boxShadow: `0 0 6px ${CATS[k].color}` }} />
              {CATS[k].filter}
            </span>
            <span className="text-[#8fa8c8]">{counts[k]} ({Math.round((counts[k] / total) * 100)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Spark: React.FC<{ a: number[]; b: number[] }> = ({ a, b }) => {
  const W = 300;
  const H = 70;
  const mx = Math.max(...a, ...b, 1);
  const line = (d: number[]) => d.map((v, i) => `${(i / (d.length - 1)) * W},${H - (v / mx) * (H - 6) - 3}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[70px]" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spA" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" stopOpacity=".45" />
          <stop offset="1" stopColor="#a855f7" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${H} ${line(a)} ${W},${H}`} fill="url(#spA)" />
      <polyline points={line(a)} fill="none" stroke="#a855f7" strokeWidth="1.6" />
      <polyline points={line(b)} fill="none" stroke="#34d399" strokeWidth="1.6" />
    </svg>
  );
};

/* ───────────────────────── Main Page Component ───────────────────────── */

export interface GeoThreatMapPageProps { 
  onNavigateEvents?: () => void;
}

export const GeoThreatMapPage: React.FC<GeoThreatMapPageProps> = ({ onNavigateEvents }) => {
  const [filter, setFilter] = useState<'all' | CatId>('all');
  const [mapType, setMapType] = useState<'dark' | 'satellite'>('dark');
  const [isLive, setIsLive] = useState<boolean>(true);
  const [events, setEvents] = useState<AttackEvent[]>([]);
  const [selected, setSelected] = useState<AttackEvent | null>(null);
  const [active, setActive] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const [counts, setCounts] = useState<Record<CatId, number>>({ ddos: 6, intrusion: 5, malware: 3, scan: 2, anon: 2 });
  const [totalConn, setTotalConn] = useState(1482);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  const [series, setSeries] = useState<{ a: number[]; b: number[] }>({
    a: Array.from({ length: 24 }, () => 30 + Math.random() * 40),
    b: Array.from({ length: 24 }, () => 10 + Math.random() * 25),
  });

  // Clock & Sparklines update
  useEffect(() => {
    const t = setInterval(() => {
      setClock(Date.now());
      setSeries((s) => ({
        a: [...s.a.slice(1), 25 + Math.random() * 55],
        b: [...s.b.slice(1), 8 + Math.random() * 30],
      }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleAttack = useCallback((ev: AttackEvent) => {
    setEvents((prev) => [ev, ...prev].slice(0, 6));
    setCounts((c) => ({ ...c, [ev.cat]: (c[ev.cat] || 0) + 1 }));
    setTotalConn((n) => n + 1);
    setSelected((cur) => (cur === null || ev.sev === 'CRITICAL' ? ev : cur));
  }, []);

  const toggleFullscreen = () => {
    if (!pageRef.current) return;
    if (!document.fullscreenElement) {
      pageRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleCopy = (ip: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const critical = useMemo(() => events.filter((e) => e.sev === 'CRITICAL').length, [events]);
  const sel = selected;
  const duration = sel ? Math.max(0, Math.floor((clock - sel.ts) / 1000)) : 0;

  return (
    <div 
      ref={pageRef}
      className="min-h-screen w-full text-[#e6f1ff] p-4 space-y-3 font-sans select-none"
      style={{ background: 'radial-gradient(1200px 600px at 50% -10%, #0a2450 0%, #030a1c 65%)' }}
    >
      {/* 1. Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-3">
          <Shield className="w-10 h-10 text-[#38BDF8] drop-shadow-[0_0_12px_#38BDF8]" />
          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold tracking-[0.14em] font-mono text-white">CYVANTIS</span>
              <span className="text-lg font-bold text-[#38BDF8]">Interactive SOC Control Center</span>
            </div>
            <p className="text-xs text-[#8fc4ff] tracking-wide font-mono">
              Real-Time Global Threat Intelligence • Satellite Reconnaissance • Autonomous Defense
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 text-xs font-mono">
          <span className="text-[#8fa8c8]">{new Date(clock).toUTCString().replace('GMT', 'UTC').slice(0, 25)}</span>
          <span className="flex items-center gap-2 text-[11px] text-[#34D399] font-bold">
            <i className="w-2.5 h-2.5 rounded-full bg-[#34D399] animate-pulse" />
            LIVE TELEMETRY STREAM
          </span>
        </div>
      </header>

      {/* 2. Top KPI Cards & Quick Category Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(4,1fr)_1.3fr] gap-3">
        <Kpi icon={<Crosshair />} color="#FF2D55" label="ACTIVE ATTACKS" value={String(active).padStart(2, '0')} delta="33%" sub="vs. last hour" />
        <Kpi icon={<Network />} color="#22B8F0" label="EVENTS / SEC" value="2.4K" delta="18%" sub="vs. last hour" />
        <Kpi icon={<AlertTriangle />} color="#FFB020" label="CRITICAL ALERTS" value={String(critical).padStart(2, '0')} delta="100%" sub="vs. last hour" />
        <Kpi icon={<Globe />} color="#34D399" label="GLOBAL SENSORS" value="14" delta="0%" sub="online" />

        <div className="rounded-xl border border-[#16406b] bg-[#06122a]/90 backdrop-blur-md px-4 py-3 shadow-lg">
          <div className="text-[11px] text-[#8fa8c8] mb-2 font-mono uppercase tracking-wider font-bold">
            THREAT CATEGORY FILTER
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button 
                key={f.id} 
                onClick={() => setFilter(f.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                  filter === f.id 
                    ? 'bg-[#0a4a8a] border-[#38bdf8] text-white shadow-[0_0_10px_rgba(56,189,248,0.5)]'
                    : 'border-[#16406b] text-[#9fb6d6] hover:border-[#38bdf8]/60 bg-[#08182b]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Main Operational Grid: Realistic Map + Attack Dossier */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-3">
        <div className="space-y-3">
          {/* Realistic Live Map Container */}
          <Panel 
            title="REALISTIC LIVE THREAT RADAR MAP" 
            icon={<Radar className="w-4 h-4 text-[#38BDF8]" />}
            right={
              <div className="flex items-center gap-3 text-xs font-mono">
                {/* Tactical / Satellite Basemap Switcher */}
                <div className="flex items-center bg-black/60 p-0.5 rounded-lg border border-[#16406b]">
                  <button
                    onClick={() => setMapType('dark')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 ${
                      mapType === 'dark' ? 'bg-[#38BDF8] text-[#080E1E]' : 'text-[#8fa8c8] hover:text-white'
                    }`}
                    title="CartoDB Tactical Dark Map"
                  >
                    <Layers className="w-3 h-3" />
                    <span>Tactical</span>
                  </button>
                  <button
                    onClick={() => setMapType('satellite')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 ${
                      mapType === 'satellite' ? 'bg-[#C8F904] text-[#080E1E]' : 'text-[#8fa8c8] hover:text-white'
                    }`}
                    title="Esri Satellite Photorealistic Map"
                  >
                    <Globe className="w-3 h-3" />
                    <span>Satellite</span>
                  </button>
                </div>

                {/* Play / Pause stream */}
                <button
                  onClick={() => setIsLive(!isLive)}
                  className={`p-1.5 rounded-md border text-xs cursor-pointer ${
                    isLive ? 'bg-[#34D399]/15 border-[#34D399] text-[#34D399]' : 'bg-[#16406b] border-[#16406b] text-[#8fa8c8]'
                  }`}
                  title={isLive ? 'Pause Stream' : 'Resume Stream'}
                >
                  {isLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-md bg-[#08182b] border border-[#16406b] text-[#8fa8c8] hover:text-white cursor-pointer"
                  title="Toggle Fullscreen"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
            }
          >
            <div className="relative h-[480px] sm:h-[520px] mx-2 mb-2 rounded-lg overflow-hidden border border-[#16406b]">
              <RealisticLiveThreatMap 
                filter={filter} 
                selectedId={sel?.id ?? null} 
                mapType={mapType}
                isLive={isLive}
                onAttack={handleAttack} 
                onSelectAttack={setSelected}
                onActive={setActive} 
              />

              {/* Floating Attack Category Legend */}
              <ul className="absolute top-3 left-3 z-30 space-y-1.5 rounded-xl border border-[#16406b] bg-[#030c20]/90 backdrop-blur-md px-3.5 py-2.5 text-[11px] font-mono shadow-xl">
                <li className="text-[10px] font-bold text-[#8fa8c8] uppercase tracking-wider mb-1 border-b border-[#16406b] pb-1">
                  ATTACK CATEGORIES
                </li>
                {CAT_IDS.map((k) => (
                  <li key={k} className="flex items-center gap-2">
                    <i 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ background: CATS[k].color, boxShadow: `0 0 8px ${CATS[k].color}` }} 
                    />
                    <span>{CATS[k].label}</span>
                  </li>
                ))}
              </ul>

              {/* Total Connections Counter */}
              <div className="absolute bottom-3 left-3 z-30 rounded-xl border border-[#16406b] bg-[#030c20]/90 backdrop-blur-md px-4 py-2 font-mono shadow-xl">
                <div className="text-[10px] text-[#8fa8c8] uppercase tracking-wider">TOTAL INGESTED CONNECTIONS</div>
                <div className="text-xl font-bold text-white leading-tight">
                  {totalConn.toLocaleString()}
                  <span className="ml-2 text-xs text-[#34D399]">↑ 18%</span>
                </div>
              </div>

              {/* View Status Pill */}
              <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 rounded-xl border border-[#16406b] bg-[#030c20]/90 backdrop-blur-md px-3 py-1.5 text-[11px]">
                  <Globe className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Basemap: <strong className="text-white uppercase">{mapType}</strong></span>
                </div>
              </div>
            </div>
          </Panel>

          {/* 4. Recent Security Events Table */}
          <Panel 
            title="RECENT REAL-TIME SECURITY EVENTS" 
            icon={<Activity className="w-4 h-4 text-[#34D399]" />}
            right={
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-[#34D399] flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#34D399] animate-ping" />
                  Live Stream
                </span>
                {onNavigateEvents && (
                  <button 
                    onClick={onNavigateEvents}
                    className="px-2.5 py-1 rounded bg-[#08182b] border border-[#16406b] text-[#38BDF8] hover:border-[#38BDF8] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Full Explorer</span> 
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            }
          >
            <div className="px-4 pb-3 overflow-x-auto">
              <table className="w-full text-[12px] font-mono min-w-[760px]">
                <thead>
                  <tr className="text-left text-[11px] text-[#8fa8c8] border-b border-[#16406b]">
                    {['TIMESTAMP (UTC)', 'CATEGORY', 'ORIGIN', 'DESTINATION', 'PROTOCOL', 'SEVERITY', 'ACTION'].map((h) => (
                      <th key={h} className="py-2 font-bold tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr 
                      key={e.id} 
                      onClick={() => setSelected(e)}
                      className={`cursor-pointer border-b border-[#0d2a4d]/60 hover:bg-[#0a2450]/70 transition-colors ${
                        sel?.id === e.id ? 'bg-[#0a2450] border-l-2 border-[#38BDF8]' : ''
                      }`}
                    >
                      <td className="py-2.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full mr-2" style={{ background: CATS[e.cat].color }} />
                        {utc(e.ts)}
                      </td>
                      <td style={{ color: CATS[e.cat].color }} className="font-bold">
                        {CATS[e.cat].label}
                      </td>
                      <td>
                        {NODES[e.src].flag} {NODES[e.src].city} 
                        <span className="ml-1 text-[#6c86a8] text-[11px]">{NODES[e.src].ip}</span>
                      </td>
                      <td>
                        {NODES[e.dst].flag} {NODES[e.dst].city} 
                        <span className="ml-1 text-[#6c86a8] text-[11px]">{NODES[e.dst].ip}</span>
                      </td>
                      <td className="text-[#9fb6d6] font-bold">{e.proto}:{e.port}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${SEV_STYLE[e.sev]}`}>
                          {e.sev}
                        </span>
                      </td>
                      <td style={{ color: STATUS_COLOR[e.status] }} className="font-bold">
                        {e.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        {/* 5. Right Sidebar: Attack Details Dossier, Donut, Analytics */}
        <div className="space-y-3">
          {/* Attack Details Panel */}
          <Panel 
            title="ATTACK VECTOR DOSSIER" 
            icon={<Crosshair className="w-4 h-4 text-[#FF2D55]" />}
            right={
              sel && (
                <button 
                  onClick={() => setSelected(null)} 
                  className="text-[#6c86a8] hover:text-white cursor-pointer"
                  title="Clear Selection"
                >
                  <X className="w-4 h-4" />
                </button>
              )
            }
          >
            {sel ? (
              <div className="px-4 pb-4 text-xs font-mono space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#16406b] pb-2">
                  <span className="font-bold text-[14px]" style={{ color: CATS[sel.cat].color }}>
                    {CATS[sel.cat].label}
                  </span>
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${SEV_STYLE[sel.sev]}`}>
                    {sel.sev}
                  </span>
                </div>

                <Row k="Source">
                  <div className="flex items-center justify-between">
                    <span>{NODES[sel.src].flag} {NODES[sel.src].city}, {NODES[sel.src].name}</span>
                    <button 
                      onClick={(e) => handleCopy(NODES[sel.src].ip, e)}
                      className="p-0.5 hover:text-[#38BDF8]"
                      title="Copy IP"
                    >
                      {copiedIp === NODES[sel.src].ip ? <Check className="w-3 h-3 text-[#34D399]" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <small className="text-[#38BDF8] block">{NODES[sel.src].ip}</small>
                </Row>

                <Row k="Target">
                  <span>{NODES[sel.dst].flag} {NODES[sel.dst].city}, {NODES[sel.dst].name}</span>
                  <small className="text-[#34D399] block">{NODES[sel.dst].ip}:{sel.port}</small>
                </Row>

                <Row k="Protocol">{sel.proto} (L4/L7)</Row>
                <Row k="Port">Target Port {sel.port}</Row>
                <Row k="Technique">{sel.attackType}</Row>

                <Row k="Throughput">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#9fb6d6] font-bold">{sel.gbps} Gbps Peak</span>
                      <span className="text-[#34D399]">INTERCEPTED</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#0d2a4d] overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${Math.min(100, sel.gbps * 10)}%`, 
                          background: CATS[sel.cat].color, 
                          boxShadow: `0 0 8px ${CATS[sel.cat].color}` 
                        }} 
                      />
                    </div>
                  </div>
                </Row>

                <Row k="Timestamp">{utc(sel.ts)} UTC</Row>
                <Row k="Duration">{Math.floor(duration / 60)}m {duration % 60}s Active</Row>

                {onNavigateEvents && (
                  <button 
                    onClick={onNavigateEvents}
                    className="w-full mt-2 py-2 rounded-lg border border-[#38BDF8]/60 text-[#38BDF8] flex items-center justify-center gap-1.5 hover:bg-[#38BDF8]/10 font-bold transition-all cursor-pointer"
                  >
                    <span>View in Incident Room</span> 
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <p className="px-4 pb-4 text-xs font-mono text-[#8fa8c8]">
                Click any attack arc or node to inspect live telemetry.
              </p>
            )}
          </Panel>

          {/* Attacks by Category Donut */}
          <Panel title="ATTACKS BY CATEGORY" icon={<Radar className="w-4 h-4 text-[#34D399]" />}>
            <Donut counts={counts} />
          </Panel>

          {/* Global Threat Analytics */}
          <Panel title="GLOBAL THREAT BANDWIDTH" icon={<Globe className="w-4 h-4 text-[#38BDF8]" />}>
            <div className="px-4 pb-3">
              <Spark a={series.a} b={series.b} />
              <div className="grid grid-cols-3 gap-2 mt-2 text-[11px] font-mono">
                <Stat label="Total Events" v="124.8K" d="18%" />
                <Stat label="Unique Sources" v="8.4K" d="12%" />
                <Stat label="Mitigated" v="2.1K" d="27%" />
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div className="grid grid-cols-[85px_1fr] items-start gap-2 border-b border-[#0d2a4d]/40 pb-1.5">
    <span className="text-[#8fa8c8] font-bold">{k}:</span>
    <div className="text-[#e6f1ff]">{children}</div>
  </div>
);

const Stat: React.FC<{ label: string; v: string; d: string }> = ({ label, v, d }) => (
  <div>
    <div className="text-[#6c86a8] text-[10px] uppercase font-bold">{label}</div>
    <div className="text-lg font-bold text-white leading-tight">{v}</div>
    <div className="text-[#34D399] text-[10px] font-bold">↑ {d}</div>
  </div>
);

export default GeoThreatMapPage;
