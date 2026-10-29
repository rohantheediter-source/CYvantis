import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { SystemHealth } from '../types';
import {
  Cpu, Server, Activity, ShieldCheck, CheckCircle, Radio,
  RefreshCw, Database, Terminal, Shield, AlertTriangle
} from 'lucide-react';

export const InfrastructureHealth: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealth = async () => {
    setIsRefreshing(true);
    try {
      const data = await apiRequest<SystemHealth>('/health');
      setHealth(data);
    } catch (err) {
      console.error('Failed to load health status:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans">
      {/* 1. Header */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <h2 className="text-lg font-bold text-[#E8EEF8] font-mono tracking-tight flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#38BDF8]" />
              System Observability & Infrastructure Telemetry
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Continuous health telemetry for Cowrie honeypot containers, SQLite database engine, API gateway latency, and WebSockets
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={isRefreshing}
          className="px-3.5 py-1.5 rounded-lg bg-[#111C32] hover:bg-[#243149] border border-[#243149] text-[#E8EEF8] flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#38BDF8] ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Sync Diagnostics</span>
        </button>
      </div>

      {/* 2. Main Metrics Grid */}
      {loading && !health ? (
        <div className="text-center py-12 text-[#94A3B8] font-mono text-xs">
          Querying infrastructure components...
        </div>
      ) : health && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
            <div className="bg-[#0D1528] border border-[#243149] p-4 rounded-xl space-y-1">
              <span className="text-[#94A3B8] uppercase text-[10px]">Gateway Status</span>
              <div className="text-lg font-bold text-[#34D399] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
                {health.status}
              </div>
              <div className="text-[#94A3B8] text-[11px]">
                Uptime: {Math.floor(health.uptime_seconds / 60)} mins ({health.uptime_seconds}s)
              </div>
            </div>

            <div className="bg-[#0D1528] border border-[#243149] p-4 rounded-xl space-y-1">
              <span className="text-[#94A3B8] uppercase text-[10px]">Python Runtime</span>
              <div className="text-lg font-bold text-[#38BDF8]">Python {health.python_version}</div>
              <div className="text-[#94A3B8] text-[11px]">CYVANTIS Core {health.backend_version}</div>
            </div>

            <div className="bg-[#0D1528] border border-[#243149] p-4 rounded-xl space-y-1">
              <span className="text-[#94A3B8] uppercase text-[10px]">Database Engine</span>
              <div className="text-lg font-bold text-[#818CF8]">{health.database.type}</div>
              <div className="text-[#94A3B8] text-[11px]">
                {health.database.file} ({health.database.size_mb} MB)
              </div>
            </div>

            <div className="bg-[#0D1528] border border-[#243149] p-4 rounded-xl space-y-1">
              <span className="text-[#94A3B8] uppercase text-[10px]">Active WebSockets</span>
              <div className="text-lg font-bold text-[#34D399] flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#34D399] animate-pulse" />
                {health.websockets.active_connections} Connected
              </div>
              <div className="text-[#94A3B8] text-[11px] truncate">{health.websockets.channel}</div>
            </div>
          </div>

          {/* 3. Cowrie Honeypot Container Deployment Status */}
          <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#243149] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
                <h3 className="font-bold text-[#E8EEF8] uppercase tracking-wider">
                  Cowrie Honeypot Sensor Container Status
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/40">
                {health.honeypot_container.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-[#111C32] rounded-lg border border-[#243149]">
                <span className="text-[#94A3B8] text-[10px] uppercase block">Container Deployment</span>
                <span className="font-bold text-[#E8EEF8] text-xs mt-0.5 block">
                  {health.honeypot_container.name}
                </span>
              </div>
              <div className="p-3 bg-[#111C32] rounded-lg border border-[#243149]">
                <span className="text-[#94A3B8] text-[10px] uppercase block">Emulated Gateway Ports</span>
                <span className="font-bold text-[#38BDF8] text-xs mt-0.5 block">
                  SSH (2222) • Telnet (2223)
                </span>
              </div>
              <div className="p-3 bg-[#111C32] rounded-lg border border-[#243149]">
                <span className="text-[#94A3B8] text-[10px] uppercase block">Background Simulator</span>
                <span className="font-bold text-[#34D399] text-xs mt-0.5 block">
                  {health.honeypot_container.simulation_mode ? 'ACTIVE (Live Telemetry Generation)' : 'STANDBY'}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Internal Microservices Latency Matrix */}
          <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm space-y-4 font-mono text-xs">
            <div className="flex items-center gap-2 border-b border-[#243149] pb-3">
              <Server className="w-4 h-4 text-[#818CF8]" />
              <h3 className="font-bold text-[#E8EEF8] uppercase tracking-wider">
                Internal Service Components & Latency Matrix
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {health.services.map((svc) => (
                <div
                  key={svc.name}
                  className="p-3.5 bg-[#111C32] rounded-lg border border-[#243149] flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[#E8EEF8]">{svc.name}</div>
                    <div className="text-[#94A3B8] text-[11px] mt-0.5">Response Latency: {svc.latency_ms}ms</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/40">
                    {svc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
