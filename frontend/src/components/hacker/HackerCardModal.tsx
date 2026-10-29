import React, { useRef, useState } from 'react';
import { 
  X, Download, Copy, Check, Flame, Award, Shield, Terminal, 
  Sparkles, RefreshCw, Share2, Layers, Cpu, Eye, ExternalLink, UserCheck
} from 'lucide-react';
import { useHackerProfile, ALL_BADGES, calculateRankAndLevel } from '../../context/HackerProfileContext';

interface HackerCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPublicProfile?: () => void;
}

const AVATAR_STYLES = [
  { id: 'phantom', name: 'Phantom Mask', icon: '🎭' },
  { id: 'skull', name: 'Cyber Skull', icon: '💀' },
  { id: 'eye', name: 'All-Seeing Eye', icon: '👁️' },
  { id: 'ninja', name: 'Stealth Ninja', icon: '🥷' },
  { id: 'cyborg', name: 'Neural Cyborg', icon: '🤖' },
  { id: 'dragon', name: 'Cyber Dragon', icon: '🐉' },
];

const THEME_COLORS = [
  { id: 'lime', hex: '#C8F904', name: 'Laser Lime' },
  { id: 'cyan', hex: '#00F0FF', name: 'Neon Cyan' },
  { id: 'violet', hex: '#6967FB', name: 'Electric Violet' },
  { id: 'pink', hex: '#FF007F', name: 'Synthwave Pink' },
  { id: 'matrix', hex: '#00FF66', name: 'Matrix Terminal' },
];

const TERMINAL_TITLES = [
  '[Phantom Analyst]',
  '[Zero-Day Hunter]',
  '[Threat Hunter]',
  '[Binary Architect]',
  '[Red Team Operator]',
  '[Autonomous Sentinel]'
];

export const HackerCardModal: React.FC<HackerCardModalProps> = ({ isOpen, onClose, onOpenPublicProfile }) => {
  const { profile, updateProfile, syncToBackend } = useHackerProfile();
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeAvatar, setActiveAvatar] = useState(profile.avatarSeed || 'phantom');
  const [customCallsign, setCustomCallsign] = useState(profile.callsign);
  const [customTitle, setCustomTitle] = useState(profile.terminalTitle);
  const [customColor, setCustomColor] = useState(profile.avatarColor || '#C8F904');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const { nextLevelXp, prevLevelXp } = calculateRankAndLevel(profile.xp);
  const xpInCurrentLevel = profile.xp - prevLevelXp;
  const xpNeeded = Math.max(1, nextLevelXp - prevLevelXp);
  const progressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeeded) * 100)));

  const handleSavePersona = () => {
    updateProfile({
      callsign: customCallsign,
      terminalTitle: customTitle,
      avatarSeed: activeAvatar,
      avatarColor: customColor
    });
    syncToBackend();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/#hacker-${encodeURIComponent(profile.callsign)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadCardPng = async () => {
    setIsExporting(true);
    try {
      // High-res native canvas rendering (1200x675 16:9 standard card)
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 675;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dark background with gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 675);
      bgGrad.addColorStop(0, '#091015');
      bgGrad.addColorStop(0.5, '#0E1A1F');
      bgGrad.addColorStop(1, '#080E14');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 675);

      // Cyber Grid Pattern
      ctx.strokeStyle = 'rgba(105, 103, 251, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1200; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 675);
        ctx.stroke();
      }
      for (let y = 0; y < 675; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1200, y);
        ctx.stroke();
      }

      // Glowing Card Outer Border
      ctx.strokeStyle = customColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 30, 1140, 615);

      // Corner tech brackets
      ctx.fillStyle = customColor;
      const bracketSize = 25;
      // Top-Left
      ctx.fillRect(25, 25, bracketSize, 6);
      ctx.fillRect(25, 25, 6, bracketSize);
      // Top-Right
      ctx.fillRect(1175 - bracketSize, 25, bracketSize, 6);
      ctx.fillRect(1169, 25, 6, bracketSize);
      // Bottom-Left
      ctx.fillRect(25, 645 - 6, bracketSize, 6);
      ctx.fillRect(25, 645 - bracketSize, 6, bracketSize);
      // Bottom-Right
      ctx.fillRect(1175 - bracketSize, 645 - 6, bracketSize, 6);
      ctx.fillRect(1169, 645 - bracketSize, 6, bracketSize);

      // Header Brand
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px "Courier New", monospace';
      ctx.fillText('CYVANTIS // SOVEREIGN HACKER IDENTITY', 70, 95);

      ctx.fillStyle = customColor;
      ctx.font = '16px monospace';
      ctx.fillText('DECEIVE. DETECT. DEFEND. // OPERATOR VERIFICATION PROTOCOL', 70, 125);

      // Avatar circle & icon
      ctx.beginPath();
      ctx.arc(150, 250, 65, 0, Math.PI * 2);
      ctx.fillStyle = '#122026';
      ctx.fill();
      ctx.strokeStyle = customColor;
      ctx.lineWidth = 4;
      ctx.stroke();

      const selectedAvatarIcon = AVATAR_STYLES.find(a => a.id === activeAvatar)?.icon || '🎭';
      ctx.font = '65px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(selectedAvatarIcon, 150, 275);
      ctx.textAlign = 'left';

      // Hacker Callsign & Title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 44px monospace';
      ctx.fillText(profile.callsign, 250, 235);

      ctx.fillStyle = customColor;
      ctx.font = 'bold 22px monospace';
      ctx.fillText(profile.terminalTitle, 250, 270);

      ctx.fillStyle = '#9FB0B7';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Registered Cyber Sentinel // Verified UID: 0x${Math.abs(profile.xp * 9876).toString(16).toUpperCase()}`, 250, 300);

      // Stat Boxes
      const drawStatBox = (x: number, y: number, label: string, val: string, sub: string) => {
        ctx.fillStyle = 'rgba(18, 32, 38, 0.85)';
        ctx.fillRect(x, y, 230, 110);
        ctx.strokeStyle = 'rgba(105, 103, 251, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, 230, 110);

        ctx.fillStyle = '#9FB0B7';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(label.toUpperCase(), x + 20, y + 30);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 32px monospace';
        ctx.fillText(val, x + 20, y + 70);

        ctx.fillStyle = customColor;
        ctx.font = '12px monospace';
        ctx.fillText(sub, x + 20, y + 95);
      };

      drawStatBox(70, 360, 'Combat Rank', profile.rank.toUpperCase(), `TIER LEVEL ${profile.level}`);
      drawStatBox(330, 360, 'Sentinel Streak', `${profile.streak} DAYS`, 'ACTIVE FLAME 🔥');
      drawStatBox(590, 360, 'Total Experience', `${profile.xp} XP`, `${progressPercent}% TO LVL ${profile.level + 1}`);
      drawStatBox(850, 360, 'Tools & CTF Solved', `${profile.toolsUsedCount + profile.solvedChallenges.length}`, `${profile.unlockedBadges.length} BADGES UNLOCKED`);

      // Badges preview on canvas
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('VERIFIED BADGES & ACCOLADES:', 70, 520);

      const unlockedBadgesList = ALL_BADGES.filter(b => profile.unlockedBadges.includes(b.id));
      unlockedBadgesList.slice(0, 6).forEach((badge, idx) => {
        const bx = 70 + (idx * 180);
        const by = 540;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(bx, by, 165, 50);
        ctx.strokeStyle = 'rgba(200, 249, 4, 0.3)';
        ctx.strokeRect(bx, by, 165, 50);

        ctx.font = '22px sans-serif';
        ctx.fillText(badge.icon, bx + 12, by + 34);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(badge.title, bx + 45, by + 30);
      });

      // Footer signature
      ctx.fillStyle = 'rgba(159, 176, 183, 0.6)';
      ctx.font = '12px monospace';
      ctx.fillText(`AUTHENTICATED BY CYVANTIS DEFENSE NEXUS // GENERATED ${new Date().toLocaleDateString()}`, 70, 620);

      // Trigger download
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `CYVANTIS_HACKER_CARD_${profile.callsign}.png`;
      downloadLink.href = pngUrl;
      downloadLink.click();
    } catch (e) {
      console.error('Error generating card image:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0E1A1F] border border-[#6967FB]/40 rounded-2xl shadow-[0_0_50px_rgba(105,103,251,0.25)] overflow-hidden my-8">
        
        {/* Top Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#6967FB]/25 bg-[#122026]/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#C8F904]/10 border border-[#C8F904]/40 flex items-center justify-center text-[#C8F904]">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                HACKER IDENTITY & STAT CARD
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6967FB]/20 border border-[#6967FB]/40 text-[#C8F904]">
                  PHASE 1 CORE MOAT
                </span>
              </h2>
              <p className="text-xs text-[#9FB0B7]">
                Live verifiable operator card, streak progress, custom callsign & HD shareable export.
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
          
          {/* LIVE GLASSMORPHIC HACKER CARD PREVIEW */}
          <div 
            ref={cardRef}
            className="relative rounded-2xl border p-6 sm:p-8 overflow-hidden transition-all duration-300"
            style={{
              borderColor: `${customColor}66`,
              boxShadow: `0 0 30px ${customColor}22`,
              background: 'linear-gradient(135deg, rgba(14, 26, 31, 0.95) 0%, rgba(18, 32, 38, 0.9) 100%)'
            }}
          >
            {/* Tech chamfer corner brackets */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: customColor }} />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: customColor }} />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: customColor }} />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: customColor }} />

            {/* Ambient Background Watermark */}
            <div className="absolute -right-12 -bottom-12 opacity-5 pointer-events-none text-9xl font-mono font-black select-none text-white">
              CYVANTIS
            </div>

            {/* Card Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 shadow-inner bg-[#122026] relative"
                  style={{ borderColor: customColor, boxShadow: `0 0 15px ${customColor}44` }}
                >
                  {AVATAR_STYLES.find(a => a.id === activeAvatar)?.icon || '🎭'}
                  <span 
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black font-mono shadow"
                    style={{ backgroundColor: customColor }}
                  >
                    {profile.level}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                      {customCallsign || profile.callsign}
                    </h3>
                    <span 
                      className="text-xs px-2.5 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider"
                      style={{ 
                        backgroundColor: `${customColor}22`, 
                        color: customColor,
                        border: `1px solid ${customColor}44`
                      }}
                    >
                      {profile.rank}
                    </span>
                  </div>
                  <p className="text-xs font-mono" style={{ color: customColor }}>
                    {customTitle || profile.terminalTitle}
                  </p>
                  <p className="text-[11px] text-[#9FB0B7] mt-0.5">
                    UID: <span className="font-mono text-white/80">0xCYV_{profile.callsign.toUpperCase().slice(0, 6)}</span> • Verified Operator
                  </p>
                </div>
              </div>

              {/* Flame Streak Pill */}
              <div className="flex items-center gap-2 bg-[#122026]/80 border border-[#6967FB]/30 px-3.5 py-2 rounded-xl">
                <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
                <div>
                  <div className="text-xs font-bold text-white font-mono flex items-center gap-1">
                    <span>{profile.streak} DAY STREAK</span>
                  </div>
                  <div className="text-[10px] text-[#9FB0B7] font-mono">
                    {profile.checkedInToday ? '✓ Active Today' : '⚡ Check-in Pending'}
                  </div>
                </div>
              </div>
            </div>

            {/* Core Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
              <div className="p-3 rounded-xl bg-[#122026]/70 border border-[#6967FB]/25">
                <div className="text-[10px] font-mono text-[#9FB0B7] uppercase">Current Level</div>
                <div className="text-lg font-bold text-white font-mono mt-0.5">Lvl {profile.level}</div>
                <div className="text-[10px] font-mono" style={{ color: customColor }}>Rank: {profile.rank}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#122026]/70 border border-[#6967FB]/25">
                <div className="text-[10px] font-mono text-[#9FB0B7] uppercase">Total XP</div>
                <div className="text-lg font-bold text-[#C8F904] font-mono mt-0.5">{profile.xp} XP</div>
                <div className="text-[10px] text-[#9FB0B7] font-mono">{progressPercent}% to Lvl {profile.level + 1}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#122026]/70 border border-[#6967FB]/25">
                <div className="text-[10px] font-mono text-[#9FB0B7] uppercase">Badges Earned</div>
                <div className="text-lg font-bold text-white font-mono mt-0.5">{profile.unlockedBadges.length}</div>
                <div className="text-[10px] text-[#9FB0B7] font-mono">of {ALL_BADGES.length} Total</div>
              </div>

              <div className="p-3 rounded-xl bg-[#122026]/70 border border-[#6967FB]/25">
                <div className="text-[10px] font-mono text-[#9FB0B7] uppercase">Challenges Solved</div>
                <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">{profile.solvedChallenges.length} CTFs</div>
                <div className="text-[10px] text-[#9FB0B7] font-mono">{profile.toolsUsedCount} Tools Run</div>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="space-y-1.5 mb-5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-[#9FB0B7]">Level {profile.level} Progress</span>
                <span style={{ color: customColor }}>{xpInCurrentLevel} / {xpNeeded} XP ({progressPercent}%)</span>
              </div>
              <div className="h-2 w-full bg-[#122026] rounded-full overflow-hidden border border-[#6967FB]/20">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%`, backgroundColor: customColor }}
                />
              </div>
            </div>

            {/* Badges Carousel */}
            <div>
              <div className="text-xs font-mono font-bold text-white mb-2 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" style={{ color: customColor }} />
                <span>UNLOCKED ACCOLADES</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_BADGES.map((badge) => {
                  const isUnlocked = profile.unlockedBadges.includes(badge.id);
                  return (
                    <div
                      key={badge.id}
                      title={`${badge.title}: ${badge.description}`}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                        isUnlocked
                          ? 'bg-[#122026] text-white border border-[#C8F904]/40 shadow-sm'
                          : 'bg-white/5 text-white/30 border border-white/5 opacity-40'
                      }`}
                    >
                      <span>{badge.icon}</span>
                      <span className="font-bold">{badge.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* CUSTOMIZATION CONTROLS */}
          <div className="p-5 rounded-xl bg-[#122026]/80 border border-[#6967FB]/25 space-y-4">
            <div className="text-xs font-bold font-mono text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#C8F904]" />
                CUSTOMIZE HACKER PERSONA & THEME
              </span>
              {savedSuccess && (
                <span className="text-[#C8F904] flex items-center gap-1 text-[11px]">
                  <Check className="w-3.5 h-3.5" /> Persona Synchronized!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-[#9FB0B7] mb-1">HACKER CALLSIGN / ALIAS</label>
                <input
                  type="text"
                  value={customCallsign}
                  onChange={(e) => setCustomCallsign(e.target.value)}
                  placeholder="e.g. Ghost_0x7F"
                  className="w-full bg-[#0E1A1F] border border-[#6967FB]/30 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#C8F904]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#9FB0B7] mb-1">TERMINAL CLASSIFICATION TITLE</label>
                <select
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-[#0E1A1F] border border-[#6967FB]/30 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#C8F904]"
                >
                  {TERMINAL_TITLES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="block text-[11px] font-mono text-[#9FB0B7] mb-1.5">SELECT NEON AVATAR ARTIFACT</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_STYLES.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => setActiveAvatar(av.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                      activeAvatar === av.id
                        ? 'bg-[#6967FB]/30 text-white border-[#C8F904] shadow-[0_0_10px_rgba(200,249,4,0.25)]'
                        : 'bg-[#0E1A1F] text-[#9FB0B7] border-[#6967FB]/20 hover:text-white'
                    }`}
                  >
                    <span>{av.icon}</span>
                    <span>{av.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Accent Color */}
            <div>
              <label className="block text-[11px] font-mono text-[#9FB0B7] mb-1.5">GLOW ACCENT PALETTE</label>
              <div className="flex items-center gap-3">
                {THEME_COLORS.map((tc) => (
                  <button
                    key={tc.id}
                    onClick={() => setCustomColor(tc.hex)}
                    className={`w-7 h-7 rounded-full transition-all border-2 flex items-center justify-center ${
                      customColor === tc.hex ? 'scale-125 border-white shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: tc.hex }}
                    title={tc.name}
                  >
                    {customColor === tc.hex && <Check className="w-3.5 h-3.5 text-black font-bold" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSavePersona}
                className="px-4 py-2 bg-[#6967FB]/30 hover:bg-[#6967FB]/50 border border-[#6967FB]/60 text-white rounded-lg text-xs font-mono font-bold transition-all shadow"
              >
                Save Identity Changes
              </button>
            </div>
          </div>

          {/* EXPORT & SHARE BUTTONS */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadCardPng}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#C8F904] hover:bg-[#b0dc03] text-black font-mono font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(200,249,4,0.3)] transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Generating 1080p Card...' : 'Download Card PNG'}</span>
              </button>

              <button
                onClick={handleCopyShareLink}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#122026] hover:bg-[#182b33] border border-[#6967FB]/40 text-white font-mono text-xs rounded-xl transition-all cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-[#C8F904]" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Share URL'}</span>
              </button>
            </div>

            {onOpenPublicProfile && (
              <button
                onClick={onOpenPublicProfile}
                className="flex items-center gap-1.5 text-xs font-mono text-[#C8F904] hover:underline"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Public Profile Preview (/hacker/{profile.callsign})</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
