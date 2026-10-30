import React, { useState, useEffect } from 'react';
import {
  Sparkles, Terminal, ArrowRight, Check, Copy, CheckCircle2,
  Server, Cpu, ShieldCheck, Play, Pause, Zap, Radio
} from 'lucide-react';

interface QuickStepGuideProps {
  onLoginClick: () => void;
}

interface StepItem {
  number: string;
  badge: string;
  title: string;
  description: string;
  command: string;
  outputPreview: string;
  accentColor: string;
  glowColor: string;
  borderColor: string;
  statusText: string;
  icon: React.ElementType;
}

const STEPS: StepItem[] = [
  {
    number: '01',
    badge: 'API & DECEPTION CORE',
    title: 'FastAPI Backend Engine',
    description: 'Launch the high-performance async backend daemon with automated honeypot monitoring and SQLite telemetry database.',
    command: 'python -m uvicorn app.main:app --reload --port 8000',
    outputPreview: 'INFO: Uvicorn running on http://127.0.0.1:8000 [API Online]',
    accentColor: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.35)',
    borderColor: 'border-[#38BDF8]/40',
    statusText: 'PORT 8000 OPERATIONAL',
    icon: Server,
  },
  {
    number: '02',
    badge: 'REAL-TIME HUD CONSOLE',
    title: 'React SOC Dashboard',
    description: 'Start the Vite dev server to mount the sub-12ms WebSocket stream, interactive threat maps, and analytics workspace.',
    command: 'cd frontend && npm run dev',
    outputPreview: '➜ Local: http://localhost:5173/ [WebSocket Connected]',
    accentColor: '#818CF8',
    glowColor: 'rgba(129, 140, 248, 0.35)',
    borderColor: 'border-[#818CF8]/40',
    statusText: 'PORT 5173 READY',
    icon: Cpu,
  },
  {
    number: '03',
    badge: 'ENTERPRISE ACCESS',
    title: 'Authenticate & Stream',
    description: 'Log in with default SOC credentials (admin / Admin@Cyvantis2026!) to activate autonomous incident correlation.',
    command: 'Username: admin | Pass: Admin@Cyvantis2026!',
    outputPreview: 'AUTH SUCCESS: Token Granted • Role: SOC Administrator',
    accentColor: '#C8F904',
    glowColor: 'rgba(200, 249, 4, 0.4)',
    borderColor: 'border-[#C8F904]/40',
    statusText: 'FULL ACCESS GRANTED',
    icon: ShieldCheck,
  },
];

export const QuickStepGuide: React.FC<QuickStepGuideProps> = ({ onLoginClick }) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

  // Auto-cycle through the 3 steps smoothly if autoPlay is active
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const handleCopy = (command: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(command);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2200);
  };

  return (
    <section id="getting-started" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#243149]/80 relative z-10 select-none">
      {/* Background Decorative Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-[#6967FB]/10 via-[#38BDF8]/8 to-[#C8F904]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D1528] border border-[#243149] text-xs font-mono mb-4 shadow-[0_0_20px_rgba(56,189,248,0.15)]">
          <Sparkles className="w-3.5 h-3.5 text-[#C8F904] animate-pulse" />
          <span className="text-[#38BDF8] font-bold tracking-wider uppercase">RAPID DEPLOYMENT PIPELINE</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tight">
          Quick 3-Step Setup Guide
        </h2>
        <p className="text-[#94A3B8] text-sm sm:text-base mt-3 max-w-xl mx-auto font-sans leading-relaxed">
          Spin up your local CYVANTIS threat intelligence and deception instance in under 2 minutes with automated seeding.
        </p>

        {/* Interactive Play/Pause & Step Status Indicator */}
        <div className="mt-6 inline-flex items-center gap-3 px-4 py-1.5 rounded-xl bg-[#080E1E] border border-[#243149] text-xs font-mono">
          <button
            onClick={() => setIsAutoPlaying((prev) => !prev)}
            className="flex items-center gap-1.5 text-[#38BDF8] hover:text-[#C8F904] transition-colors cursor-pointer"
            title={isAutoPlaying ? 'Pause Auto-Rotation' : 'Resume Auto-Rotation'}
          >
            {isAutoPlaying ? (
              <>
                <Pause className="w-3 h-3 text-[#C8F904]" />
                <span className="text-[11px]">AUTO-CYCLING</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-[#38BDF8]" />
                <span className="text-[11px]">PAUSED (CLICK TO PLAY)</span>
              </>
            )}
          </button>

          <span className="text-[#243149]">|</span>

          {/* Stepper Dots */}
          <div className="flex items-center gap-2">
            {STEPS.map((step, idx) => (
              <button
                key={step.number}
                onClick={() => {
                  setActiveStep(idx);
                  setIsAutoPlaying(false);
                }}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  activeStep === idx
                    ? 'w-6 h-2 bg-[#C8F904] shadow-[0_0_10px_#C8F904]'
                    : 'w-2 h-2 bg-[#243149] hover:bg-[#38BDF8]'
                }`}
                title={`Jump to Step ${step.number}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Animated Circuit Pipeline Connector (Desktop SVG Line) */}
      <div className="relative mb-8 hidden md:block">
        <div className="absolute top-1/2 left-[15%] right-[15%] h-[2px] -translate-y-1/2 bg-[#243149] z-0 overflow-hidden">
          {/* Animated Glowing Light Pulse Traveling Along the Pipeline */}
          <div
            className="h-full bg-gradient-to-r from-transparent via-[#C8F904] to-transparent w-32 animate-[marquee_2.8s_linear_infinite]"
            style={{
              animation: 'pipeline-sweep 3s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* 3 Interactive Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative z-10">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = activeStep === index;
          const isCopied = copiedIndex === index;

          return (
            <div
              key={step.number}
              onClick={() => {
                setActiveStep(index);
                setIsAutoPlaying(false);
              }}
              className={`rounded-3xl p-6 sm:p-7 relative transition-all duration-300 cursor-pointer overflow-hidden group ${
                isActive
                  ? 'bg-[#0D1528] border-2 shadow-[0_20px_50px_rgba(0,0,0,0.85)] -translate-y-2.5 scale-[1.02]'
                  : 'bg-[#080E1E]/80 border border-[#243149] hover:border-[#38BDF8]/40 hover:-translate-y-1'
              }`}
              style={{
                borderColor: isActive ? step.accentColor : undefined,
                boxShadow: isActive ? `0 20px 50px rgba(0,0,0,0.8), 0 0 30px ${step.glowColor}` : undefined,
              }}
            >
              {/* Corner Telemetry Accents */}
              <div className="tech-corner-tl" />
              <div className="tech-corner-tr" />
              <div className="tech-corner-bl" />
              <div className="tech-corner-br" />

              {/* Specular Top Edge Light */}
              <div
                className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none transition-opacity"
                style={{ opacity: isActive ? 1 : 0.4 }}
              />

              {/* Step Header Badge & Step Number */}
              <div className="flex items-center justify-between mb-5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-black text-lg transition-transform duration-300 group-hover:scale-110 shadow-lg"
                  style={{
                    backgroundColor: isActive ? step.accentColor : '#0E1A1F',
                    color: isActive ? '#080E1E' : step.accentColor,
                    border: `1.5px solid ${step.accentColor}`,
                    boxShadow: isActive ? `0 0 20px ${step.glowColor}` : 'none',
                  }}
                >
                  {step.number}
                </div>

                <div className="flex items-center gap-2">
                  {isActive && (
                    <span className="flex h-2 w-2 relative">
                      <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ backgroundColor: step.accentColor }}
                      />
                      <span
                        className="relative inline-flex rounded-full h-2 w-2"
                        style={{ backgroundColor: step.accentColor }}
                      />
                    </span>
                  )}
                  <span
                    className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full border transition-colors"
                    style={{
                      color: step.accentColor,
                      borderColor: `${step.accentColor}55`,
                      backgroundColor: `${step.accentColor}15`,
                    }}
                  >
                    {step.badge}
                  </span>
                </div>
              </div>

              {/* Step Title & Description */}
              <h3 className="text-xl font-bold text-white font-mono mb-2 flex items-center gap-2 group-hover:text-[#C8F904] transition-colors">
                <Icon className="w-5 h-5 text-[#38BDF8]" />
                <span>{step.title}</span>
              </h3>

              <p className="text-xs text-[#94A3B8] font-sans mb-5 leading-relaxed min-h-[48px]">
                {step.description}
              </p>

              {/* Terminal Code Snippet Container with Copy Button */}
              <div className="rounded-2xl bg-[#050814] border border-[#243149] p-3.5 mb-4 font-mono text-xs relative group/code overflow-hidden shadow-inner">
                {/* Micro Terminal Bar */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#243149]/60 text-[10px] text-[#94A3B8]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500/70" />
                    <span className="w-2 h-2 rounded-full bg-amber-500/70" />
                    <span className="w-2 h-2 rounded-full bg-[#C8F904]/70" />
                    <span className="ml-1 text-[9px] text-[#94A3B8] font-mono">BASH COMMAND</span>
                  </div>

                  <button
                    onClick={(e) => handleCopy(step.command, index, e)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0D1528] hover:bg-[#111C32] border border-[#243149] text-[#E8EEF8] hover:text-[#C8F904] transition-colors cursor-pointer text-[10px]"
                    title="Copy command to clipboard"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-[#C8F904]" />
                        <span className="text-[#C8F904] font-bold">COPIED!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>COPY</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="overflow-x-auto text-[11px] text-[#E8EEF8] font-semibold py-0.5 flex items-center gap-2">
                  <span className="text-[#C8F904] select-none">$</span>
                  <code className="text-[#38BDF8]">{step.command}</code>
                </div>

                {/* Simulated Live Output Preview */}
                <div className="mt-2 pt-2 border-t border-[#243149]/40 text-[10px] text-[#94A3B8] truncate flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-[#C8F904] shrink-0" />
                  <span className="truncate">{step.outputPreview}</span>
                </div>
              </div>

              {/* Bottom Action Footer */}
              {index === 2 ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLoginClick();
                  }}
                  className="w-full py-3 rounded-xl bg-[#C8F904] hover:bg-[#D8FF1E] text-[#080E1E] font-mono font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(200,249,4,0.35)] hover:shadow-[0_0_30px_rgba(200,249,4,0.6)] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ShieldCheck className="w-4 h-4 text-[#080E1E]" />
                  <span>Launch Live Console</span>
                  <ArrowRight className="w-4 h-4 text-[#080E1E]" />
                </button>
              ) : (
                <div className="flex items-center justify-between pt-2 text-[11px] font-mono">
                  <span className="flex items-center gap-1.5 text-[#34D399]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{step.statusText}</span>
                  </span>
                  <span
                    className="text-[10px] font-bold hover:underline cursor-pointer"
                    style={{ color: step.accentColor }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveStep(index === 0 ? 1 : 2);
                      setIsAutoPlaying(false);
                    }}
                  >
                    NEXT STEP →
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

