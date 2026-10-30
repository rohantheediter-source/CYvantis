import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { LogOut, WifiOff, Radio, Search, ShieldAlert, ChevronRight, User as UserIcon, Bell } from 'lucide-react';

interface NavbarProps {
  currentTabLabel: string;
  currentGroup?: string;
  onOpenCommandPalette?: () => void;
  alertCount?: number;
  onNavigateAlerts?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTabLabel,
  currentGroup = 'Command',
  onOpenCommandPalette,
  alertCount = 0,
  onNavigateAlerts
}) => {
  const { user, logout } = useAuth();
  const { isConnected } = useWebSocket();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="sticky top-0 z-20 px-4 sm:px-6 py-2 bg-[#080E1E]/95 backdrop-blur-xl border-b border-[#243149] shadow-[0_4px_20px_rgba(0,0,0,0.5)] relative">
      {/* Specular Top Edge Light */}
      <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-[#38BDF8]/25 to-transparent pointer-events-none" />
      <header className="flex items-center justify-between h-11 max-w-[1600px] mx-auto">
        {/* Left Section: Breadcrumbs & Page Context */}
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-[#94A3B8]">{currentGroup}</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]/60" />
            <span className="text-[#E8EEF8] font-semibold">{currentTabLabel}</span>
          </nav>

          {/* Genuine WebSocket Stream Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 bg-[#0D1528] px-2.5 py-1 rounded-md border border-[#243149] text-xs">
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse shrink-0" />
                <Radio className="w-3.5 h-3.5 text-[#34D399]" />
                <span className="text-[#34D399] font-mono font-medium text-[10px] tracking-wider">
                  TELEMETRY LIVE
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#FB7185] shrink-0" />
                <WifiOff className="w-3.5 h-3.5 text-[#FB7185]" />
                <span className="text-[#FB7185] font-mono font-medium text-[10px] tracking-wider">
                  STREAM DISCONNECTED
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right Section: Command Palette, Alert Counter, User Menu */}
        <div className="flex items-center gap-3">
          {/* Global Search / Command Palette Entry Point */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              title="Global Search & Navigation (Ctrl + K)"
              className="flex items-center gap-2 bg-[#0D1528] hover:bg-[#111C32] text-[#94A3B8] hover:text-[#E8EEF8] px-3 py-1.5 rounded-lg border border-[#243149] hover:border-[#38BDF8]/40 transition-all font-mono text-xs cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="hidden md:inline text-[11px]">Search & Commands</span>
              <kbd className="hidden sm:inline-block text-[9px] bg-[#111C32] px-1.5 py-0.5 rounded border border-[#243149] text-[#38BDF8] font-semibold">
                Ctrl K
              </kbd>
            </button>
          )}

          {/* Alert Queue Access */}
          {onNavigateAlerts && (
            <button
              onClick={onNavigateAlerts}
              title="View Active Detection Alerts"
              className="relative p-1.5 rounded-lg bg-[#0D1528] hover:bg-[#111C32] border border-[#243149] hover:border-[#FB7185]/40 text-[#94A3B8] hover:text-[#E8EEF8] transition-colors"
            >
              <Bell className="w-4 h-4 text-[#FB7185]" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FB7185] text-white text-[9px] font-mono font-bold flex items-center justify-center">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </button>
          )}

          {/* User Profile Popover */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0D1528] hover:bg-[#111C32] border border-[#243149] text-xs font-mono text-[#E8EEF8] transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-[#34D399]" />
              <span className="font-semibold">{user?.username || 'Analyst'}</span>
              <span className="text-[10px] text-[#38BDF8] uppercase">[{user?.role || 'analyst'}]</span>
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-[#0D1528] border border-[#243149] rounded-xl shadow-xl py-2 z-50 text-xs font-mono"
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-[#243149] text-[11px] text-[#94A3B8]">
                  Signed in as <span className="text-[#E8EEF8] font-bold">{user?.username}</span>
                  <div className="text-[10px] text-[#38BDF8] mt-0.5">Role: {user?.role?.toUpperCase()}</div>
                </div>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-[#FB7185] hover:bg-[#111C32] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};
