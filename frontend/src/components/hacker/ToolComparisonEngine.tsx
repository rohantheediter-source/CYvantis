import React, { useState, useEffect } from 'react';
import { 
  X, Wrench, Zap, Shield, Copy, Check, ExternalLink, ArrowRight, 
  Layers, CheckCircle2, AlertTriangle, Terminal, Scale
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { ToolComparison } from '../../types/hacker';

interface ToolComparisonEngineProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool?: (toolId: string) => void;
}

export const ToolComparisonEngine: React.FC<ToolComparisonEngineProps> = ({
  isOpen,
  onClose,
  onSelectTool
}) => {
  const [comparisons, setComparisons] = useState<ToolComparison[]>([]);
  const [selectedId, setSelectedId] = useState<string>('nmap-vs-rustscan');
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchComparisons = async () => {
      try {
        const res = await apiRequest<{ comparisons: ToolComparison[] }>('/tools/comparison-data');
        if (res && res.comparisons) {
          setComparisons(res.comparisons);
          if (res.comparisons.length > 0) {
            setSelectedId(res.comparisons[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load comparison data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchComparisons();
  }, [isOpen]);

  if (!isOpen) return null;

  const currentComp = comparisons.find(c => c.id === selectedId) || comparisons[0];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0E1A1F] border border-[#6967FB]/40 rounded-2xl shadow-[0_0_60px_rgba(105,103,251,0.25)] overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-[#6967FB]/25 bg-[#122026] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#C8F904]/10 border border-[#C8F904]/40 flex items-center justify-center text-[#C8F904]">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                HEAD-TO-HEAD TOOL COMPARISON ENGINE
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6967FB]/20 border border-[#6967FB]/40 text-[#C8F904]">
                  PHASE 2 INTERACTIVE
                </span>
              </h2>
              <p className="text-xs text-[#9FB0B7]">
                Side-by-side battle matrix: speed, stealth, syntax differences, and operational sweet spots.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9FB0B7] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Selector Tabs */}
        <div className="flex border-b border-[#6967FB]/20 bg-[#0E1A1F] overflow-x-auto p-2 gap-2">
          {comparisons.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all border ${
                selectedId === c.id
                  ? 'bg-[#6967FB]/30 text-white border-[#C8F904] shadow-[0_0_12px_rgba(200,249,4,0.2)]'
                  : 'bg-[#122026] text-[#9FB0B7] border-transparent hover:text-white'
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading || !currentComp ? (
            <div className="py-20 text-center font-mono text-xs text-[#C8F904]">
              Loading cybersecurity battle matrix...
            </div>
          ) : (
            <>
              {/* Category & Title */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#C8F904]">
                    {currentComp.category}
                  </span>
                  <h3 className="text-lg font-bold text-white font-mono mt-0.5">
                    {currentComp.toolA.name} <span className="text-[#6967FB]">VS</span> {currentComp.toolB.name}
                  </h3>
                </div>
              </div>

              {/* Side-by-Side Dual Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* TOOL A */}
                <div className="rounded-2xl bg-[#122026]/90 border border-[#6967FB]/30 p-5 space-y-4 relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white font-mono">{currentComp.toolA.name}</h4>
                      <p className="text-xs text-[#C8F904] font-mono">{currentComp.toolA.archetype}</p>
                      <p className="text-[10px] text-[#9FB0B7]">Vendor: {currentComp.toolA.vendor}</p>
                    </div>
                  </div>

                  {/* Ratings */}
                  <div className="space-y-2 py-1">
                    <div>
                      <div className="flex justify-between text-[11px] font-mono mb-1">
                        <span className="text-[#9FB0B7]">Raw Scan Speed</span>
                        <span className="text-white font-bold">{currentComp.toolA.speedRating}/100</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#0E1A1F] rounded-full overflow-hidden">
                        <div className="h-full bg-[#6967FB]" style={{ width: `${currentComp.toolA.speedRating}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-mono mb-1">
                        <span className="text-[#9FB0B7]">Stealth & IDS Evasion</span>
                        <span className="text-white font-bold">{currentComp.toolA.stealthRating}/100</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#0E1A1F] rounded-full overflow-hidden">
                        <div className="h-full bg-[#C8F904]" style={{ width: `${currentComp.toolA.stealthRating}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-mono mb-1">
                        <span className="text-[#9FB0B7]">Scripting & Extensibility</span>
                        <span className="text-white font-bold">{currentComp.toolA.scriptingPower}/100</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#0E1A1F] rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400" style={{ width: `${currentComp.toolA.scriptingPower}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* CLI Syntax */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#9FB0B7]">
                      <span>CLI Command Template</span>
                      <button
                        onClick={() => handleCopy(currentComp.toolA.cliSyntax, 'toolA_cli')}
                        className="text-[#C8F904] hover:underline flex items-center gap-1 text-[10px]"
                      >
                        {copiedKey === 'toolA_cli' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'toolA_cli' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-2.5 rounded-lg bg-[#0E1A1F] border border-black/40 text-xs font-mono text-[#C8F904] overflow-x-auto whitespace-pre-wrap">
                      {currentComp.toolA.cliSyntax}
                    </pre>
                  </div>

                  {/* Strengths */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono font-bold text-white uppercase">Key Strengths</div>
                    <ul className="space-y-1">
                      {currentComp.toolA.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs text-[#9FB0B7]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#C8F904] shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Best use */}
                  <div className="p-3 rounded-lg bg-[#0E1A1F] border border-[#6967FB]/20 text-xs font-mono">
                    <span className="text-white font-bold">Best Operational Fit: </span>
                    <span className="text-[#9FB0B7]">{currentComp.toolA.bestUse}</span>
                  </div>
                </div>

                {/* TOOL B */}
                <div className="rounded-2xl bg-[#122026]/90 border border-[#6967FB]/30 p-5 space-y-4 relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white font-mono">{currentComp.toolB.name}</h4>
                      <p className="text-xs text-cyan-400 font-mono">{currentComp.toolB.archetype}</p>
                      <p className="text-[10px] text-[#9FB0B7]">Vendor: {currentComp.toolB.vendor}</p>
                    </div>
                  </div>

                  {/* Ratings */}
                  <div className="space-y-2 py-1">
                    <div>
                      <div className="flex justify-between text-[11px] font-mono mb-1">
                        <span className="text-[#9FB0B7]">Raw Scan Speed</span>
                        <span className="text-white font-bold">{currentComp.toolB.speedRating}/100</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#0E1A1F] rounded-full overflow-hidden">
                        <div className="h-full bg-[#6967FB]" style={{ width: `${currentComp.toolB.speedRating}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-mono mb-1">
                        <span className="text-[#9FB0B7]">Stealth & IDS Evasion</span>
                        <span className="text-white font-bold">{currentComp.toolB.stealthRating}/100</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#0E1A1F] rounded-full overflow-hidden">
                        <div className="h-full bg-[#C8F904]" style={{ width: `${currentComp.toolB.stealthRating}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-mono mb-1">
                        <span className="text-[#9FB0B7]">Scripting & Extensibility</span>
                        <span className="text-white font-bold">{currentComp.toolB.scriptingPower}/100</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#0E1A1F] rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400" style={{ width: `${currentComp.toolB.scriptingPower}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* CLI Syntax */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#9FB0B7]">
                      <span>CLI Command Template</span>
                      <button
                        onClick={() => handleCopy(currentComp.toolB.cliSyntax, 'toolB_cli')}
                        className="text-[#C8F904] hover:underline flex items-center gap-1 text-[10px]"
                      >
                        {copiedKey === 'toolB_cli' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'toolB_cli' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-2.5 rounded-lg bg-[#0E1A1F] border border-black/40 text-xs font-mono text-cyan-400 overflow-x-auto whitespace-pre-wrap">
                      {currentComp.toolB.cliSyntax}
                    </pre>
                  </div>

                  {/* Strengths */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono font-bold text-white uppercase">Key Strengths</div>
                    <ul className="space-y-1">
                      {currentComp.toolB.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs text-[#9FB0B7]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Best use */}
                  <div className="p-3 rounded-lg bg-[#0E1A1F] border border-[#6967FB]/20 text-xs font-mono">
                    <span className="text-white font-bold">Best Operational Fit: </span>
                    <span className="text-[#9FB0B7]">{currentComp.toolB.bestUse}</span>
                  </div>
                </div>

              </div>

              {/* Expert Architectural Verdict */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#6967FB]/20 via-[#122026] to-[#C8F904]/10 border border-[#C8F904]/30">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#C8F904] mb-2">
                  <Terminal className="w-4 h-4" />
                  <span>CYVANTIS ARCHITECTURAL VERDICT</span>
                </div>
                <p className="text-sm font-mono text-white leading-relaxed">
                  {currentComp.verdict}
                </p>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
