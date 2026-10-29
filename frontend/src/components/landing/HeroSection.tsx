import React from 'react';
import { ArrowRight, Lock, Radio } from 'lucide-react';
import { DigitalEarthHero } from './DigitalEarthHero';

interface HeroSectionProps {
  onLoginClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onLoginClick }) => {
  const handleScrollToPlatform = (e: React.MouseEvent) => {
    e.preventDefault();
    const elem = document.querySelector('#platform');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[92vh] lg:min-h-[96vh] flex flex-col justify-between pt-28 sm:pt-36 pb-8 overflow-hidden bg-[#080E1E]">
      {/* 1. Deep Space Atmospheric Subtle Grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(52, 211, 153, 0.15) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(52, 211, 153, 0.15) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* 2. Three.js Glowing 3D Digital Earth Canvas (Rising from bottom) */}
      <DigitalEarthHero />

      {/* 3. Centered Reference Composition: Typography & CTAs */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center space-y-6 sm:space-y-8 my-auto">
        {/* Small Understated Status Indicator */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0D1528]/90 border border-[#243149] text-[11px] font-mono text-[#34D399] backdrop-blur-md shadow-[0_0_15px_rgba(52,211,153,0.15)]">
          <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
          <span className="tracking-widest font-semibold uppercase">THREAT INTELLIGENCE ACTIVE</span>
        </div>

        {/* Large Centered Headline with Generous Whitespace */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-[#E8EEF8] font-mono tracking-tight leading-[1.12] max-w-4xl mx-auto">
          See the Attack.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#34D399] via-[#2DD4BF] to-[#38BDF8]">
            Understand the Adversary.
          </span>{' '}
          Defend with Intelligence.
        </h1>

        {/* Short Supporting Description */}
        <p className="text-base sm:text-lg md:text-xl text-[#94A3B8] leading-relaxed max-w-2xl mx-auto font-sans font-normal">
          Capture hostile activity, investigate attacker behavior, and transform deception telemetry into actionable threat intelligence.
        </p>

        {/* Two Refined CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <a
            href="#platform"
            onClick={handleScrollToPlatform}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#34D399] hover:bg-[#34D399]/90 text-[#080E1E] text-sm font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(52,211,153,0.35)] hover:shadow-[0_0_35px_rgba(52,211,153,0.5)] cursor-pointer"
          >
            <span>Explore the Platform</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <button
            onClick={onLoginClick}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#0D1528]/90 hover:bg-[#111C32] border border-[#243149] text-xs font-mono text-[#E8EEF8] hover:text-white hover:border-[#34D399]/50 flex items-center justify-center gap-2 transition-all backdrop-blur-md cursor-pointer"
          >
            <Lock className="w-4 h-4 text-[#34D399]" />
            <span>Launch Console</span>
          </button>
        </div>

        {/* Subtle Telemetry Micro-Indicator */}
        <div className="pt-2 text-[11px] font-mono text-[#94A3B8] flex items-center justify-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
            Live Global Deception Grid
          </span>
          <span>·</span>
          <span>Honeypot Sensor Mesh</span>
          <span>·</span>
          <span>Automated Threat Correlation</span>
        </div>
      </div>

      {/* Spacer to give room for the majestic digital Earth rising below */}
      <div className="h-28 sm:h-36 md:h-44 pointer-events-none" />
    </section>
  );
};

