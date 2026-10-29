import React, { useState } from 'react';
import { 
  X, Shield, Award, Flame, ExternalLink, Share2, Copy, Check, 
  Terminal, Layers, CheckCircle2, UserCheck, Star
} from 'lucide-react';
import { useHackerProfile, ALL_BADGES } from '../../context/HackerProfileContext';

interface PublicHackerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCallsign?: string;
}

export const PublicHackerProfileModal: React.FC<PublicHackerProfileModalProps> = ({
  isOpen,
  onClose,
  targetCallsign
}) => {
  const { profile } = useHackerProfile();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const displayCallsign = targetCallsign || profile.callsign;
  const profileUrl = `${window.location.origin}/#hacker/${encodeURIComponent(displayCallsign)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const unlockedBadges = ALL_BADGES.filter(b => profile.unlockedBadges.includes(b.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0E1A1F] border border-[#6967FB]/40 rounded-2xl shadow-[0_0_60px_rgba(105,103,251,0.3)] overflow-hidden my-8">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#6967FB]/25 bg-[#122026] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#C8F904]/10 border border-[#C8F904]/40 flex items-center justify-center text-[#C8F904]">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
                PUBLIC HACKER PROFILE
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6967FB]/20 border border-[#6967FB]/40 text-[#C8F904]">
                  COMMUNITY SHOWCASE
                </span>
              </h2>
              <p className="text-xs text-[#9FB0B7]">
                Verified operator credentials, active streaks, and curated cybersecurity stacks.
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
          
          {/* Profile Card Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-6 rounded-2xl bg-[#122026]/90 border border-[#6967FB]/30 relative overflow-hidden">
            <div className="w-20 h-20 rounded-2xl bg-[#0E1A1F] border-2 border-[#C8F904] flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(200,249,4,0.3)] shrink-0">
              🎭
            </div>

            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-2xl font-black text-white font-mono">
                  {displayCallsign}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded bg-[#C8F904]/10 border border-[#C8F904]/40 text-[#C8F904] font-mono font-bold uppercase">
                  {profile.rank}
                </span>
              </div>

              <p className="text-xs font-mono text-[#6967FB] font-bold">
                {profile.terminalTitle}
              </p>

              <p className="text-xs text-[#9FB0B7] leading-relaxed pt-1">
                {profile.bio}
              </p>
            </div>

            {/* Streak flame badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0E1A1F] border border-[#6967FB]/30">
              <Flame className="w-5 h-5 text-orange-400" />
              <div className="text-left">
                <div className="text-xs font-bold text-white font-mono">{profile.streak} DAYS</div>
                <div className="text-[9px] text-[#9FB0B7] font-mono">Telemetry Streak</div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#122026] border border-[#6967FB]/20 text-center">
              <div className="text-[10px] font-mono text-[#9FB0B7] uppercase">Operator Level</div>
              <div className="text-xl font-bold text-white font-mono mt-1">Lvl {profile.level}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#122026] border border-[#6967FB]/20 text-center">
              <div className="text-[10px] font-mono text-[#9FB0B7] uppercase">Total XP</div>
              <div className="text-xl font-bold text-[#C8F904] font-mono mt-1">{profile.xp}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#122026] border border-[#6967FB]/20 text-center">
              <div className="text-[10px] font-mono text-[#9FB0B7] uppercase">Challenges Cracked</div>
              <div className="text-xl font-bold text-cyan-400 font-mono mt-1">{profile.solvedChallenges.length}</div>
            </div>
          </div>

          {/* Verified Badges */}
          <div className="space-y-2.5">
            <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#C8F904]" />
              <span>VERIFIED ACCOLADES ({unlockedBadges.length})</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {unlockedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="p-2.5 rounded-xl bg-[#122026] border border-[#C8F904]/30 flex items-center gap-2.5 text-xs font-mono text-white"
                >
                  <span className="text-lg">{badge.icon}</span>
                  <div>
                    <div className="font-bold">{badge.title}</div>
                    <div className="text-[10px] text-[#9FB0B7] truncate max-w-[130px]">{badge.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Favorite Tool Stack */}
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#6967FB]" />
              <span>PRIMARY TOOL PLAYLIST</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.favoriteStack.map((tool, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-lg bg-[#122026] border border-[#6967FB]/30 text-xs font-mono text-[#C8F904]"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* Share Profile Link */}
          <div className="p-4 rounded-xl bg-[#0E1A1F] border border-[#6967FB]/30 flex items-center justify-between gap-3">
            <div className="text-xs font-mono text-[#9FB0B7] truncate">
              Public Link: <span className="text-white">{profileUrl}</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C8F904] hover:bg-[#b0dc03] text-black font-mono font-bold text-xs shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
