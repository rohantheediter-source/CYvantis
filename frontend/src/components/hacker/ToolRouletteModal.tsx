import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, RefreshCw, ArrowRight, Lightbulb, Play, 
  Shield, Terminal, Zap, CheckCircle2, Flame
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useHackerProfile } from '../../context/HackerProfileContext';

interface ToolRouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchTool: (toolId: string, sampleInput?: string) => void;
}

interface SpotlightData {
  date: string;
  tool_of_the_day: {
    id: string;
    name: string;
    category: string;
    description: string;
    sampleInput: string;
    proTip: string;
  };
  roulette_pool: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    sampleInput: string;
    proTip: string;
  }>;
}

export const ToolRouletteModal: React.FC<ToolRouletteModalProps> = ({
  isOpen,
  onClose,
  onLaunchTool
}) => {
  const { addXp } = useHackerProfile();
  const [data, setData] = useState<SpotlightData | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [roulettePick, setRoulettePick] = useState<SpotlightData['tool_of_the_day'] | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchSpotlight = async () => {
      try {
        const res = await apiRequest<SpotlightData>('/tools/spotlight');
        if (res) {
          setData(res);
          setRoulettePick(res.tool_of_the_day);
        }
      } catch (e) {
        console.error('Failed to load spotlight data:', e);
      }
    };
    fetchSpotlight();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSpinRoulette = () => {
    if (!data || !data.roulette_pool || data.roulette_pool.length === 0) return;
    setIsSpinning(true);
    let counter = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * data.roulette_pool.length);
      setRoulettePick(data.roulette_pool[randomIdx]);
      counter++;
      if (counter >= 15) {
        clearInterval(interval);
        setIsSpinning(false);
        addXp(20, 'Spun Tool Discovery Roulette 🎰');
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0E1A1F] border border-[#6967FB]/40 rounded-2xl shadow-[0_0_60px_rgba(105,103,251,0.3)] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-[#6967FB]/25 bg-[#122026] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#C8F904]/10 border border-[#C8F904]/40 flex items-center justify-center text-[#C8F904]">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                TOOL ROULETTE & DAILY SPOTLIGHT
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6967FB]/20 border border-[#6967FB]/40 text-[#C8F904]">
                  DISCOVERY
                </span>
              </h2>
              <p className="text-xs text-[#9FB0B7]">
                Surprise discovery, pro operational tips, and one-click interactive sandbox launches.
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

        <div className="p-6 space-y-6">
          
          {/* DAILY TOOL OF THE DAY BANNER */}
          {data?.tool_of_the_day && (
            <div className="p-4 rounded-xl bg-[#122026]/90 border border-[#C8F904]/30 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase text-[#C8F904] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  DAILY TOOL SPOTLIGHT ({data.date})
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#6967FB]/20 text-[#9FB0B7]">
                  {data.tool_of_the_day.category}
                </span>
              </div>
              <h3 className="text-base font-bold text-white font-mono">
                {data.tool_of_the_day.name}
              </h3>
              <p className="text-xs text-[#9FB0B7] mt-1">
                {data.tool_of_the_day.description}
              </p>
              <div className="mt-3 p-2.5 rounded-lg bg-[#0E1A1F] border border-[#6967FB]/25 flex items-start gap-2 text-xs font-mono">
                <Lightbulb className="w-3.5 h-3.5 text-[#C8F904] shrink-0 mt-0.5" />
                <span className="text-white"><strong className="text-[#C8F904]">Pro Tip: </strong>{data.tool_of_the_day.proTip}</span>
              </div>
            </div>
          )}

          {/* ROULETTE REEL DISPLAY */}
          <div className="p-6 rounded-2xl bg-[#0E1A1F] border-2 border-dashed border-[#6967FB]/50 text-center relative overflow-hidden">
            <div className="text-xs font-mono text-[#9FB0B7] uppercase tracking-widest mb-2">
              RANDOM TOOL DISCOVERY ROULETTE
            </div>

            {roulettePick ? (
              <div className={`space-y-3 transition-transform ${isSpinning ? 'scale-95 blur-sm opacity-80' : 'scale-100'}`}>
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#6967FB]/20 border border-[#C8F904] flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(200,249,4,0.3)]">
                  🎰
                </div>
                <h4 className="text-xl font-bold text-white font-mono">
                  {roulettePick.name}
                </h4>
                <p className="text-xs font-mono text-[#C8F904]">
                  {roulettePick.category}
                </p>
                <p className="text-xs text-[#9FB0B7] max-w-md mx-auto">
                  {roulettePick.description}
                </p>
                <div className="bg-[#122026] p-2 rounded-lg max-w-sm mx-auto text-xs font-mono text-white/90 border border-[#6967FB]/20">
                  <span className="text-[#9FB0B7]">Target: </span>
                  <span className="text-[#C8F904]">{roulettePick.sampleInput}</span>
                </div>
              </div>
            ) : (
              <div className="py-8 font-mono text-xs text-[#9FB0B7]">
                Click spin to discover a random cyber security tool
              </div>
            )}

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={handleSpinRoulette}
                disabled={isSpinning}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#6967FB] hover:bg-[#5855ea] text-white font-mono font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(105,103,251,0.4)] transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>{isSpinning ? 'Selecting Vector...' : 'Spin Roulette (Get XP)'}</span>
              </button>

              {roulettePick && !isSpinning && (
                <button
                  onClick={() => {
                    onClose();
                    onLaunchTool(roulettePick.id, roulettePick.sampleInput);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#C8F904] hover:bg-[#b0dc03] text-black font-mono font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(200,249,4,0.3)] transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>Launch & Test Now</span>
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
