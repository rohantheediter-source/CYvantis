import React, { useState } from 'react';
import { Settings, X, Plus, Check, ShieldAlert } from 'lucide-react';

interface AlertRuleBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const AlertRuleBuilderModal: React.FC<AlertRuleBuilderModalProps> = ({ isOpen, onClose, onToast }) => {
  const [minThreatScore, setMinThreatScore] = useState(80);
  const [country, setCountry] = useState('ALL');
  const [protocol, setProtocol] = useState('BOTH');
  const [action, setAction] = useState('DASHBOARD_AND_WEBHOOK');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onToast(`Alert rule created: Score > ${minThreatScore} -> ${action}`);
    onClose();
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Alert Rule Builder"
      className="fixed inset-0 z-[170] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans"
      onClick={onClose}
    >
      <div 
        className="bg-[#050b1f] border border-[#00d2ff]/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_0_80px_rgba(0,210,255,0.3)] space-y-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-[#00d2ff]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white font-mono">Custom SOC Alert Rule</h3>
              <p className="text-xs text-slate-400 font-mono">Automated incident trigger condition</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-slate-300 mb-1">
              IF Threat Severity Score &gt; <strong className="text-[#00d2ff]">{minThreatScore}</strong> / 100
            </label>
            <input 
              type="range" 
              min="30" 
              max="99" 
              value={minThreatScore} 
              onChange={e => setMinThreatScore(Number(e.target.value))}
              className="w-full accent-[#00d2ff] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Medium (30)</span>
              <span>High (70)</span>
              <span>Critical (90+)</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">AND Source Origin Country is</label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#030612] border border-slate-800 text-white focus:outline-none focus:border-[#00d2ff]"
            >
              <option value="ALL">Any Country (Global)</option>
              <option value="RU">Russian Federation (RU)</option>
              <option value="CN">China (CN)</option>
              <option value="NL">Netherlands (NL - Known Tor Exits)</option>
              <option value="BG">Bulgaria (BG)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">AND Decoy Protocol is</label>
            <select
              value={protocol}
              onChange={e => setProtocol(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#030612] border border-slate-800 text-white focus:outline-none focus:border-[#00d2ff]"
            >
              <option value="BOTH">Both SSH (22) & Telnet (23)</option>
              <option value="SSH">SSH Cowrie Trap Only</option>
              <option value="TELNET">Telnet Mirai Trap Only</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">THEN Execute Action</label>
            <select
              value={action}
              onChange={e => setAction(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#030612] border border-slate-800 text-white focus:outline-none focus:border-[#00d2ff]"
            >
              <option value="DASHBOARD_AND_WEBHOOK">Flash Dashboard Alert & Send Slack Webhook</option>
              <option value="EMAIL_CISO">Send Priority Email to Security Team</option>
              <option value="AUTO_ISOLATE">Auto-Generate IPTables Firewall Block Rule</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#0072ff] hover:from-[#00c0ee] hover:to-[#005cd6] text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-[#00d2ff]/30 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save & Activate Rule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
