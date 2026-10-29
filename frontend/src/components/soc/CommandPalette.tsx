import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Terminal, Shield, Download, Play, Pause, Sun, Moon, 
  HelpCircle, Key, ArrowRight, ExternalLink, Zap, Layers, Activity, FileText
} from 'lucide-react';

export interface CommandItem {
  id: string;
  category: 'Actions' | 'Navigation' | 'Events' | 'Settings' | 'Intelligence';
  title: string;
  subtitle?: string;
  shortcut?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
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

  const filteredCommands = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].onSelect();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#050b1f] border border-[#00d2ff]/40 rounded-2xl w-full max-w-2xl shadow-[0_0_80px_rgba(0,210,255,0.3)] overflow-hidden font-sans text-xs animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-[#030714]">
          <Search className="w-4 h-4 text-[#00d2ff]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, action, or search IP / protocol... (Ctrl+K)"
            className="w-full bg-transparent text-white font-mono placeholder:text-slate-500 focus:outline-none text-sm"
          />
          <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-slate-500 font-mono text-xs">
              No matching commands or actions found for "{query}"
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.onSelect();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-gradient-to-r from-[#00d2ff]/20 to-[#0072ff]/20 border border-[#00d2ff]/50 text-white shadow-md' 
                      : 'text-slate-300 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#00d2ff] text-black font-bold' : 'bg-slate-900 text-[#00d2ff]'}`}>
                      {cmd.icon}
                    </div>
                    <div>
                      <div className="font-bold font-mono text-sm flex items-center gap-2">
                        <span>{cmd.title}</span>
                        <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 uppercase font-semibold">
                          {cmd.category}
                        </span>
                      </div>
                      {cmd.subtitle && (
                        <p className="text-[11px] text-slate-400 font-sans mt-0.5">{cmd.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {cmd.shortcut && (
                      <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[10px] text-slate-400">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-0.5 text-[#00d2ff]' : 'text-slate-600'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2.5 bg-[#020510] border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800">Enter</kbd> Select</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800">Esc</kbd> Close</span>
          </div>
          <span className="text-[#00d2ff]">CYVANTIS Power Mode</span>
        </div>
      </div>
    </div>
  );
};
