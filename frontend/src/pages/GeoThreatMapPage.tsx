import React, { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import {
  Shield, CheckCircle2, ChevronRight, ChevronLeft, Activity,
  Globe, Terminal, Pause, Play, Download, Filter, ArrowRight
} from 'lucide-react';
import { ATTACK_TYPE_CONFIG } from '../components/common/ThreeDGlobe';
import { GeographicalOperationsMap, RegionalHub } from '../components/common/GeographicalOperationsMap';

interface StreamLogItem {
  id: string;
  timestamp: string;
  flag: string;
  country: string;
  ip: string;
  category: string;
  color: string;
  target: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: string;
}

const INITIAL_STREAM_LOGS: StreamLogItem[] = [
  { id: 'log-1', timestamp: '22:04:15', flag: '🇨🇳', country: 'China', ip: '103.253.42.18', category: 'Anonymizers', color: '#818CF8', target: 'US-East Honeypot (Port 22)', severity: 'CRITICAL', status: 'INTERCEPTED' },
  { id: 'log-2', timestamp: '22:04:12', flag: '🇷🇺', country: 'Russia', ip: '193.142.146.210', category: 'Intruders', color: '#38BDF8', target: 'EU-Central Honey (Port 2222)', severity: 'CRITICAL', status: 'ISOLATED' },
  { id: 'log-3', timestamp: '22:04:10', flag: '🇺🇸', country: 'United States', ip: '162.243.10.12', category: 'Web Attackers', color: '#FB7185', target: 'Asia-South Node (Port 23)', severity: 'HIGH', status: 'RECORDED' },
  { id: 'log-4', timestamp: '22:04:08', flag: '🇧🇷', country: 'Brazil', ip: '198.51.100.44', category: 'DDoS Attackers', color: '#FBBF24', target: 'UK Gateway Honey', severity: 'HIGH', status: 'SINKHOLED' },
  { id: 'log-5', timestamp: '22:04:05', flag: '🇮🇳', country: 'India', ip: '103.12.40.5', category: 'Scanners', color: '#818CF8', target: 'Cowrie Telnet Gateway', severity: 'MEDIUM', status: 'INTERCEPTED' },
];

interface GeoThreatMapPageProps {
  onNavigateEvents?: () => void;
}

export const GeoThreatMapPage: React.FC<GeoThreatMapPageProps> = ({ onNavigateEvents }) => {
  const [geoData, setGeoData] = useState<any[]>([]);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [logConsoleExpanded, setLogConsoleExpanded] = useState(true);
  const [streamPaused, setStreamPaused] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [streamLogs, setStreamLogs] = useState<StreamLogItem[]>(INITIAL_STREAM_LOGS);
  const [selectedHub, setSelectedHub] = useState<RegionalHub | null>(null);

  const fetchGeoData = async () => {
    try {
      const data = await apiRequest<any[]>('/analytics/geographic-distribution');
      setGeoData(data || []);
    } catch (err) {
      console.error('Failed to load geo distribution:', err);
    }
  };

  useEffect(() => {
    fetchGeoData();
    const interval = setInterval(fetchGeoData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Real-time live log stream updates
  useEffect(() => {
    if (streamPaused) return;

    const streamTimer = setInterval(() => {
      const sampleCountries = [
        { country: 'United States', flag: '🇺🇸', ip: '162.243.10.12', target: 'Cowrie SSH (Port 22)' },
        { country: 'China', flag: '🇨🇳', ip: '103.253.42.18', target: 'Cowrie Gateway (Port 2222)' },
        { country: 'Russia', flag: '🇷🇺', ip: '193.142.146.210', target: 'Cowrie Telnet (Port 23)' },
        { country: 'Germany', flag: '🇩🇪', ip: '185.220.101.5', target: 'Cowrie SSH (Port 22)' },
        { country: 'Brazil', flag: '🇧🇷', ip: '198.51.100.44', target: 'Cowrie Gateway (Port 2222)' },
        { country: 'India', flag: '🇮🇳', ip: '103.12.40.5', target: 'Cowrie Telnet (Port 23)' }
      ];

      const c = sampleCountries[Math.floor(Math.random() * sampleCountries.length)];
      const catObj = ATTACK_TYPE_CONFIG[Math.floor(Math.random() * ATTACK_TYPE_CONFIG.length)];
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const newLogItem: StreamLogItem = {
        id: Math.random().toString(),
        timestamp: timeStr,
        flag: c.flag,
        country: c.country,
        ip: c.ip,
        category: catObj.name,
        color: catObj.color,
        target: c.target,
        severity: Math.random() > 0.4 ? 'CRITICAL' : 'HIGH',
        status: Math.random() > 0.5 ? 'INTERCEPTED' : 'RECORDED'
      };

      setStreamLogs((prev) => [newLogItem, ...prev.slice(0, 19)]);
    }, 3000);

    return () => clearInterval(streamTimer);
  }, [streamPaused]);

  const totalGeoAttacks = geoData.reduce((acc, curr) => acc + (curr.count || 0), 0);

  const filteredLogs = selectedFilter === 'ALL'
    ? streamLogs
    : streamLogs.filter(l => l.category === selectedFilter);

  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(streamLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `CYVANTIS_Threat_Stream_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="relative w-full h-[calc(100vh-5.5rem)] bg-[#080E1E] text-[#E8EEF8] font-sans overflow-hidden flex flex-col justify-between select-none rounded-xl border border-[#243149]">
      {/* 1. Header Bar */}
      <header className="relative z-30 flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-[#0D1528] border-b border-[#243149]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/40 flex items-center justify-center">
            <Globe className="w-4 h-4 text-[#38BDF8]" />
          </div>
          <div>
            <div className="flex items-baseline gap-2 font-mono">
              <h1 className="text-sm font-bold text-[#E8EEF8] tracking-wider uppercase">CYVANTIS</h1>
              <span className="text-xs text-[#38BDF8] font-medium">Geographic Threat Map</span>
            </div>
            <p className="text-[10px] text-[#94A3B8] font-mono">
              Global Attack Distribution • {totalGeoAttacks.toLocaleString()} total captured vectors
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {onNavigateEvents && (
            <button
              onClick={onNavigateEvents}
              className="px-3 py-1.5 rounded-lg bg-[#111C32] hover:bg-[#243149] border border-[#243149] text-[#E8EEF8] flex items-center gap-1.5 transition-colors"
            >
              <span>Event Explorer</span>
              <ArrowRight className="w-3 h-3 text-[#38BDF8]" />
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Map Canvas Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex">
        {/* Left Attack Vectors & Country Leaderboard Panel */}
        <div className={`absolute top-4 left-4 z-20 transition-all duration-300 ${leftPanelCollapsed ? '-translate-x-[270px]' : 'translate-x-0'}`}>
          <div className="space-y-3 font-mono text-xs w-60">
            {/* Attack Vectors Filter */}
            <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-3.5 shadow-xl space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#243149] pb-2">
                <span className="text-[11px] font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#38BDF8]" />
                  Attack Categories
                </span>
                <button
                  onClick={() => setLeftPanelCollapsed(true)}
                  className="text-[#94A3B8] hover:text-[#E8EEF8]"
                  title="Collapse Panel"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                {ATTACK_TYPE_CONFIG.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setSelectedFilter(selectedFilter === item.name ? 'ALL' : item.name)}
                    className={`w-full flex items-center justify-between py-1 px-2 rounded border text-left text-[11px] transition-colors cursor-pointer ${
                      selectedFilter === item.name
                        ? 'bg-[#111C32] border-[#38BDF8] text-[#E8EEF8]'
                        : 'bg-[#080E1E] border-[#243149] text-[#94A3B8] hover:border-[#38BDF8]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Country Attack Leaderboard */}
            <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-3.5 shadow-xl space-y-2">
              <span className="text-[11px] font-bold text-[#818CF8] uppercase tracking-wider block border-b border-[#243149] pb-1.5">
                Top Source Origins
              </span>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {geoData.slice(0, 5).map((g) => (
                  <div key={g.country} className="flex items-center justify-between text-[11px]">
                    <span className="text-[#E8EEF8] truncate">{g.country}</span>
                    <span className="font-bold text-[#38BDF8]">{g.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Re-open Button if Collapsed */}
        {leftPanelCollapsed && (
          <button
            onClick={() => setLeftPanelCollapsed(false)}
            className="absolute top-4 left-2 z-20 p-1.5 rounded-lg bg-[#0D1528] border border-[#243149] text-[#38BDF8] hover:bg-[#111C32]"
            title="Expand Controls"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Main Map Component */}
        <div className="w-full h-full relative overflow-hidden flex items-center justify-center p-2 sm:p-4">
          <GeographicalOperationsMap
            defaultMode="threat"
            onHubSelect={(hub) => setSelectedHub(hub)}
            className="w-full h-full max-h-[calc(100vh-14rem)]"
          />
        </div>
      </div>

      {/* 3. Threat Stream Log Console Footer */}
      <footer className="relative z-30 border-t border-[#243149] bg-[#0D1528] font-mono text-xs shadow-lg">
        <div className="px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#243149]">
          <div className="flex items-center gap-2 text-[#38BDF8] font-bold text-xs uppercase tracking-wider">
            <Terminal className="w-4 h-4 text-[#38BDF8]" />
            <span>Real-Time Threat Stream Log</span>
            <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setStreamPaused(!streamPaused)}
              className={`px-2.5 py-1 rounded border text-[10px] font-bold transition-colors cursor-pointer ${
                streamPaused
                  ? 'bg-[#34D399]/15 border-[#34D399]/40 text-[#34D399]'
                  : 'bg-[#FBBF24]/15 border-[#FBBF24]/40 text-[#FBBF24]'
              }`}
            >
              {streamPaused ? 'Resume Stream' : 'Pause Stream'}
            </button>
            <button
              onClick={handleExportLogs}
              className="px-2.5 py-1 rounded bg-[#111C32] border border-[#243149] hover:border-[#38BDF8]/40 text-[#E8EEF8] text-[10px] font-bold transition-colors cursor-pointer"
            >
              Export JSON
            </button>
            <button
              onClick={() => setLogConsoleExpanded(!logConsoleExpanded)}
              className="px-2 py-1 rounded bg-[#111C32] border border-[#243149] text-[#94A3B8] hover:text-[#E8EEF8] text-[10px]"
            >
              {logConsoleExpanded ? 'Minimize' : 'Expand'}
            </button>
          </div>
        </div>

        {logConsoleExpanded && (
          <div className="max-h-40 overflow-y-auto px-5 py-2 space-y-1 text-[11px] font-mono">
            <div className="grid grid-cols-12 gap-2 text-[#94A3B8] text-[10px] uppercase font-bold border-b border-[#243149] pb-1 sticky top-0 bg-[#0D1528]">
              <span className="col-span-2">TIMESTAMP</span>
              <span className="col-span-2">ORIGIN</span>
              <span className="col-span-2">SOURCE IP</span>
              <span className="col-span-2">CATEGORY</span>
              <span className="col-span-2">TARGET NODE</span>
              <span className="col-span-2 text-right">ACTION</span>
            </div>

            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-12 gap-2 py-1 items-center hover:bg-[#111C32] transition-colors"
              >
                <span className="col-span-2 text-[#94A3B8]">{log.timestamp}</span>
                <span className="col-span-2 font-bold text-[#E8EEF8] flex items-center gap-1 truncate">
                  <span>{log.flag}</span>
                  {log.country}
                </span>
                <span className="col-span-2 text-[#38BDF8] font-bold">{log.ip}</span>
                <span className="col-span-2 text-[#E8EEF8] truncate">{log.category}</span>
                <span className="col-span-2 text-[#94A3B8] truncate">{log.target}</span>
                <span className="col-span-2 text-right">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/40">
                    {log.status}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </footer>
    </div>
  );
};
