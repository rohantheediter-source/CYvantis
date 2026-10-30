import React from 'react';
import { Server, Radio, Database, Shield, RefreshCw } from 'lucide-react';

interface OperationalStatusStripProps {
  apiStatus?: string;
  cowrieStatus?: string;
  wsConnected: boolean;
  dbStatus?: string;
  lastUpdate?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const OperationalStatusStrip: React.FC<OperationalStatusStripProps> = ({
  apiStatus = 'OPERATIONAL',
  cowrieStatus = 'Running (Active)',
  wsConnected,
  dbStatus = 'Connected',
  lastUpdate,
  onRefresh,
  isRefreshing = false
}) => {
  return (
    <div className="bg-[#0D1528] border border-[#243149] rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-4 shadow-sm relative overflow-hidden">
      {/* Specular Top Edge Light */}
      <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-[#34D399]/25 to-transparent pointer-events-none" />
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-mono">
        {/* API Gateway */}
        <div className="flex items-center gap-2">
          <Server className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="text-[#94A3B8]">API GATEWAY:</span>
          <span className="flex items-center gap-1.5 font-semibold text-[#34D399]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
            {apiStatus}
          </span>
        </div>

        {/* Cowrie Honeypot */}
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-[#818CF8]" />
          <span className="text-[#94A3B8]">HONEYPOT GATEWAY:</span>
          <span className="flex items-center gap-1.5 font-semibold text-[#38BDF8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
            {cowrieStatus}
          </span>
        </div>

        {/* WebSocket Stream */}
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="text-[#94A3B8]">TELEMETRY STREAM:</span>
          {wsConnected ? (
            <span className="flex items-center gap-1.5 font-semibold text-[#34D399]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-ping" />
              LIVE
            </span>
          ) : (
            <span className="flex items-center gap-1.5 font-semibold text-[#FBBF24]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]" />
              CONNECTING
            </span>
          )}
        </div>

        {/* Database */}
        <div className="hidden lg:flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span className="text-[#94A3B8]">SQLITE3 DB:</span>
          <span className="font-semibold text-[#E8EEF8]">{dbStatus}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs font-mono ml-auto">
        {lastUpdate && (
          <span className="text-[#94A3B8] text-[11px] hidden sm:inline">
            SYNCED: <span className="text-[#E8EEF8]">{new Date(lastUpdate).toLocaleTimeString()}</span>
          </span>
        )}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111C32] hover:bg-[#243149] border border-[#243149] hover:border-[#38BDF8]/40 text-[#E8EEF8] transition-all cursor-pointer text-xs"
            title="Refresh operational telemetry"
          >
            <RefreshCw className={`w-3 h-3 text-[#38BDF8] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-[11px]">Sync</span>
          </button>
        )}
      </div>
    </div>
  );
};
