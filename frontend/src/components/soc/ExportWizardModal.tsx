import React, { useState } from 'react';
import { Download, X, FileText, Check, FileCode, CheckSquare, Square } from 'lucide-react';
import { LogEventData } from './SplitViewInspector';

interface ExportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: LogEventData[];
  onToast: (msg: string) => void;
}

export const ExportWizardModal: React.FC<ExportWizardModalProps> = ({ isOpen, onClose, events, onToast }) => {
  const [format, setFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [scope, setScope] = useState<'current' | '24h' | 'all'>('current');
  
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({
    id: true,
    timestamp: true,
    protocol: true,
    ip: true,
    country: true,
    city: true,
    asn: true,
    cmd: true,
    severity: true,
    threatScore: true,
    credentials: true,
    payloadHash: true
  });

  if (!isOpen) return null;

  const toggleField = (field: string) => {
    setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleExport = () => {
    const exportData = events.map(e => {
      const row: any = {};
      if (selectedFields.id) row.id = e.id;
      if (selectedFields.timestamp) row.timestamp = new Date().toISOString();
      if (selectedFields.protocol) row.protocol = e.protocol;
      if (selectedFields.ip) row.ip = e.ip;
      if (selectedFields.country) row.country = e.country;
      if (selectedFields.city) row.city = e.city;
      if (selectedFields.asn) row.asn = e.asn;
      if (selectedFields.cmd) row.command = e.cmd;
      if (selectedFields.severity) row.severity = e.severity;
      if (selectedFields.threatScore) row.threat_score = e.threatScore;
      if (selectedFields.credentials) row.credentials = e.credentials;
      if (selectedFields.payloadHash) row.payload_sha256 = e.payloadHash;
      return row;
    });

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CYVANTIS_Telemetry_Export_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const activeKeys = Object.keys(exportData[0] || {});
      const headerLine = activeKeys.join(',');
      const rows = exportData.map(r => 
        activeKeys.map(k => `"${String(r[k] || '').replace(/"/g, '""')}"`).join(',')
      );
      const csv = [headerLine, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CYVANTIS_Telemetry_Export_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // PDF text summary
      const text = `===========================================================
CYVANTIS EXECUTIVE THREAT TELEMETRY REPORT
Generated: ${new Date().toUTCString()}
Total Events Exported: ${exportData.length}
Scope: ${scope.toUpperCase()}
===========================================================
${exportData.map(e => `[${e.protocol}] IP: ${e.ip} (${e.country}) | Score: ${e.threat_score}/100 | CMD: ${e.command}`).join('\n')}
===========================================================`;
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CYVANTIS_Threat_Report_${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }

    onToast(`Export completed (${format.toUpperCase()})`);
    onClose();
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Export Wizard"
      className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans"
      onClick={onClose}
    >
      <div 
        className="bg-[#050b1f] border border-[#00d2ff]/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_0_80px_rgba(0,210,255,0.3)] space-y-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00d2ff]/10 text-[#00d2ff]">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white font-mono">SOC Data Export Wizard</h3>
              <p className="text-xs text-slate-400 font-mono">Custom format & column selection</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selection */}
        <div className="space-y-2 font-mono text-xs">
          <label className="text-slate-300 font-bold block">1. Select Export Format</label>
          <div className="grid grid-cols-3 gap-3">
            {(['csv', 'json', 'pdf'] as const).map(fmt => (
              <button
                key={fmt}
                type="button"
                onClick={() => setFormat(fmt)}
                className={`py-2.5 px-3 rounded-xl border text-center uppercase font-bold text-xs transition ${
                  format === fmt ? 'bg-[#00d2ff] text-black border-[#00d2ff]' : 'bg-[#030612] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {fmt === 'pdf' ? 'Executive PDF' : fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Scope Selection */}
        <div className="space-y-2 font-mono text-xs">
          <label className="text-slate-300 font-bold block">2. Telemetry Scope</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'current', label: 'Current View' },
              { id: '24h', label: 'Last 24 Hours' },
              { id: 'all', label: 'Full Archive' }
            ].map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setScope(s.id as any)}
                className={`py-2 px-2 rounded-xl border text-center text-[11px] transition ${
                  scope === s.id ? 'bg-[#00d2ff]/20 text-[#00d2ff] border-[#00d2ff]/50 font-bold' : 'bg-[#030612] border-slate-800 text-slate-400'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Field Selection */}
        <div className="space-y-2 font-mono text-xs">
          <label className="text-slate-300 font-bold block">3. Included Fields ({Object.values(selectedFields).filter(Boolean).length} selected)</label>
          <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-3 rounded-xl bg-[#020512] border border-slate-800">
            {Object.keys(selectedFields).map(f => (
              <div 
                key={f}
                onClick={() => toggleField(f)}
                className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300 hover:text-white"
              >
                {selectedFields[f] ? (
                  <CheckSquare className="w-3.5 h-3.5 text-[#00d2ff]" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-600" />
                )}
                <span className="capitalize">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleExport}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#0072ff] hover:from-[#00c0ee] hover:to-[#005cd6] text-white font-mono font-bold text-xs tracking-wider uppercase transition shadow-lg shadow-[#00d2ff]/30 flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Generate & Download File</span>
        </button>
      </div>
    </div>
  );
};
