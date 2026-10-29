import React, { useState } from 'react';
import { Sparkles, ChevronRight, ChevronLeft, X, Check, Activity, Search, Terminal, Zap } from 'lucide-react';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const tourSteps = [
    {
      title: 'Real-Time Honeypot Threat Stream',
      tag: 'Step 1 of 4 · Telemetry',
      icon: <Activity className="w-5 h-5 text-[#00d2ff]" />,
      desc: 'This live feed streams active SSH (Port 22) and Telnet (Port 23) decoy intrusions with sub-12ms WebSocket latency. Attackers are isolated inside Cowrie sandbox lures without host exposure.',
      tip: 'Tip: Press "P" on your keyboard anytime to pause incoming attacks.'
    },
    {
      title: 'Smart Filter Chips & Attack Scrubber',
      tag: 'Step 2 of 4 · Investigation',
      icon: <Search className="w-5 h-5 text-emerald-400" />,
      desc: 'Use one-click smart chips like "Only Critical" or "Failed Logins", or drag the horizontal Attack Timeline Scrubber to inspect historical attack patterns up to 60 minutes prior.',
      tip: 'Tip: Press "/" to instantly jump your cursor to the global search bar.'
    },
    {
      title: 'Split-View Log Inspector',
      tag: 'Step 3 of 4 · Deep Dive',
      icon: <Terminal className="w-5 h-5 text-[#ff6b35]" />,
      desc: 'Click on any event row to open the Split-View Inspector. View full raw shell transcripts, GeoIP routing, AbuseIPDB reputation scores, and "What Happened Next?" AI predictions.',
      tip: 'Tip: You can export instant Sigma detection rules for your SIEM directly from the inspector.'
    },
    {
      title: 'Power User Command Palette (Ctrl + K)',
      tag: 'Step 4 of 4 · Power Mode',
      icon: <Zap className="w-5 h-5 text-indigo-400" />,
      desc: 'SOC analysts can navigate with zero friction using the Command Palette. Press Ctrl + K (or Cmd + K on macOS) to execute actions, jump between attacks, or toggle Dark Ops mode.',
      tip: 'Tip: Press "?" anytime to view full keyboard shortcut mappings.'
    }
  ];

  const current = tourSteps[step];

  const handleNext = () => {
    if (step < tourSteps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(prev => prev - 1);
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Guided Tour"
      className="fixed inset-0 z-[170] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans"
    >
      <div className="bg-[#050b1f] border border-[#00d2ff]/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_0_90px_rgba(0,210,255,0.3)] space-y-6 relative overflow-hidden">
        {/* Glow behind */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#00d2ff]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d2ff]/10 border border-[#00d2ff]/30 text-[#00d2ff] text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{current.tag}</span>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#030718] border border-slate-800">
              {current.icon}
            </div>
            <h3 className="text-xl font-black text-white font-mono">
              {current.title}
            </h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {current.desc}
          </p>

          <div className="p-3 rounded-xl bg-[#030718] border border-slate-800 font-mono text-[11px] text-[#00d2ff]">
            {current.tip}
          </div>
        </div>

        {/* Navigation Step Indicators */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            {tourSteps.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === step ? 'w-6 bg-[#00d2ff]' : 'w-2 bg-slate-800'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#0072ff] text-white font-bold flex items-center gap-1.5 shadow-md shadow-[#00d2ff]/20"
            >
              <span>{step === tourSteps.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
