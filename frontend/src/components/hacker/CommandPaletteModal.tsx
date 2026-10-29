import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Terminal, Activity, Shield, Wrench, Radio, Brain, 
  Sparkles, Award, FileText, ChevronRight, Hash, ArrowUpRight, Flame, Code2
} from 'lucide-react';
import { NAV_ITEMS } from '../layout/Sidebar';
import { useHackerProfile } from '../../context/HackerProfileContext';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
  onOpenHackerCard: () => void;
  onOpenRoulette: () => void;
  onOpenCtfHub: () => void;
  onOpenToolComparison: () => void;
}

interface PaletteAction {
  id: string;
  title: string;
  category: 'Navigation' | 'In-Browser Tools' | 'Interactive Sandbox' | 'Identity & Retention';
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenHackerCard,
  onOpenRoulette,
  onOpenCtfHub,
  onOpenToolComparison
}) => {
  const { profile, checkInToday } = useHackerProfile();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const allActions: PaletteAction[] = [
    // Identity & Daily Actions
    {
      id: 'act-hacker-card',
      title: 'Open Sovereign Hacker Card & Profile',
      category: 'Identity & Retention',
      icon: Award,
      shortcut: 'H',
      action: () => { onClose(); onOpenHackerCard(); }
    },
    {
      id: 'act-daily-checkin',
      title: 'Daily Sentinel Check-In (Claim +50 XP & Streak 🔥)',
      category: 'Identity & Retention',
      icon: Flame,
      shortcut: 'C',
      action: () => { checkInToday(); onClose(); }
    },
    {
      id: 'act-ctf-arena',
      title: 'Launch CTF Micro-Puzzles & Live Flag Validator',
      category: 'Interactive Sandbox',
      icon: Terminal,
      shortcut: 'P',
      action: () => { onClose(); onOpenCtfHub(); }
    },
    {
      id: 'act-ai-terminal-ctf',
      title: 'Launch AI-Driven Linux Terminal CTF Lab (Live Coach, Boss Scenarios & Red Team)',
      category: 'Interactive Sandbox',
      icon: Terminal,
      shortcut: 'T',
      action: () => { onClose(); onNavigateTab('interactive-terminal'); }
    },
    {
      id: 'act-tool-roulette',
      title: 'Spin Tool Roulette & Daily Spotlight Discovery',
      category: 'Interactive Sandbox',
      icon: Sparkles,
      shortcut: 'R',
      action: () => { onClose(); onOpenRoulette(); }
    },
    {
      id: 'act-tool-comparison',
      title: 'Open Head-to-Head Security Tool Comparison Engine',
      category: 'Interactive Sandbox',
      icon: Wrench,
      shortcut: 'V',
      action: () => { onClose(); onOpenToolComparison(); }
    },

    // In-Browser Mini Tools
    {
      id: 'tool-ip-analyzer',
      title: 'Tool: IP Threat & Domain Analyzer',
      category: 'In-Browser Tools',
      icon: Shield,
      action: () => { onClose(); onNavigateTab('tools-hub'); }
    },
    {
      id: 'tool-decoder',
      title: 'Tool: Payload & Hex Decoder + AI Inspector',
      category: 'In-Browser Tools',
      icon: Code2,
      action: () => { onClose(); onNavigateTab('tools-hub'); }
    },
    {
      id: 'tool-subnet',
      title: 'Tool: Subnet & CIDR Architect',
      category: 'In-Browser Tools',
      icon: Activity,
      action: () => { onClose(); onNavigateTab('tools-hub'); }
    },
    {
      id: 'tool-url-scanner',
      title: 'Tool: URL Phishing & Threat Scanner',
      category: 'In-Browser Tools',
      icon: Wrench,
      action: () => { onClose(); onNavigateTab('tools-hub'); }
    },

    // Navigation Tabs
    ...NAV_ITEMS.map((item) => ({
      id: `nav-${item.id}`,
      title: `Navigate to ${item.label}`,
      category: 'Navigation' as const,
      icon: item.icon,
      action: () => { onClose(); onNavigateTab(item.id); }
    }))
  ];

  const filteredActions = allActions.filter(action =>
    action.title.toLowerCase().includes(query.toLowerCase()) ||
    action.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredActions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredActions.length) % Math.max(1, filteredActions.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#0E1A1F] border border-[#6967FB]/50 rounded-2xl shadow-[0_0_60px_rgba(105,103,251,0.3)] overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#6967FB]/25 bg-[#122026] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#C8F904] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a cyber command, tool, CTF puzzle, or navigation target..."
            className="w-full bg-transparent text-sm font-mono text-white placeholder:text-[#9FB0B7]/60 focus:outline-none"
          />
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <kbd className="px-2 py-0.5 text-[10px] font-mono bg-[#0E1A1F] text-[#9FB0B7] border border-[#6967FB]/30 rounded">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredActions.length === 0 ? (
            <div className="py-12 text-center text-[#9FB0B7] font-mono text-xs">
              No matching tools or security commands found for "{query}".
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const Icon = action.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={action.id}
                  onClick={action.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#6967FB]/30 text-white border border-[#C8F904]/50 shadow-[0_0_15px_rgba(105,103,251,0.25)]'
                      : 'text-[#9FB0B7] hover:bg-[#122026] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'text-[#C8F904] bg-[#C8F904]/10' : 'text-[#6967FB] bg-[#0E1A1F]'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white">{action.title}</span>
                      <span className="text-[10px] text-[#9FB0B7] ml-2 font-mono">[{action.category}]</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {action.shortcut && (
                      <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-[#0E1A1F] border border-[#6967FB]/30 rounded text-[#C8F904]">
                        {action.shortcut}
                      </kbd>
                    )}
                    <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-[#C8F904]' : 'text-transparent'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2.5 border-t border-[#6967FB]/20 bg-[#122026]/80 text-[11px] font-mono text-[#9FB0B7] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#C8F904]">{profile.callsign}</span>
            <span>• Lvl {profile.level} ({profile.rank})</span>
          </div>
        </div>

      </div>
    </div>
  );
};
