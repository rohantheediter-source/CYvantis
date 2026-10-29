import React, { useState } from 'react';
import { Key, X, Copy, Check, Plus, Trash2, Shield, Terminal } from 'lucide-react';

interface ApiKeyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const ApiKeyManagerModal: React.FC<ApiKeyManagerModalProps> = ({ isOpen, onClose, onToast }) => {
  const [keys, setKeys] = useState([
    {
      id: 'key-1',
      name: 'Splunk Ingestion Collector',
      token: 'cyv_live_9b4e72c819a4d801e09923a1',
      created: '2026-10-01',
      scope: 'telemetry:read'
    },
    {
      id: 'key-2',
      name: 'Sentinel SOAR Webhook Trigger',
      token: 'cyv_live_44f1c9982a30bb17409e12c5',
      created: '2026-10-08',
      scope: 'alerts:write'
    }
  ]);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopiedKey(id);
    onToast('API Key copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateKey = () => {
    const randomHex = Math.random().toString(16).substring(2, 14) + Math.random().toString(16).substring(2, 14);
    const newKey = {
      id: `key-${Date.now()}`,
      name: `External Ingestion Collector #${keys.length + 1}`,
      token: `cyv_live_${randomHex}`,
      created: 'Just now',
      scope: 'telemetry:read'
    };
    setKeys(prev => [newKey, ...prev]);
    onToast('New API key created successfully');
  };

  const handleRevokeKey = (id: string) => {
    setKeys(prev => prev.filter(k => k.id !== id));
    onToast('API Key revoked');
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="API Key Manager"
      className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans"
      onClick={onClose}
    >
      <div 
        className="bg-[#050b1f] border border-[#00d2ff]/40 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-[0_0_80px_rgba(0,210,255,0.3)] space-y-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00d2ff]/10 text-[#00d2ff]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white font-mono">SOC API Key Manager</h3>
              <p className="text-xs text-slate-400 font-mono">External SIEM & Telemetry Ingestion Tokens</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-mono text-xs text-slate-400">Active Access Tokens ({keys.length})</span>
          <button
            onClick={handleCreateKey}
            className="px-3.5 py-1.5 rounded-xl bg-[#00d2ff]/20 text-[#00d2ff] border border-[#00d2ff]/40 font-mono font-bold text-xs flex items-center gap-1.5 hover:bg-[#00d2ff] hover:text-black transition"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Key</span>
          </button>
        </div>

        {/* Keys List */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {keys.map(k => (
            <div key={k.id} className="p-3.5 rounded-2xl bg-[#030612] border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{k.name}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">Active</span>
              </div>
              <div className="flex items-center justify-between bg-[#01030a] px-3 py-2 rounded-xl border border-slate-900 text-cyan-300 text-[11px]">
                <code className="truncate max-w-[280px] sm:max-w-[360px]">{k.token}</code>
                <button
                  onClick={() => handleCopy(k.token, k.id)}
                  className="text-slate-400 hover:text-white p-1"
                  title="Copy token"
                >
                  {copiedKey === k.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>Scope: <strong className="text-slate-300">{k.scope}</strong> · Created: {k.created}</span>
                <button
                  onClick={() => handleRevokeKey(k.id)}
                  className="text-red-400 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Revoke</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Example Integration Snippet */}
        <div className="p-3 rounded-xl bg-[#030718] border border-slate-800 space-y-1 font-mono text-[10px]">
          <span className="text-slate-400 font-bold">Quick Ingest Curl Example:</span>
          <p className="text-slate-500 truncate text-[10px]">
            curl -H "Authorization: Bearer cyv_live_..." https://api.cyvantis.tech/v1/telemetry
          </p>
        </div>
      </div>
    </div>
  );
};
