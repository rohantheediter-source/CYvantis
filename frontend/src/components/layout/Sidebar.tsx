import React, { useState } from 'react';
import {
  LayoutDashboard, Activity, Search, BarChart3, ShieldAlert, Globe,
  Briefcase, Zap, Database, FileText, Server, HardDrive, Cpu,
  FileCode2, Users, Settings, ChevronRight, ChevronLeft, ChevronDown,
  Lock, Terminal, Wrench, Radio, Brain, ShieldCheck, Sparkles, LogOut, User as UserIcon
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  userRole?: string;
  userName?: string;
  onLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export interface NavItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  group: 'Command' | 'Intelligence' | 'Response' | 'Platform' | 'Advanced Operations';
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  // Command
  { id: 'overview', label: '1. Overview', shortLabel: 'Overview', icon: LayoutDashboard, group: 'Command' },
  { id: 'live-monitoring', label: '2. Live Monitoring', shortLabel: 'Live Monitoring', icon: Activity, group: 'Command' },
  { id: 'events', label: '3. Event Explorer', shortLabel: 'Event Explorer', icon: Search, group: 'Command' },

  // Intelligence
  { id: 'attack-analysis', label: '4. Attack Analysis', shortLabel: 'Attack Analysis', icon: BarChart3, group: 'Intelligence' },
  { id: 'source-intelligence', label: '5. Source Intelligence', shortLabel: 'Source Intel', icon: ShieldAlert, group: 'Intelligence' },
  { id: 'geo-map', label: '6. Geographic Threat Map', shortLabel: 'Threat Map', icon: Globe, group: 'Intelligence' },
  { id: 'threat-intel', label: '7. Threat Intelligence', shortLabel: 'Threat Intel', icon: Database, group: 'Intelligence' },

  // Response
  { id: 'investigations', label: '8. Investigations', shortLabel: 'Investigations', icon: Briefcase, group: 'Response' },
  { id: 'detection-rules', label: '9. Detection Rules', shortLabel: 'Detection Rules', icon: Zap, group: 'Response' },
  { id: 'reports', label: '10. Reports', shortLabel: 'Reports', icon: FileText, group: 'Response' },

  // Platform
  { id: 'admin-data', label: '11. Admin Data Management', shortLabel: 'Admin Data', icon: Server, group: 'Platform', adminOnly: true },
  { id: 'storage', label: '12. Storage & Backups', shortLabel: 'Storage & Backup', icon: HardDrive, group: 'Platform' },
  { id: 'health', label: '13. Infrastructure Health', shortLabel: 'System Health', icon: Cpu, group: 'Platform' },
  { id: 'audit-logs', label: '14. Audit Logs', shortLabel: 'Audit Logs', icon: FileCode2, group: 'Platform' },
  { id: 'users', label: '15. User Management', shortLabel: 'Users', icon: Users, group: 'Platform', adminOnly: true },
  { id: 'settings', label: '16. Settings', shortLabel: 'Settings', icon: Settings, group: 'Platform', adminOnly: true },

  // Advanced Operations
  { id: 'tools-hub', label: 'Tools Hub', shortLabel: 'Tools Hub', icon: Wrench, group: 'Advanced Operations' },
  { id: 'cve-radar', label: 'CVE Radar', shortLabel: 'CVE Radar', icon: Radio, group: 'Advanced Operations' },
  { id: 'ml-intelligence', label: 'ML Intelligence', shortLabel: 'ML Intel', icon: Brain, group: 'Advanced Operations' },
  { id: 'defensive-suite', label: 'Autonomous Defense', shortLabel: 'Auto Defense', icon: ShieldCheck, group: 'Advanced Operations' },
  { id: 'elite-ops', label: 'Elite Security Ops', shortLabel: 'Elite Ops', icon: Sparkles, group: 'Advanced Operations' },
  { id: 'interactive-terminal', label: 'AI CTF Terminal', shortLabel: 'CTF Terminal', icon: Terminal, group: 'Advanced Operations' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  userRole = 'analyst',
  userName = 'analyst',
  onLogout,
  isCollapsed: externalIsCollapsed,
  onToggleCollapse: externalOnToggleCollapse
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalCollapsed;
  const toggleCollapse = externalOnToggleCollapse || (() => setInternalCollapsed(prev => !prev));

  const primaryGroups: Array<'Command' | 'Intelligence' | 'Response' | 'Platform'> = [
    'Command',
    'Intelligence',
    'Response',
    'Platform'
  ];

  const advancedItems = NAV_ITEMS.filter(item => item.group === 'Advanced Operations');

  return (
    <aside
      className={`${isCollapsed ? 'w-20' : 'w-64'
        } bg-[#0D1528] border-r border-[#243149] flex flex-col h-screen sticky top-0 select-none z-30 transition-all duration-300 shrink-0`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-[#243149] flex items-center justify-between bg-[#080E1E]/80 backdrop-blur-md">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Custom CYVANTIS Geometric Shield Logo */}
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#111C32] to-[#0D1528] p-1 border border-[#38BDF8]/40 shadow-[0_0_12px_rgba(56,189,248,0.2)] shrink-0 flex items-center justify-center relative group">
            <div className="absolute inset-0 bg-[#38BDF8]/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <svg className="w-5 h-5 text-[#38BDF8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>

          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="font-extrabold tracking-wider text-sm text-[#E8EEF8] font-mono flex items-center gap-1.5 truncate">
                CYVANTIS
              </h1>
              <p className="text-[10px] text-[#38BDF8] font-mono tracking-wider uppercase font-semibold truncate">
                GATEWAY NEXUS
              </p>
            </div>
          )}
        </div>

        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={toggleCollapse}
          className="p-1 rounded text-[#94A3B8] hover:text-[#E8EEF8] hover:bg-[#111C32] transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Modules List */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {primaryGroups.map((group) => {
          const items = NAV_ITEMS.filter((item) => item.group === group);

          return (
            <div key={group} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5 font-mono flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#38BDF8]" />
                  {group}
                </div>
              )}

              {items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const isLockedForRole = item.adminOnly && userRole !== 'admin';

                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                      } rounded-lg text-xs font-medium transition-all duration-150 group cursor-pointer ${isActive
                        ? 'bg-[#111C32] text-[#E8EEF8] border border-[#38BDF8]/40 shadow-sm'
                        : isLockedForRole
                          ? 'text-[#94A3B8]/60 hover:text-[#E8EEF8] hover:bg-[#111C32]/40'
                          : 'text-[#94A3B8] hover:text-[#E8EEF8] hover:bg-[#111C32]'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${isActive
                            ? 'text-[#38BDF8]'
                            : isLockedForRole
                              ? 'text-[#FB7185]/70'
                              : 'text-[#94A3B8] group-hover:text-[#E8EEF8]'
                          }`}
                      />
                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>

                    {!isCollapsed && (
                      isLockedForRole ? (
                        <span className="flex items-center gap-0.5 text-[8px] font-mono px-1 py-0.5 rounded bg-[#FB7185]/10 border border-[#FB7185]/30 text-[#FB7185] font-semibold shrink-0">
                          <Lock className="w-2.5 h-2.5" />
                          ADMIN
                        </span>
                      ) : isActive ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                      ) : null
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}

        {/* Collapsible Advanced Capabilities Group */}
        <div className="pt-2 border-t border-[#243149]/60">
          {!isCollapsed && (
            <button
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] hover:text-[#E8EEF8] font-mono transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[#818CF8]" />
                Advanced Ops
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
            </button>
          )}

          {(!isCollapsed ? advancedOpen : true) && (
            <div className="space-y-1 mt-1">
              {advancedItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-1.5'
                      } rounded-lg text-xs font-medium transition-all duration-150 group cursor-pointer ${isActive
                        ? 'bg-[#111C32] text-[#E8EEF8] border border-[#818CF8]/40'
                        : 'text-[#94A3B8] hover:text-[#E8EEF8] hover:bg-[#111C32]'
                      }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#818CF8]' : 'text-[#94A3B8] group-hover:text-[#E8EEF8]'
                        } ${!isCollapsed ? 'mr-2.5' : ''}`}
                    />
                    {!isCollapsed && <span className="truncate">{item.shortLabel || item.label}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* User Profile & Account Footer */}
      <div className="p-3 border-t border-[#243149] bg-[#080E1E]/90 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded bg-[#111C32] border border-[#243149] flex items-center justify-center text-[#38BDF8] shrink-0 font-mono text-xs font-bold">
            {userName ? userName.charAt(0).toUpperCase() : 'A'}
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-xs font-mono font-medium text-[#E8EEF8] truncate">{userName}</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#38BDF8] font-bold">
                  {userRole}
                </span>
              </div>
            </div>
          )}
        </div>

        {onLogout && !isCollapsed && (
          <button
            onClick={onLogout}
            title="Sign out of CYVANTIS SOC"
            className="p-1.5 rounded text-[#94A3B8] hover:text-[#FB7185] hover:bg-[#111C32] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Persistent Tagline */}
      {!isCollapsed && (
        <div className="px-3 py-1.5 bg-[#080E1E] text-[9px] text-[#94A3B8] text-center font-mono border-t border-[#243149]/50">
          <span className="text-[#38BDF8]">Deceive.</span> <span className="text-[#E8EEF8]">Detect.</span>{' '}
          <span className="text-[#818CF8]">Investigate.</span> <span className="text-[#34D399]">Defend.</span>
        </div>
      )}
    </aside>
  );
};
