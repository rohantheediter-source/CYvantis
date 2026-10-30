import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Shield, 
  Activity, 
  Zap, 
  Globe2, 
  Globe,
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
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Filter,
  Copy,
  Check,
  MapPin,
  AlertTriangle,
  Info,
  Flame,
  ArrowRight
} from 'lucide-react';
import { apiRequest } from '../../services/api';

// =====================================================================
// 1. DATA MODELS & INTERFACES
// =====================================================================

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

export interface LiveAttackEvent {
  id: string;
  source: {
    country: string;
    city: string;
    flag: string;
    lat: number;
    lng: number;
    ip: string;
  };
  target: {
    country: string;
    city: string;
    node: string;
    flag: string;
    lat: number;
    lng: number;
    ip: string;
    port: number;
  };
  protocol: 'SSH' | 'Telnet' | 'HTTP' | 'HTTPS' | 'TCP' | 'UDP';
  category: 'DDoS' | 'Intrusion' | 'Malware' | 'Scanning' | 'Anonymous';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: 'INTERCEPTED' | 'ISOLATED' | 'SINKHOLED' | 'QUARANTINED' | 'ANALYZED';
  timestamp: string;
  isSimulated: boolean;
  dataSource: string;
  duration?: string;
  speed: number;
  arcHeightOffset?: number;
}

export interface AttackCategoryConfig {
  id: 'DDoS' | 'Intrusion' | 'Malware' | 'Scanning' | 'Anonymous';
  name: string;
  color: string;
  glow: string;
  bg: string;
  borderColor: string;
  description: string;
}

export const ATTACK_CATEGORIES: AttackCategoryConfig[] = [
  { 
    id: 'DDoS', 
    name: 'DDoS Attacks', 
    color: '#F43F5E', 
    glow: 'rgba(244, 63, 94, 0.45)', 
    bg: 'rgba(244, 63, 94, 0.15)', 
    borderColor: 'border-rose-500/40',
    description: 'Volumetric L4/L7 floods & amplification swarms'
  },
  { 
    id: 'Intrusion', 
    name: 'Intrusions', 
    color: '#F59E0B', 
    glow: 'rgba(245, 158, 11, 0.45)', 
    bg: 'rgba(245, 158, 11, 0.15)', 
    borderColor: 'border-amber-500/40',
    description: 'Credential brute-force, exploits & privilege escalation'
  },
  { 
    id: 'Malware', 
    name: 'Malware Activity', 
    color: '#A855F7', 
    glow: 'rgba(168, 85, 247, 0.45)', 
    bg: 'rgba(168, 85, 247, 0.15)', 
    borderColor: 'border-purple-500/40',
    description: 'Worm payloads, Mirai loaders & ransomware telemetry'
  },
  { 
    id: 'Scanning', 
    name: 'Port Scanning', 
    color: '#38BDF8', 
    glow: 'rgba(56, 189, 248, 0.45)', 
    bg: 'rgba(56, 189, 248, 0.15)', 
    borderColor: 'border-sky-500/40',
    description: 'SYN discovery, ZMap probes & banner grabbing'
  },
  { 
    id: 'Anonymous', 
    name: 'Anonymous Traffic', 
    color: '#C8F904', 
    glow: 'rgba(200, 249, 4, 0.45)', 
    bg: 'rgba(200, 249, 4, 0.15)', 
    borderColor: 'border-[#C8F904]/40',
    description: 'Tor exit nodes, residential proxies & VPN tunnels'
  },
];

// Preserved Regional Hubs for Operations Mode (Backward Compatibility)
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

// =====================================================================
// 2. GEOGRAPHIC COORDINATES & PROJECTION SYSTEM (1200 x 600 Canvas)
// =====================================================================

export const WORLD_HUBS = {
  US_EAST: { country: 'United States', city: 'New York', flag: '🇺🇸', lat: 40.71, lng: -74.01, node: 'US-East (New York)' },
  US_WEST: { country: 'United States', city: 'San Francisco', flag: '🇺🇸', lat: 37.77, lng: -122.42, node: 'US-West (Silicon Valley)' },
  UK_LON: { country: 'United Kingdom', city: 'London', flag: '🇬🇧', lat: 51.51, lng: -0.13, node: 'UK Gateway (London)' },
  DE_FRA: { country: 'Germany', city: 'Frankfurt', flag: '🇩🇪', lat: 50.11, lng: 8.68, node: 'EU-Central (Frankfurt)' },
  IN_BLR: { country: 'India', city: 'Bengaluru', flag: '🇮🇳', lat: 12.97, lng: 77.59, node: 'Asia-South (Bengaluru)' },
  IN_DEL: { country: 'India', city: 'New Delhi', flag: '🇮🇳', lat: 28.61, lng: 77.21, node: 'Asia-North (New Delhi)' },
  CN_BEI: { country: 'China', city: 'Beijing', flag: '🇨🇳', lat: 39.90, lng: 116.41, node: 'Asia-East (Beijing)' },
  JP_TYO: { country: 'Japan', city: 'Tokyo', flag: '🇯🇵', lat: 35.68, lng: 139.69, node: 'Asia-Pacific (Tokyo)' },
  RU_MOS: { country: 'Russia', city: 'Moscow', flag: '🇷🇺', lat: 55.75, lng: 37.62, node: 'Eurasia Gateway (Moscow)' },
  BR_SAO: { country: 'Brazil', city: 'São Paulo', flag: '🇧🇷', lat: -23.55, lng: -46.63, node: 'South America (São Paulo)' },
  AU_SYD: { country: 'Australia', city: 'Sydney', flag: '🇦🇺', lat: -33.87, lng: 151.21, node: 'Oceania Sinkhole (Sydney)' },
  ZA_JNB: { country: 'South Africa', city: 'Johannesburg', flag: '🇿🇦', lat: -26.20, lng: 28.04, node: 'Africa-South (Johannesburg)' },
  EG_CAI: { country: 'Egypt', city: 'Cairo', flag: '🇪🇬', lat: 30.04, lng: 31.24, node: 'North Africa Node (Cairo)' },
  SG_SIN: { country: 'Singapore', city: 'Singapore', flag: '🇸🇬', lat: 1.35, lng: 103.82, node: 'ASEAN Nexus (Singapore)' },
  SA_RUH: { country: 'Saudi Arabia', city: 'Riyadh', flag: '🇸🇦', lat: 24.71, lng: 46.68, node: 'Middle East Hub (Riyadh)' }
};

// Convert standard GPS (lat, lng) to canvas (x, y) on 1200 x 600 viewport
export function projectLatLng(lat: number, lng: number, width: number = 1200, height: number = 600): { x: number; y: number } {
  const x = ((lng + 180) / 360) * width;
  // Bounded Equirectangular projection
  const clampedLat = Math.max(-85, Math.min(85, lat));
  const y = ((85 - clampedLat) / 170) * height;
  return { x, y };
}

// Compute great-circle style quadratic Bézier curve trajectory
export function computeAttackTrajectory(
  srcLat: number, srcLng: number,
  dstLat: number, dstLng: number,
  w: number = 1200, h: number = 600,
  arcElevationFactor: number = 1.0
) {
  const p1 = projectLatLng(srcLat, srcLng, w, h);
  const p2 = projectLatLng(dstLat, dstLng, w, h);

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Dynamic arc height based on distance
  const baseArc = Math.min(130, Math.max(35, dist * 0.22)) * arcElevationFactor;
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  // Zenith bias: arc arches upward toward top of map
  const ctrlX = midX;
  const ctrlY = Math.max(15, Math.min(p1.y, p2.y) - baseArc);

  const pathD = `M ${p1.x.toFixed(1)},${p1.y.toFixed(1)} Q ${ctrlX.toFixed(1)},${ctrlY.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;

  return {
    srcX: p1.x,
    srcY: p1.y,
    dstX: p2.x,
    dstY: p2.y,
    ctrlX,
    ctrlY,
    dist,
    pathD
  };
}

// Initial Simulated / Demo Attack Stream
const INITIAL_DEMO_ATTACKS: LiveAttackEvent[] = [
  {
    id: 'atk-101',
    source: { ...WORLD_HUBS.CN_BEI, ip: '103.253.42.18' },
    target: { ...WORLD_HUBS.US_EAST, ip: '198.51.100.22', port: 22 },
    protocol: 'SSH',
    category: 'Intrusion',
    severity: 'CRITICAL',
    status: 'INTERCEPTED',
    timestamp: new Date(Date.now() - 4000).toISOString(),
    isSimulated: true,
    dataSource: 'DEMO SIMULATION (SYNTHETIC)',
    speed: 2.2,
  },
  {
    id: 'atk-102',
    source: { ...WORLD_HUBS.RU_MOS, ip: '193.142.146.210' },
    target: { ...WORLD_HUBS.DE_FRA, ip: '198.51.100.80', port: 443 },
    protocol: 'HTTPS',
    category: 'DDoS',
    severity: 'CRITICAL',
    status: 'SINKHOLED',
    timestamp: new Date(Date.now() - 8000).toISOString(),
    isSimulated: true,
    dataSource: 'DEMO SIMULATION (SYNTHETIC)',
    speed: 2.5,
  },
  {
    id: 'atk-103',
    source: { ...WORLD_HUBS.BR_SAO, ip: '177.18.90.12' },
    target: { ...WORLD_HUBS.UK_LON, ip: '198.51.100.23', port: 23 },
    protocol: 'Telnet',
    category: 'Malware',
    severity: 'HIGH',
    status: 'ISOLATED',
    timestamp: new Date(Date.now() - 12000).toISOString(),
    isSimulated: true,
    dataSource: 'DEMO SIMULATION (SYNTHETIC)',
    speed: 3.1,
  },
  {
    id: 'atk-104',
    source: { ...WORLD_HUBS.US_WEST, ip: '162.243.10.12' },
    target: { ...WORLD_HUBS.IN_BLR, ip: '198.51.100.88', port: 8080 },
    protocol: 'HTTP',
    category: 'Scanning',
    severity: 'MEDIUM',
    status: 'ANALYZED',
    timestamp: new Date(Date.now() - 16000).toISOString(),
    isSimulated: true,
    dataSource: 'DEMO SIMULATION (SYNTHETIC)',
    speed: 2.8,
  },
  {
    id: 'atk-105',
    source: { ...WORLD_HUBS.IN_DEL, ip: '103.12.40.5' },
    target: { ...WORLD_HUBS.UK_LON, ip: '198.51.100.22', port: 22 },
    protocol: 'SSH',
    category: 'Anonymous',
    severity: 'HIGH',
    status: 'INTERCEPTED',
    timestamp: new Date(Date.now() - 21000).toISOString(),
    isSimulated: true,
    dataSource: 'DEMO SIMULATION (SYNTHETIC)',
    speed: 2.6,
  },
  {
    id: 'atk-106',
    source: { ...WORLD_HUBS.SA_RUH, ip: '185.12.30.9' },
    target: { ...WORLD_HUBS.JP_TYO, ip: '198.51.100.99', port: 443 },
    protocol: 'TCP',
    category: 'DDoS',
    severity: 'CRITICAL',
    status: 'SINKHOLED',
    timestamp: new Date(Date.now() - 27000).toISOString(),
    isSimulated: true,
    dataSource: 'DEMO SIMULATION (SYNTHETIC)',
    speed: 2.4,
  }
];

// =====================================================================
// 3. MAIN COMPONENT
// =====================================================================

export interface GeographicalOperationsMapProps {
  className?: string;
  showControls?: boolean;
  defaultMode?: 'operations' | 'threat';
  onHubSelect?: (hub: RegionalHub) => void;
  onAttackSelect?: (attack: LiveAttackEvent | null) => void;
}

export const GeographicalOperationsMap: React.FC<GeographicalOperationsMapProps> = ({
  className = '',
  showControls = true,
  defaultMode = 'threat',
  onHubSelect,
  onAttackSelect
}) => {
  // Modes & View Projections
  const [mode, setMode] = useState<'operations' | 'threat'>(defaultMode);
  const [projection, setProjection] = useState<'2D' | '3D'>('2D');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Zoom & Pan state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 3D Globe Rotation
  const [globeRotation, setGlobeRotation] = useState<number>(0);

  // Attack Filtering State
  const [enabledCategories, setEnabledCategories] = useState<Set<string>>(
    new Set(['DDoS', 'Intrusion', 'Malware', 'Scanning', 'Anonymous'])
  );
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');

  // Active / Selected Entities
  const [attacks, setAttacks] = useState<LiveAttackEvent[]>(INITIAL_DEMO_ATTACKS);
  const [selectedAttack, setSelectedAttack] = useState<LiveAttackEvent | null>(null);
  const [hoveredAttack, setHoveredAttack] = useState<LiveAttackEvent | null>(null);
  const [activeHub, setActiveHub] = useState<RegionalHub | null>(null);
  const [hoveredHub, setHoveredHub] = useState<RegionalHub | null>(null);

  // UI state
  const [liveClock, setLiveClock] = useState<string>('');
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Live UTC Clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setLiveClock(d.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio Sonar chirp
  const playSonarTone = useCallback((freq: number = 780, type: OscillatorType = 'sine') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.11);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.11);
    } catch {
      // Audio fallback
    }
  }, [soundEnabled]);

  // 3D Globe Auto-Rotation
  useEffect(() => {
    if (projection !== '3D' || !isPlaying) return;
    const interval = setInterval(() => {
      setGlobeRotation((prev) => (prev + 0.5) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, [projection, isPlaying]);

  // Fetch Real Telemetry from Backend if available
  useEffect(() => {
    let isMounted = true;
    const fetchRealEvents = async () => {
      try {
        const res = await apiRequest<{ items: any[] }>('/events?page_size=20');
        if (isMounted && res && res.items && res.items.length > 0) {
          // Normalize real events into LiveAttackEvent schema
          const mapped: LiveAttackEvent[] = res.items.map((item: any, idx: number) => {
            const hubKeys = Object.keys(WORLD_HUBS);
            const targetHub = WORLD_HUBS.US_EAST; // Honeypot location
            
            // Derive attack category from event_type
            let cat: LiveAttackEvent['category'] = 'Intrusion';
            const et = (item.eventid || item.event_type || '').toLowerCase();
            if (et.includes('ddos') || et.includes('flood')) cat = 'DDoS';
            else if (et.includes('malware') || et.includes('vir') || item.file_hash) cat = 'Malware';
            else if (et.includes('scan') || et.includes('probe')) cat = 'Scanning';
            else if (et.includes('anon') || et.includes('tor')) cat = 'Anonymous';

            const sev = (item.severity || 'high').toUpperCase() as LiveAttackEvent['severity'];

            // Find matching source country or use random world hub
            const srcCountry = item.country || 'Unknown';
            const matchedHubKey = hubKeys.find(k => WORLD_HUBS[k as keyof typeof WORLD_HUBS].country.toLowerCase() === srcCountry.toLowerCase());
            const srcLoc = matchedHubKey ? WORLD_HUBS[matchedHubKey as keyof typeof WORLD_HUBS] : WORLD_HUBS.CN_BEI;

            return {
              id: `real-${item.id || idx}`,
              source: {
                country: item.country || srcLoc.country,
                city: item.city || srcLoc.city,
                flag: srcLoc.flag,
                lat: item.latitude || srcLoc.lat,
                lng: item.longitude || srcLoc.lng,
                ip: item.src_ip || '198.51.100.1'
              },
              target: {
                country: targetHub.country,
                city: targetHub.city,
                node: `Cowrie Gateway (${item.protocol || 'SSH'}:${item.dst_port || 22})`,
                flag: targetHub.flag,
                lat: targetHub.lat,
                lng: targetHub.lng,
                ip: '10.0.1.48 (Honeypot Core)',
                port: item.dst_port || 22
              },
              protocol: (item.protocol || 'SSH').toUpperCase() as any,
              category: cat,
              severity: sev === 'CRITICAL' ? 'CRITICAL' : sev === 'MEDIUM' ? 'MEDIUM' : 'HIGH',
              status: 'INTERCEPTED',
              timestamp: item.timestamp || new Date().toISOString(),
              isSimulated: item.is_simulated || false,
              dataSource: item.is_simulated ? 'SIMULATED TELEMETRY' : 'COWRIE HONEYPOT (LIVE)',
              speed: 2.2 + (idx % 3) * 0.4
            };
          });

          if (mapped.length > 0) {
            setAttacks(mapped);
            setIsDemoMode(false);
          }
        }
      } catch {
        // Backend unavailable or unauthenticated: fall back to Demo Mode
        setIsDemoMode(true);
      }
    };

    fetchRealEvents();
    const interval = setInterval(fetchRealEvents, 18000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Periodic Live Threat Stream Injection in Demo Mode
  useEffect(() => {
    if (!isPlaying || !isDemoMode) return;

    const streamTimer = setInterval(() => {
      const hubKeys = Object.keys(WORLD_HUBS);
      const srcKey = hubKeys[Math.floor(Math.random() * hubKeys.length)];
      let dstKey = hubKeys[Math.floor(Math.random() * hubKeys.length)];
      while (dstKey === srcKey) {
        dstKey = hubKeys[Math.floor(Math.random() * hubKeys.length)];
      }

      const src = WORLD_HUBS[srcKey as keyof typeof WORLD_HUBS];
      const dst = WORLD_HUBS[dstKey as keyof typeof WORLD_HUBS];
      const categoryObj = ATTACK_CATEGORIES[Math.floor(Math.random() * ATTACK_CATEGORIES.length)];
      
      const protocols: LiveAttackEvent['protocol'][] = ['SSH', 'Telnet', 'HTTP', 'HTTPS', 'TCP', 'UDP'];
      const prot = protocols[Math.floor(Math.random() * protocols.length)];
      const ports: Record<string, number> = { SSH: 22, Telnet: 23, HTTP: 80, HTTPS: 443, TCP: 8080, UDP: 53 };
      
      const statuses: LiveAttackEvent['status'][] = ['INTERCEPTED', 'ISOLATED', 'SINKHOLED', 'QUARANTINED', 'ANALYZED'];
      const st = statuses[Math.floor(Math.random() * statuses.length)];

      const newAtk: LiveAttackEvent = {
        id: `atk-${Date.now()}-${Math.floor(Math.random() * 999)}`,
        source: {
          ...src,
          ip: `${Math.floor(Math.random() * 190 + 10)}.${Math.floor(Math.random() * 254 + 1)}.${Math.floor(Math.random() * 254 + 1)}.${Math.floor(Math.random() * 254 + 1)}`
        },
        target: {
          ...dst,
          ip: `198.51.100.${Math.floor(Math.random() * 200 + 10)}`,
          port: ports[prot] || 22
        },
        protocol: prot,
        category: categoryObj.id,
        severity: Math.random() > 0.4 ? 'CRITICAL' : Math.random() > 0.3 ? 'HIGH' : 'MEDIUM',
        status: st,
        timestamp: new Date().toISOString(),
        isSimulated: true,
        dataSource: 'DEMO SIMULATION (SYNTHETIC)',
        speed: 1.8 + Math.random() * 1.6,
      };

      setAttacks((prev) => [newAtk, ...prev.slice(0, 9)]);
      playSonarTone(820, 'sine');
    }, 4200);

    return () => clearInterval(streamTimer);
  }, [isPlaying, isDemoMode, playSonarTone]);

  // Filtered Attacks
  const visibleAttacks = useMemo(() => {
    return attacks.filter((atk) => {
      if (!enabledCategories.has(atk.category)) return false;
      if (severityFilter !== 'ALL' && atk.severity !== severityFilter) return false;
      return true;
    });
  }, [attacks, enabledCategories, severityFilter]);

  // Category toggle
  const toggleCategory = (catId: string) => {
    setEnabledCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        if (next.size > 1) next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  // Fullscreen Handler
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

  // Pan & Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    // Bounded pan
    setPanOffset({
      x: Math.max(-400, Math.min(400, newX)),
      y: Math.max(-250, Math.min(250, newY))
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoomLevel((prev) => Math.max(0.8, Math.min(3.2, Number((prev + delta).toFixed(2)))));
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleAttackClick = (atk: LiveAttackEvent) => {
    const isSame = selectedAttack?.id === atk.id;
    const target = isSame ? null : atk;
    setSelectedAttack(target);
    playSonarTone(isSame ? 440 : 960, 'triangle');
    if (onAttackSelect) onAttackSelect(target);
  };

  const handleHubClick = (hub: RegionalHub) => {
    setActiveHub(activeHub?.id === hub.id ? null : hub);
    playSonarTone(620, 'sine');
    if (onHubSelect) onHubSelect(hub);
  };

  const handleCopyIp = (ip: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full bg-[#050B10] text-white rounded-2xl overflow-hidden border border-[#243149] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] select-none font-sans ${className}`}
      style={{
        background: 'radial-gradient(ellipse 90% 80% at 50% 45%, #0B1928 0%, #050B10 85%, #020609 100%)'
      }}
    >
      {/* Background Subtle Cyber Graticule Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(rgba(56, 189, 248, 0.25) 1px, transparent 1px), radial-gradient(rgba(200, 249, 4, 0.15) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 20px 20px'
          }}
        />
      </div>

      {/* Screen Edge Ambient Vignette */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(5,11,16,0.9)_100%)]" />

      {/* ================================================================= */}
      {/* 4. TOP HUD BAR: TITLE, STATS, CONTROLS */}
      {/* ================================================================= */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-[#243149] bg-[#07101B]/85 backdrop-blur-md font-mono">
        {/* Left Status & Provenance */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 border border-[#243149] shadow-[0_0_20px_rgba(56,189,248,0.2)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C8F904] shadow-[0_0_10px_#C8F904] animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-white uppercase">
              {mode === 'threat' ? 'CYVANTIS LIVE ATTACK INTERCEPTION RADAR' : 'LIVE GLOBAL OPERATIONS GRID'}
            </span>
          </div>

          {/* Mode Pill: Live Telemetry vs Demo Simulation */}
          <div 
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
              isDemoMode 
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20' 
                : 'bg-[#C8F904]/10 border-[#C8F904]/40 text-[#C8F904] hover:bg-[#C8F904]/20'
            }`}
            title="Click to toggle between Live Telemetry and Demo Mode simulation"
          >
            <Radio className="w-3 h-3 animate-pulse" />
            <span>{isDemoMode ? 'DEMO SIMULATION' : 'LIVE PRODUCTION FEED'}</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-[#94A3B8]">
            <span>•</span>
            <span className="text-[#38BDF8]">{visibleAttacks.length} ACTIVE VECTORS</span>
            <span>•</span>
            <span className="text-white font-semibold">{liveClock}</span>
          </div>
        </div>

        {/* Right Map Controls */}
        {showControls && (
          <div className="flex items-center gap-2 text-xs">
            {/* Mode Switcher: Threat Radar vs Operations Hubs */}
            <div className="flex items-center bg-black/60 p-1 rounded-xl border border-[#243149]">
              <button
                onClick={() => setMode('threat')}
                className={`px-3 py-1 rounded-lg transition-all font-semibold uppercase tracking-wider ${
                  mode === 'threat'
                    ? 'bg-[#38BDF8] text-[#080E1E] shadow-[0_0_15px_rgba(56,189,248,0.5)] font-bold'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                Threat Radar
              </button>
              <button
                onClick={() => setMode('operations')}
                className={`px-3 py-1 rounded-lg transition-all font-semibold uppercase tracking-wider ${
                  mode === 'operations'
                    ? 'bg-[#6967FB] text-white shadow-[0_0_15px_rgba(105,103,251,0.5)] font-bold'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                Operations
              </button>
            </div>

            {/* 2D / 3D Projection Toggle */}
            <div className="flex items-center bg-black/60 p-1 rounded-xl border border-[#243149]">
              <button
                onClick={() => setProjection('2D')}
                className={`px-2.5 py-1 rounded-lg transition-all font-semibold uppercase tracking-wider flex items-center gap-1 ${
                  projection === '2D'
                    ? 'bg-[#C8F904] text-[#080E1E] shadow-[0_0_12px_rgba(200,249,4,0.4)] font-bold'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
                title="2D Geospatial Flat Projection"
              >
                <MapPin className="w-3 h-3" />
                <span>2D</span>
              </button>
              <button
                onClick={() => setProjection('3D')}
                className={`px-2.5 py-1 rounded-lg transition-all font-semibold uppercase tracking-wider flex items-center gap-1 ${
                  projection === '3D'
                    ? 'bg-[#C8F904] text-[#080E1E] shadow-[0_0_12px_rgba(200,249,4,0.4)] font-bold'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
                title="3D Tactical Cyber Globe"
              >
                <Globe className="w-3 h-3" />
                <span>3D</span>
              </button>
            </div>

            {/* Zoom Controls (2D Mode) */}
            {projection === '2D' && (
              <div className="flex items-center bg-black/60 p-1 rounded-xl border border-[#243149]">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(Number((z + 0.25).toFixed(2)), 3.2))}
                  className="p-1.5 hover:text-[#38BDF8] text-[#94A3B8] transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 text-[10px] text-[#38BDF8] font-bold">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(Number((z - 0.25).toFixed(2)), 0.8))}
                  className="p-1.5 hover:text-[#38BDF8] text-[#94A3B8] transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={resetView}
                  className="p-1.5 hover:text-[#C8F904] text-[#94A3B8] transition-colors border-l border-[#243149]/60 ml-0.5"
                  title="Reset View"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Play/Pause Animation */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 rounded-xl border transition-all ${
                isPlaying 
                  ? 'bg-[#0D1528] border-[#243149] text-[#C8F904]' 
                  : 'bg-[#0D1528] border-[#243149] text-[#94A3B8]'
              }`}
              title={isPlaying ? 'Pause Animation' : 'Resume Animation'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playSonarTone(900);
              }}
              className={`p-2 rounded-xl border transition-all ${
                soundEnabled 
                  ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-[#38BDF8]' 
                  : 'bg-[#0D1528] border-[#243149] text-[#94A3B8] hover:text-white'
              }`}
              title={soundEnabled ? 'Mute Audio Sonar' : 'Enable Audio Sonar'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-[#0D1528] border border-[#243149] text-[#94A3B8] hover:text-white transition-all"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 5. INTERACTIVE ATTACK CATEGORIES & SEVERITY FILTER STRIP */}
      {/* ================================================================= */}
      {mode === 'threat' && (
        <div className="relative z-20 px-5 py-2.5 bg-[#050E1A]/80 border-b border-[#243149]/80 flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
          {/* Category Toggle Legend */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-bold mr-1">CATEGORIES:</span>
            {ATTACK_CATEGORIES.map((cat) => {
              const isEnabled = enabledCategories.has(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isEnabled
                      ? 'border-transparent shadow-[0_0_12px_rgba(0,0,0,0.5)]'
                      : 'bg-[#080E1E] border-[#243149] text-[#94A3B8] opacity-50'
                  }`}
                  style={{
                    backgroundColor: isEnabled ? cat.bg : undefined,
                    borderColor: isEnabled ? cat.color : undefined,
                    color: isEnabled ? cat.color : undefined,
                  }}
                  title={`${cat.name} (${cat.description}). Click to toggle.`}
                >
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: cat.color, boxShadow: isEnabled ? `0 0 8px ${cat.color}` : 'none' }} 
                  />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-bold">SEVERITY:</span>
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                  severityFilter === sev
                    ? 'bg-[#38BDF8] text-[#080E1E]'
                    : 'bg-[#0D1528] border border-[#243149] text-[#94A3B8] hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 6. MAIN MAP STAGE (2D SVG OR 3D GLOBE) */}
      {/* ================================================================= */}
      <div 
        className="relative w-full aspect-[16/9] min-h-[540px] max-h-[820px] flex items-center justify-center p-2 sm:p-4 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={projection === '2D' ? handleMouseDown : undefined}
        onMouseMove={projection === '2D' ? handleMouseMove : undefined}
        onMouseUp={projection === '2D' ? handleMouseUp : undefined}
        onMouseLeave={projection === '2D' ? handleMouseUp : undefined}
        onWheel={projection === '2D' ? handleWheel : undefined}
      >
        {/* ---------------- 2D FLAT GEOSPATIAL VECTOR MAP ---------------- */}
        {projection === '2D' && (
          <div 
            className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: 'center center'
            }}
          >
            <svg
              viewBox="0 0 1200 600"
              className="w-full h-full overflow-visible select-none"
            >
              <defs>
                {/* SVG Glow Filters */}
                <filter id="neonCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <filter id="particleGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <filter id="highSeverityGlow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="6" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Ocean Ambient Radial Pattern */}
                <radialGradient id="oceanGlow" cx="50%" cy="50%" r="65%">
                  <stop offset="0%" stopColor="#08182B" stopOpacity="0.45" />
                  <stop offset="70%" stopColor="#050C15" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#03070C" stopOpacity="0.95" />
                </radialGradient>

                {/* Continent Gradient Fills */}
                <linearGradient id="landFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0A1828" stopOpacity="0.95" />
                  <stop offset="60%" stopColor="#081320" stopOpacity="0.90" />
                  <stop offset="100%" stopColor="#050D17" stopOpacity="0.85" />
                </linearGradient>

                {/* Continent Specific Accents matching original design */}
                <linearGradient id="gradNorthAmerica" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.12" />
                </linearGradient>
                <linearGradient id="gradEurope" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C084FC" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#7E22CE" stopOpacity="0.15" />
                </linearGradient>
                <linearGradient id="gradAsia" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#C8F904" stopOpacity="0.20" />
                </linearGradient>
                <linearGradient id="gradAfrica" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#BEF264" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#65A30D" stopOpacity="0.15" />
                </linearGradient>
                <linearGradient id="gradSouthAmerica" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E879F9" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#9333EA" stopOpacity="0.15" />
                </linearGradient>
                <linearGradient id="gradAustralia" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C084FC" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.15" />
                </linearGradient>

                {/* Animated Radar Laser Gradients */}
                <linearGradient id="radarLaserGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
                  <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#C8F904" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="radarLaserTrail" x1="100%" y1="0%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Background Ocean Plate */}
              <rect x="0" y="0" width="1200" height="600" fill="url(#oceanGlow)" rx="16" />

              {/* Animated Vertical Radar Laser Sweep across Continents */}
              {isPlaying && mode === 'threat' && (
                <g className="pointer-events-none" opacity="0.75">
                  <line
                    x1="0" y1="0" x2="0" y2="600"
                    stroke="url(#radarLaserGrad)"
                    strokeWidth="2.5"
                    filter="url(#neonCyanGlow)"
                    style={{ animation: 'map-radar-sweep 8s linear infinite' }}
                  />
                  <rect
                    x="-60" y="0" width="60" height="600"
                    fill="url(#radarLaserTrail)"
                    style={{ animation: 'map-radar-sweep 8s linear infinite' }}
                  />
                </g>
              )}

              {/* Latitude / Longitude Graticules */}
              <g stroke="#00AFC0" strokeWidth="0.5" strokeDasharray="3 4" opacity="0.2">
                {/* Latitudes */}
                <line x1="0" y1="300" x2="1200" y2="300" strokeWidth="0.8" opacity="0.35" /> {/* Equator */}
                <line x1="0" y1="217" x2="1200" y2="217" /> {/* Tropic of Cancer ~23.5°N */}
                <line x1="0" y1="383" x2="1200" y2="383" /> {/* Tropic of Capricorn ~23.5°S */}
                <line x1="0" y1="65" x2="1200" y2="65" />   {/* Arctic Circle ~66.5°N */}
                <line x1="0" y1="535" x2="1200" y2="535" />  {/* Antarctic Circle ~66.5°S */}

                {/* Longitudes */}
                <line x1="600" y1="0" x2="600" y2="600" strokeWidth="0.8" opacity="0.35" /> {/* Prime Meridian 0° */}
                <line x1="100" y1="0" x2="100" y2="600" /> {/* 150°W */}
                <line x1="200" y1="0" x2="200" y2="600" /> {/* 120°W */}
                <line x1="300" y1="0" x2="300" y2="600" /> {/* 90°W */}
                <line x1="400" y1="0" x2="400" y2="600" /> {/* 60°W */}
                <line x1="500" y1="0" x2="500" y2="600" /> {/* 30°W */}
                <line x1="700" y1="0" x2="700" y2="600" /> {/* 30°E */}
                <line x1="800" y1="0" x2="800" y2="600" /> {/* 60°E */}
                <line x1="900" y1="0" x2="900" y2="600" /> {/* 90°E */}
                <line x1="1000" y1="0" x2="1000" y2="600" /> {/* 120°E */}
                <line x1="1100" y1="0" x2="1100" y2="600" /> {/* 150°E */}
              </g>

              {/* Coordinate Labels */}
              <g fill="#38BDF8" opacity="0.35" fontSize="7" fontFamily="monospace">
                <text x="10" y="304">EQ 0°</text>
                <text x="10" y="221">23.5°N</text>
                <text x="10" y="387">23.5°S</text>
                <text x="592" y="590">0°</text>
                <text x="292" y="590">90°W</text>
                <text x="892" y="590">90°E</text>
              </g>

              {/* ---------------- GEOGRAPHIC ACCURATE WORLD CONTINENTS ---------------- */}
              <g 
                stroke="#00AFC0" 
                strokeWidth="1.3" 
                strokeLinejoin="round" 
                strokeLinecap="round" 
                filter="url(#neonCyanGlow)"
              >
                {/* 1. GREENLAND */}
                <path
                  d="M 425,50 C 450,42 490,48 510,75 C 530,105 520,135 490,145 C 460,155 440,130 430,105 C 420,85 410,65 425,50 Z"
                  fill="url(#gradNorthAmerica)"
                  stroke="#38BDF8"
                  strokeWidth="1.2"
                />

                {/* 2. NORTH AMERICA: Canada, USA, Mexico */}
                {/* Continental USA & Canada */}
                <path
                  d="M 175,120 C 195,110 235,95 275,90 C 315,85 365,75 395,85 C 425,95 440,110 445,130 C 450,150 420,155 400,165 C 410,175 415,190 395,215 C 405,235 410,255 385,275 C 360,295 340,300 325,310 C 310,320 290,305 285,285 C 280,265 255,260 240,245 C 225,230 205,215 210,185 C 215,155 205,130 175,120 Z"
                  fill="url(#gradNorthAmerica)"
                  stroke="#38BDF8"
                  strokeWidth="1.4"
                />
                {/* Alaska Peninsula & Islands */}
                <path
                  d="M 155,100 C 140,95 115,100 105,110 C 90,125 110,145 130,140 C 145,135 155,120 155,100 Z"
                  fill="url(#gradNorthAmerica)"
                  stroke="#38BDF8"
                  strokeWidth="1"
                />
                {/* Mexico & Central America Isthmus */}
                <path
                  d="M 285,285 C 295,305 320,325 330,345 C 335,355 350,365 360,375 L 350,380 C 340,370 325,350 315,340 C 305,330 280,310 275,295 Z"
                  fill="url(#gradNorthAmerica)"
                  stroke="#38BDF8"
                  strokeWidth="1.2"
                />
                {/* Cuba & Caribbean */}
                <path d="M 370,290 C 385,290 400,298 395,305 C 385,310 370,300 370,290 Z" fill="#38BDF8" />

                {/* 3. SOUTH AMERICA */}
                <path
                  d="M 365,375 C 390,370 435,380 460,410 C 475,430 465,460 450,490 C 435,520 415,550 395,580 C 380,595 370,585 365,565 C 360,540 355,500 355,470 C 355,440 345,415 345,395 C 345,380 355,375 365,375 Z"
                  fill="url(#gradSouthAmerica)"
                  stroke="#C084FC"
                  strokeWidth="1.4"
                />

                {/* 4. EUROPE */}
                {/* Western & Central Europe */}
                <path
                  d="M 565,145 C 575,130 595,120 615,125 C 635,130 655,140 675,145 C 690,150 705,160 700,180 C 695,200 670,205 655,215 C 645,225 630,235 615,230 C 600,225 590,240 575,240 C 560,240 555,225 560,210 C 565,195 550,185 550,170 C 550,155 555,150 565,145 Z"
                  fill="url(#gradEurope)"
                  stroke="#C084FC"
                  strokeWidth="1.4"
                />
                {/* United Kingdom & Ireland */}
                <path
                  d="M 575,125 C 580,115 595,120 590,135 C 585,150 570,145 575,125 Z"
                  fill="url(#gradEurope)"
                  stroke="#C084FC"
                  strokeWidth="1"
                />
                {/* Scandinavia */}
                <path
                  d="M 625,85 C 635,75 665,85 670,105 C 660,120 630,115 625,85 Z"
                  fill="url(#gradEurope)"
                  stroke="#C084FC"
                  strokeWidth="1"
                />
                {/* Italy Boot */}
                <path d="M 625,205 C 635,215 645,235 640,245 C 635,245 625,230 620,220 Z" fill="url(#gradEurope)" stroke="#C084FC" strokeWidth="1" />

                {/* 5. AFRICA */}
                <path
                  d="M 565,245 C 590,235 645,230 675,255 C 695,275 695,305 680,335 C 665,365 655,405 645,440 C 635,465 615,475 600,460 C 585,445 575,415 570,385 C 565,355 550,330 540,305 C 530,280 545,255 565,245 Z"
                  fill="url(#gradAfrica)"
                  stroke="#C8F904"
                  strokeWidth="1.4"
                />
                {/* Madagascar */}
                <path
                  d="M 695,395 C 705,390 710,405 705,430 C 700,445 690,440 695,395 Z"
                  fill="url(#gradAfrica)"
                  stroke="#C8F904"
                  strokeWidth="1"
                />

                {/* 6. ASIA & EURASIA */}
                <path
                  d="M 690,145 C 715,130 770,120 820,125 C 870,130 930,135 970,155 C 1000,170 1010,195 995,215 C 980,235 970,260 950,270 C 930,280 915,295 900,315 C 885,335 865,330 850,310 C 835,290 810,280 790,265 C 770,250 750,245 730,230 C 710,215 695,200 690,175 C 685,155 680,150 690,145 Z"
                  fill="url(#gradAsia)"
                  stroke="#C8F904"
                  strokeWidth="1.5"
                />
                {/* Arabian Peninsula */}
                <path
                  d="M 695,245 C 725,235 750,250 755,285 C 735,295 705,285 695,245 Z"
                  fill="url(#gradAsia)"
                  stroke="#C8F904"
                  strokeWidth="1.2"
                />
                {/* India Peninsula */}
                <path
                  d="M 805,255 C 820,250 835,265 830,290 C 825,315 805,330 795,325 C 785,320 790,290 795,270 C 800,260 800,255 805,255 Z"
                  fill="url(#gradAsia)"
                  stroke="#38BDF8"
                  strokeWidth="1.3"
                />
                {/* Japan Archipelago */}
                <path
                  d="M 1035,160 C 1045,155 1050,170 1045,185 C 1040,200 1025,195 1035,160 Z"
                  fill="url(#gradAsia)"
                  stroke="#C8F904"
                  strokeWidth="1"
                />
                {/* Southeast Asia Islands */}
                <path d="M 910,315 C 925,315 940,335 930,350 C 920,365 900,355 910,315 Z" fill="url(#gradAsia)" />
                <path d="M 945,345 C 970,340 990,355 980,370 C 965,380 945,365 945,345 Z" fill="url(#gradAsia)" />

                {/* 7. AUSTRALIA & OCEANIA */}
                <path
                  d="M 975,390 C 1005,375 1055,375 1085,395 C 1105,410 1105,450 1080,475 C 1055,495 1015,495 990,480 C 970,465 960,440 965,415 C 970,400 965,395 975,390 Z"
                  fill="url(#gradAustralia)"
                  stroke="#C084FC"
                  strokeWidth="1.4"
                />
                {/* New Zealand */}
                <path
                  d="M 1120,455 C 1128,450 1132,465 1128,485 C 1124,495 1115,490 1120,455 Z"
                  fill="url(#gradAustralia)"
                  stroke="#C084FC"
                  strokeWidth="1"
                />
              </g>

              {/* ========================================================= */}
              {/* 7. OPERATIONS MODE HUBS & TELEMETRY ARCS (IF ACTIVE)     */}
              {/* ========================================================= */}
              {mode === 'operations' && (
                <>
                  {/* Fixed Telemetry Connection Arcs */}
                  <g>
                    {TELEMETRY_ARCS.map((arc) => (
                      <g key={arc.id}>
                        <path
                          d={arc.pathD}
                          fill="none"
                          stroke={arc.color}
                          strokeWidth="2.5"
                          strokeOpacity="0.25"
                          filter="url(#neonCyanGlow)"
                        />
                        <path
                          d={arc.pathD}
                          fill="none"
                          stroke={arc.color}
                          strokeWidth="1.2"
                          strokeDasharray="4 4"
                          strokeOpacity="0.8"
                        />
                        {isPlaying && (
                          <circle r="3.5" fill="#FFFFFF" filter="url(#particleGlow)">
                            <animateMotion path={arc.pathD} dur={arc.dur} repeatCount="indefinite" />
                          </circle>
                        )}
                      </g>
                    ))}
                  </g>

                  {/* Continent Leader Lines & Hub Callouts */}
                  <g>
                    {REGIONAL_HUBS.map((hub) => {
                      const isSelected = activeHub?.id === hub.id;
                      const isHovered = hoveredHub?.id === hub.id;
                      return (
                        <g 
                          key={`hub-${hub.id}`} 
                          className="cursor-pointer"
                          onClick={() => handleHubClick(hub)}
                          onMouseEnter={() => setHoveredHub(hub)}
                          onMouseLeave={() => setHoveredHub(null)}
                        >
                          <path
                            d={hub.leaderD}
                            fill="none"
                            stroke={hub.color}
                            strokeWidth={isSelected || isHovered ? '2.5' : '1.5'}
                            strokeOpacity={isSelected || isHovered ? '1' : '0.65'}
                            filter="url(#neonCyanGlow)"
                          />
                          <g transform={`translate(${hub.node.x}, ${hub.node.y})`}>
                            <circle r="14" fill="none" stroke={hub.dotColor} strokeWidth="1.5" opacity="0.6" className="animate-ping" />
                            <circle r="10" fill={hub.dotColor} fillOpacity="0.25" stroke={hub.dotColor} strokeWidth="1.2" />
                            <circle r={isSelected || isHovered ? '6' : '4.5'} fill="#FFFFFF" stroke={hub.dotColor} strokeWidth="2" />
                          </g>
                        </g>
                      );
                    })}
                  </g>
                </>
              )}

              {/* ========================================================= */}
              {/* 8. LIVE ATTACK TRAJECTORIES & ANIMATED PHOTON PARTICLES */}
              {/* ========================================================= */}
              {mode === 'threat' && (
                <g>
                  {visibleAttacks.map((atk) => {
                    const traj = computeAttackTrajectory(
                      atk.source.lat, atk.source.lng,
                      atk.target.lat, atk.target.lng,
                      1200, 600
                    );

                    const catConfig = ATTACK_CATEGORIES.find(c => c.id === atk.category) || ATTACK_CATEGORIES[0];
                    const isSelected = selectedAttack?.id === atk.id;
                    const isHovered = hoveredAttack?.id === atk.id;
                    const strokeColor = catConfig.color;
                    const dur = isPlaying ? `${atk.speed}s` : '0s';

                    return (
                      <g 
                        key={atk.id} 
                        className="cursor-pointer transition-all duration-300 group"
                        onClick={() => handleAttackClick(atk)}
                        onMouseEnter={() => setHoveredAttack(atk)}
                        onMouseLeave={() => setHoveredAttack(null)}
                      >
                        {/* 1. Underlying Soft Glow Curve */}
                        <path
                          d={traj.pathD}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={isSelected || isHovered ? '5' : '2.5'}
                          strokeOpacity={isSelected ? '0.75' : isHovered ? '0.5' : '0.22'}
                          filter="url(#highSeverityGlow)"
                        />

                        {/* 2. Crisp Laser Arc Line with directional dashes */}
                        <path
                          d={traj.pathD}
                          fill="none"
                          stroke={isSelected ? '#FFFFFF' : strokeColor}
                          strokeWidth={isSelected ? '2.4' : '1.4'}
                          strokeDasharray={isSelected ? 'none' : '6 4'}
                          strokeOpacity={isSelected ? '1' : '0.85'}
                        />

                        {/* 3. Fading Particle Trail & Leading Photon Bullet */}
                        {isPlaying && (
                          <>
                            {/* Trailing Fading Photon 1 */}
                            <circle r="2" fill={strokeColor} opacity="0.45" filter="url(#particleGlow)">
                              <animateMotion 
                                path={traj.pathD} 
                                dur={dur} 
                                keyPoints="0;1" 
                                keyTimes="0;1" 
                                repeatCount="indefinite" 
                                begin="-0.15s"
                              />
                            </circle>

                            {/* Leading Photon Head */}
                            <circle 
                              r={isSelected ? '5.5' : atk.severity === 'CRITICAL' ? '4.5' : '3.5'} 
                              fill="#FFFFFF" 
                              stroke={strokeColor}
                              strokeWidth="1.5"
                              filter="url(#particleGlow)"
                            >
                              <animateMotion 
                                path={traj.pathD} 
                                dur={dur} 
                                repeatCount="indefinite" 
                              />
                            </circle>

                            {/* Concentric Halo around photon */}
                            <circle 
                              r={atk.severity === 'CRITICAL' ? '8' : '6'} 
                              fill={strokeColor} 
                              opacity="0.35"
                            >
                              <animateMotion 
                                path={traj.pathD} 
                                dur={dur} 
                                repeatCount="indefinite" 
                              />
                            </circle>
                          </>
                        )}

                        {/* 4. Origin / Source Node (Lat/Lng) */}
                        <g transform={`translate(${traj.srcX}, ${traj.srcY})`}>
                          <circle 
                            r={atk.severity === 'CRITICAL' ? '14' : '10'} 
                            fill="none" 
                            stroke={strokeColor} 
                            strokeWidth="1.5" 
                            className="animate-ping" 
                            opacity="0.6"
                          />
                          <circle 
                            r="5" 
                            fill={strokeColor} 
                            stroke="#050B10" 
                            strokeWidth="1.5" 
                            filter="url(#particleGlow)" 
                          />
                          {/* Label on Hover / Select */}
                          {(isSelected || isHovered) && (
                            <g transform="translate(10, -8)">
                              <rect x="-4" y="-12" width="110" height="22" rx="4" fill="#080E1E" stroke={strokeColor} strokeWidth="1" opacity="0.95" />
                              <text x="4" y="2" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">
                                {atk.source.flag} {atk.source.country}
                              </text>
                            </g>
                          )}
                        </g>

                        {/* 5. Destination / Target Honeypot Node */}
                        <g transform={`translate(${traj.dstX}, ${traj.dstY})`}>
                          {/* Interception Shockwave Blast */}
                          {isPlaying && (
                            <circle 
                              r="4" 
                              fill="none" 
                              stroke={strokeColor} 
                              strokeWidth="2"
                              style={{
                                animation: `shockwave-expand ${dur} cubic-bezier(0.1, 0.7, 0.1, 1) infinite`,
                                animationDelay: `-${(atk.speed * 0.45).toFixed(2)}s`
                              }}
                            />
                          )}
                          <circle 
                            r="12" 
                            fill={strokeColor} 
                            fillOpacity="0.18" 
                            stroke={strokeColor} 
                            strokeWidth="1" 
                            className="animate-pulse" 
                          />
                          <circle 
                            r="4.5" 
                            fill="#38BDF8" 
                            stroke="#050B10" 
                            strokeWidth="1.5" 
                            filter="url(#neonCyanGlow)"
                          />
                        </g>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Tactical Compass & Radar Scanning Reticle */}
              <g transform="translate(45, 525)" className="pointer-events-none opacity-45">
                <circle cx="20" cy="20" r="16" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 3" className="animate-[spin_24s_linear_infinite]" />
                <circle cx="20" cy="20" r="9" fill="none" stroke="#C8F904" strokeWidth="0.8" />
                <line x1="20" y1="0" x2="20" y2="40" stroke="#38BDF8" strokeWidth="0.6" strokeDasharray="2 2" />
                <line x1="0" y1="20" x2="40" y2="20" stroke="#38BDF8" strokeWidth="0.6" strokeDasharray="2 2" />
                <text x="44" y="16" fill="#38BDF8" fontSize="7.5" fontWeight="bold" fontFamily="monospace">RADAR GRID</text>
                <text x="44" y="27" fill="#94A3B8" fontSize="6.5" fontFamily="monospace">AZ: 042° ACTIVE</text>
              </g>
            </svg>
          </div>
        )}

        {/* ---------------- 3D SPATIAL TACTICAL CYBER GLOBE ---------------- */}
        {projection === '3D' && (
          <div className="relative z-10 w-full h-[520px] flex items-center justify-center">
            {/* Ambient Background Aura */}
            <div className="absolute w-[440px] h-[440px] rounded-full bg-gradient-to-tr from-[#38BDF8]/15 via-[#6967FB]/10 to-[#C8F904]/15 blur-3xl pointer-events-none" />

            {/* Rotating 3D Globe Sphere */}
            <div 
              className="relative w-80 h-80 rounded-full transition-transform duration-75 ease-linear flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #0A1C2C 0%, #050E18 70%, #02060B 100%)',
                boxShadow: 'inset -25px -25px 60px rgba(0,0,0,0.95), inset 12px 12px 35px rgba(56,189,248,0.25), 0 0 70px rgba(56,189,248,0.2)',
                border: '1.5px solid rgba(56,189,248,0.45)',
                transform: `rotateY(${globeRotation}deg)`
              }}
            >
              {/* Latitude Rings */}
              <div className="absolute inset-0 rounded-full border border-[#38BDF8]/25 opacity-70" style={{ transform: 'rotateX(30deg)' }} />
              <div className="absolute inset-0 rounded-full border border-[#38BDF8]/25 opacity-70" style={{ transform: 'rotateX(60deg)' }} />
              <div className="absolute inset-0 rounded-full border border-[#6967FB]/30 opacity-70" style={{ transform: 'rotateX(90deg)' }} />

              {/* Longitude Rings */}
              <div className="absolute inset-0 rounded-full border border-[#C8F904]/25 opacity-60" style={{ transform: 'rotateY(45deg)' }} />
              <div className="absolute inset-0 rounded-full border border-[#C8F904]/25 opacity-60" style={{ transform: 'rotateY(90deg)' }} />
              <div className="absolute inset-0 rounded-full border border-[#C8F904]/25 opacity-60" style={{ transform: 'rotateY(135deg)' }} />

              {/* Central Active Target Interception Core */}
              <div className="absolute z-30 flex items-center justify-center">
                <span className="w-12 h-12 rounded-full bg-[#38BDF8]/25 animate-ping absolute" />
                <span className="w-5 h-5 rounded-full bg-[#C8F904] border-2 border-[#050B10] shadow-[0_0_20px_#C8F904] relative z-10" />
              </div>

              {/* Orbital Vectors Overlay */}
              <div className="absolute inset-[-20px] rounded-full border border-dashed border-[#F43F5E]/40 animate-[spin_12s_linear_infinite]" />
              <div className="absolute inset-[-40px] rounded-full border border-dashed border-[#38BDF8]/30 animate-[spin_18s_linear_infinite_reverse]" />
            </div>

            {/* 3D Telemetry Overlay Badge */}
            <div className="absolute bottom-6 left-6 bg-[#080E1E]/90 border border-[#243149] rounded-xl px-4 py-2 text-xs font-mono backdrop-blur-md">
              <div className="text-[#38BDF8] font-bold flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" />
                <span>SPATIAL THREAT RADAR • 360° ORBIT</span>
              </div>
              <div className="text-[11px] text-[#94A3B8] mt-0.5">
                AZIMUTH: {Math.round(globeRotation)}° • REAL-TIME VECTOR MAPPING
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* 9. FLOATING ATTACK DETAILS INSPECTOR DOSSIER                    */}
        {/* =============================================================== */}
        {selectedAttack && (
          <div className="absolute top-4 right-4 w-84 sm:w-96 bg-[#07111D]/95 border-2 border-[#38BDF8]/50 rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(56,189,248,0.25)] backdrop-blur-xl z-40 font-mono text-xs animate-in fade-in slide-in-from-right-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#243149] pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <span 
                  className="w-3.5 h-3.5 rounded-full animate-ping"
                  style={{
                    backgroundColor: ATTACK_CATEGORIES.find(c => c.id === selectedAttack.category)?.color || '#38BDF8'
                  }}
                />
                <div>
                  <h4 className="text-sm font-black text-white tracking-wider uppercase">
                    INTERCEPTED THREAT VECTOR
                  </h4>
                  <p className="text-[10px] text-[#94A3B8]">
                    {selectedAttack.dataSource}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAttack(null)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#243149] transition-colors cursor-pointer"
                title="Clear Selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Source & Target Badges */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-[#0B1526] p-2.5 rounded-xl border border-[#243149]">
                <span className="text-[10px] text-[#94A3B8] block mb-1">ORIGIN SOURCE</span>
                <div className="font-bold text-white text-xs flex items-center gap-1.5 truncate">
                  <span>{selectedAttack.source.flag}</span>
                  <span className="truncate">{selectedAttack.source.city}, {selectedAttack.source.country}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[#38BDF8]">
                  <span className="truncate">{selectedAttack.source.ip}</span>
                  <button 
                    onClick={(e) => handleCopyIp(selectedAttack.source.ip, e)}
                    className="p-0.5 hover:text-[#C8F904]"
                    title="Copy IP"
                  >
                    {copiedIp === selectedAttack.source.ip ? <Check className="w-3 h-3 text-[#C8F904]" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="bg-[#0B1526] p-2.5 rounded-xl border border-[#243149]">
                <span className="text-[10px] text-[#94A3B8] block mb-1">TARGET GATEWAY</span>
                <div className="font-bold text-white text-xs flex items-center gap-1.5 truncate">
                  <span>{selectedAttack.target.flag}</span>
                  <span className="truncate">{selectedAttack.target.city}</span>
                </div>
                <div className="mt-1 text-[11px] text-[#C8F904] font-semibold truncate">
                  Port {selectedAttack.target.port} ({selectedAttack.protocol})
                </div>
              </div>
            </div>

            {/* Attack Attributes Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-[11px]">
              <div className="p-2 rounded-xl bg-black/40 border border-[#243149]">
                <span className="text-[9px] text-[#94A3B8] block">CATEGORY</span>
                <span 
                  className="font-bold"
                  style={{ color: ATTACK_CATEGORIES.find(c => c.id === selectedAttack.category)?.color }}
                >
                  {selectedAttack.category}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-[#243149]">
                <span className="text-[9px] text-[#94A3B8] block">SEVERITY</span>
                <span className={`font-black ${
                  selectedAttack.severity === 'CRITICAL' ? 'text-rose-400' : selectedAttack.severity === 'HIGH' ? 'text-amber-400' : 'text-sky-400'
                }`}>
                  {selectedAttack.severity}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-[#243149]">
                <span className="text-[9px] text-[#94A3B8] block">DETECTION STATUS</span>
                <span className="text-[#34D399] font-bold">
                  {selectedAttack.status}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-[#243149]">
                <span className="text-[9px] text-[#94A3B8] block">PROTOCOL</span>
                <span className="text-white font-bold">
                  {selectedAttack.protocol} (L4/L7)
                </span>
              </div>
            </div>

            {/* Footer with Timestamp and Action */}
            <div className="flex items-center justify-between text-[10px] text-[#94A3B8] border-t border-[#243149] pt-2.5">
              <span>CAPTURED: {new Date(selectedAttack.timestamp).toLocaleTimeString()}</span>
              <button
                onClick={() => setSelectedAttack(null)}
                className="text-[#38BDF8] hover:text-[#C8F904] font-bold cursor-pointer"
              >
                Clear Route
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 10. BOTTOM STATUS BAR & LIVE TELEMETRY SUMMARY                    */}
      {/* ================================================================= */}
      <div className="relative z-30 px-6 py-2.5 bg-[#07101B]/90 border-t border-[#243149] backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-4 text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
            <span className="text-[11px]">GLOBAL ORCHESTRATION: <strong className="text-white">SYNCHRONIZED</strong></span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[11px]">
            <span>•</span>
            <span>DECEPTION HONEYPOT: <strong className="text-[#38BDF8]">ACTIVE (PORT 22/2222)</strong></span>
            <span>•</span>
            <span>DEFLECTION RATE: <strong className="text-[#C8F904]">99.98%</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-[#94A3B8]">
          <span className="hidden sm:inline">DRAG TO PAN • SCROLL TO ZOOM • CLICK TRAJECTORY TO INSPECT</span>
        </div>
      </div>
    </div>
  );
};
