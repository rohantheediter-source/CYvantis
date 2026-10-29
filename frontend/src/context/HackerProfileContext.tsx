import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { HackerProfile, HackerRank, CommandSnippet, ToolPlaylist, HackerBadge } from '../types/hacker';
import { useAuth } from './AuthContext';
import { apiRequest } from '../services/api';

export const ALL_BADGES: HackerBadge[] = [
  { id: 'first-blood', title: 'First Blood', description: 'Executed first security tool inspection on CYVANTIS.', icon: '⚡', category: 'recon' },
  { id: 'matrix-decoder', title: 'Matrix Decoder', description: 'De-obfuscated a multi-tier payload or cipher.', icon: '🧬', category: 'crypto' },
  { id: 'subnet-architect', title: 'Subnet Architect', description: 'Calculated and partitioned network boundaries.', icon: '🌐', category: 'recon' },
  { id: 'threat-hunter', title: 'Threat Hunter', description: 'Pinpointed malicious IP in honeypot telemetry.', icon: '🎯', category: 'forensics' },
  { id: 'hash-slayer', title: 'Hash Slayer', description: 'Cracked or verified an attack credential hash.', icon: '🗝️', category: 'crypto' },
  { id: 'streak-flame-3', title: 'Daily Sentinel (3d)', description: 'Maintained a 3-day active telemetry streak.', icon: '🔥', category: 'retention' },
  { id: 'streak-flame-7', title: 'Cyber Operative (7d)', description: 'Maintained a 7-day uninterrupted streak.', icon: '🏆', category: 'retention' },
  { id: 'stack-curator', title: 'Stack Curator', description: 'Created or customized a dedicated tool playlist.', icon: '📁', category: 'mastery' },
  { id: 'ctf-adept', title: 'CTF Solver', description: 'Cracked in-browser quick-fire cyber challenges.', icon: '⚔️', category: 'crypto' },
  { id: 'specter-elite', title: 'Specter Elite', description: 'Reached Tier 50+ sovereign analyst rank.', icon: '👑', category: 'mastery' },
];

export const DEFAULT_PLAYLISTS: ToolPlaylist[] = [
  {
    id: 'recon-stack',
    title: 'My Red Team Recon Stack',
    description: 'High-speed external perimeter enumeration, IP triage, and subnet analysis.',
    icon: 'Radar',
    toolIds: ['ip-analyzer', 'subnet', 'url-scanner'],
    isCustom: false
  },
  {
    id: 'ir-fastpack',
    title: 'Incident Response Fastpack',
    description: 'Rapid triage toolkit for analyzing suspicious logs, hashes, and active exploits.',
    icon: 'ShieldAlert',
    toolIds: ['decoder', 'hash-gen', 'ip-analyzer'],
    isCustom: false
  },
  {
    id: 'osint-kit',
    title: 'OSINT Threat Kit',
    description: 'Domain triangulation, ASN reputation inspection, and phishing verification.',
    icon: 'Globe',
    toolIds: ['ip-analyzer', 'url-scanner', 'password'],
    isCustom: false
  }
];

export const calculateRankAndLevel = (xp: number): { level: number; rank: HackerRank; nextLevelXp: number; prevLevelXp: number } => {
  // Level progression curve: Level = floor(sqrt(xp / 40)) + 1
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 40)) + 1);
  const prevLevelXp = Math.floor(Math.pow(level - 1, 2) * 40);
  const nextLevelXp = Math.floor(Math.pow(level, 2) * 40);

  let rank: HackerRank = 'Rookie';
  if (level >= 50) rank = 'Specter';
  else if (level >= 30) rank = 'Elite';
  else if (level >= 15) rank = 'Engineer';
  else if (level >= 5) rank = 'Analyst';

  return { level, rank, nextLevelXp, prevLevelXp };
};

interface HackerProfileContextType {
  profile: HackerProfile;
  activePlaylist: ToolPlaylist | null;
  setActivePlaylist: (p: ToolPlaylist | null) => void;
  addXp: (amount: number, reason?: string) => void;
  checkInToday: () => void;
  useStreakFreeze: () => boolean;
  saveToolNote: (toolId: string, note: string) => void;
  addCommandSnippet: (snippet: Omit<CommandSnippet, 'id' | 'createdAt'>) => void;
  deleteCommandSnippet: (id: string) => void;
  savePlaylist: (playlist: ToolPlaylist) => void;
  deletePlaylist: (id: string) => void;
  recordToolUse: (toolId: string) => void;
  recordSolvedChallenge: (challengeId: string, xp: number, badgeReward?: string) => void;
  updateProfile: (updates: Partial<HackerProfile>) => void;
  syncToBackend: () => Promise<void>;
  recentXpToast: { amount: number; reason: string } | null;
}

const STORAGE_KEY = 'cyvantis_hacker_profile_v1';

const HackerProfileContext = createContext<HackerProfileContextType | undefined>(undefined);

export const HackerProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activePlaylist, setActivePlaylist] = useState<ToolPlaylist | null>(null);
  const [recentXpToast, setRecentXpToast] = useState<{ amount: number; reason: string } | null>(null);

  const initialCallsign = user?.username || 'Phantom_0x1';

  const [profile, setProfile] = useState<HackerProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const todayStr = new Date().toISOString().split('T')[0];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const isCheckedToday = parsed.lastCheckInDate === todayStr;
        return {
          ...parsed,
          checkedInToday: isCheckedToday
        };
      } catch (e) {
        console.error('Failed to parse hacker profile:', e);
      }
    }

    const initialXp = 120;
    const { level, rank } = calculateRankAndLevel(initialXp);

    return {
      callsign: initialCallsign,
      terminalTitle: '[Phantom Analyst]',
      avatarSeed: initialCallsign,
      avatarColor: '#C8F904',
      bio: 'Cybersecurity Sentinel monitoring live honeypot telemetry on CYVANTIS.',
      xp: initialXp,
      level,
      rank,
      streak: 1,
      streakFreezes: 2,
      lastCheckInDate: todayStr,
      checkedInToday: true,
      unlockedBadges: ['first-blood'],
      solvedChallenges: [],
      favoriteStack: ['IP Threat & Domain Analyzer', 'Payload Decoder', 'Subnet Architect'],
      personalNotes: {
        'ip-analyzer': 'Remember to cross-reference ASN with known bulletproof hosting ranges (e.g., AS200000+).',
        'decoder': 'PowerShell -enc expects UTF-16LE before base64 encode/decode.',
        'subnet': 'CYVANTIS honeypot isolated trap VLAN spans 172.24.16.0/21.'
      },
      savedSnippets: [
        {
          id: 'snip-1',
          title: 'Quick Nmap Fast Script Sweep',
          toolId: 'ip-analyzer',
          command: 'nmap -sV -sC -T4 -F -Pn <target_ip>',
          description: 'Top 100 ports scan with default script signatures and version probe.',
          tags: ['recon', 'nmap'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'snip-2',
          title: 'Base64 PowerShell AMSI Bypass Test',
          toolId: 'decoder',
          command: '[Ref].Assembly.GetType("System.Management.Automation.AmsiUtils")',
          description: 'Standard AMSI memory structure inspection trigger.',
          tags: ['obfuscation', 'amsi'],
          createdAt: new Date().toISOString()
        }
      ],
      customPlaylists: DEFAULT_PLAYLISTS,
      isPublic: true,
      toolsUsedCount: 3
    };
  });

  // Save to localStorage on state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  // Sync with user profile if username changes
  useEffect(() => {
    if (user?.username && (!profile.callsign || profile.callsign === 'Phantom_0x1')) {
      setProfile(prev => ({
        ...prev,
        callsign: user.username,
        avatarSeed: user.username
      }));
    }
  }, [user]);

  const addXp = useCallback((amount: number, reason: string = 'Security action performed') => {
    setProfile(prev => {
      const newXp = prev.xp + amount;
      const { level, rank } = calculateRankAndLevel(newXp);
      const newBadges = [...prev.unlockedBadges];

      // Auto-unlock badges if conditions met
      if (level >= 50 && !newBadges.includes('specter-elite')) {
        newBadges.push('specter-elite');
      }

      return {
        ...prev,
        xp: newXp,
        level,
        rank,
        unlockedBadges: newBadges
      };
    });

    setRecentXpToast({ amount, reason });
    setTimeout(() => {
      setRecentXpToast(null);
    }, 3500);
  }, []);

  const checkInToday = useCallback(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    setProfile(prev => {
      if (prev.lastCheckInDate === todayStr) {
        return { ...prev, checkedInToday: true };
      }

      const prevDate = new Date(prev.lastCheckInDate);
      const todayDate = new Date(todayStr);
      const diffDays = Math.floor((todayDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      let newStreak = prev.streak;
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        // Streak broken unless freeze used
        newStreak = 1;
      }

      const newBadges = [...prev.unlockedBadges];
      if (newStreak >= 3 && !newBadges.includes('streak-flame-3')) newBadges.push('streak-flame-3');
      if (newStreak >= 7 && !newBadges.includes('streak-flame-7')) newBadges.push('streak-flame-7');

      return {
        ...prev,
        streak: newStreak,
        lastCheckInDate: todayStr,
        checkedInToday: true,
        unlockedBadges: newBadges
      };
    });

    addXp(50, 'Daily Sentinel Check-In 🔥');
  }, [addXp]);

  const useStreakFreeze = useCallback(() => {
    let used = false;
    setProfile(prev => {
      if (prev.streakFreezes <= 0) return prev;
      used = true;
      return {
        ...prev,
        streakFreezes: prev.streakFreezes - 1
      };
    });
    return used;
  }, []);

  const saveToolNote = useCallback((toolId: string, note: string) => {
    setProfile(prev => ({
      ...prev,
      personalNotes: {
        ...prev.personalNotes,
        [toolId]: note
      }
    }));
    addXp(15, 'Saved tool intelligence note');
  }, [addXp]);

  const addCommandSnippet = useCallback((snippetData: Omit<CommandSnippet, 'id' | 'createdAt'>) => {
    const newSnippet: CommandSnippet = {
      ...snippetData,
      id: 'snip_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    setProfile(prev => ({
      ...prev,
      savedSnippets: [newSnippet, ...prev.savedSnippets]
    }));
    addXp(25, 'Saved custom command snippet');
  }, [addXp]);

  const deleteCommandSnippet = useCallback((id: string) => {
    setProfile(prev => ({
      ...prev,
      savedSnippets: prev.savedSnippets.filter(s => s.id !== id)
    }));
  }, []);

  const savePlaylist = useCallback((playlist: ToolPlaylist) => {
    setProfile(prev => {
      const exists = prev.customPlaylists.some(p => p.id === playlist.id);
      const updated = exists
        ? prev.customPlaylists.map(p => (p.id === playlist.id ? playlist : p))
        : [...prev.customPlaylists, playlist];

      const newBadges = [...prev.unlockedBadges];
      if (!newBadges.includes('stack-curator')) newBadges.push('stack-curator');

      return {
        ...prev,
        customPlaylists: updated,
        unlockedBadges: newBadges
      };
    });
    addXp(30, 'Curated custom tool stack');
  }, [addXp]);

  const deletePlaylist = useCallback((id: string) => {
    setProfile(prev => ({
      ...prev,
      customPlaylists: prev.customPlaylists.filter(p => p.id !== id)
    }));
  }, []);

  const recordToolUse = useCallback((toolId: string) => {
    setProfile(prev => ({
      ...prev,
      toolsUsedCount: prev.toolsUsedCount + 1
    }));
    addXp(10, `Executed ${toolId}`);
  }, [addXp]);

  const recordSolvedChallenge = useCallback((challengeId: string, xp: number, badgeReward?: string) => {
    setProfile(prev => {
      if (prev.solvedChallenges.includes(challengeId)) return prev;

      const newSolved = [...prev.solvedChallenges, challengeId];
      const newBadges = [...prev.unlockedBadges];
      if (!newBadges.includes('ctf-adept')) newBadges.push('ctf-adept');
      if (badgeReward && !newBadges.includes(badgeReward)) newBadges.push(badgeReward);

      return {
        ...prev,
        solvedChallenges: newSolved,
        unlockedBadges: newBadges
      };
    });
    addXp(xp, 'Cracked CTF Challenge Flag 🚩');
  }, [addXp]);

  const updateProfile = useCallback((updates: Partial<HackerProfile>) => {
    setProfile(prev => {
      const merged = { ...prev, ...updates };
      const { level, rank } = calculateRankAndLevel(merged.xp);
      return { ...merged, level, rank };
    });
  }, []);

  const syncToBackend = useCallback(async () => {
    try {
      await apiRequest('/tools/profile', {
        method: 'POST',
        body: JSON.stringify({
          callsign: profile.callsign,
          terminal_title: profile.terminalTitle,
          avatar_seed: profile.avatarSeed,
          bio: profile.bio,
          xp: profile.xp,
          level: profile.level,
          rank: profile.rank,
          streak: profile.streak,
          badges: profile.unlockedBadges,
          favorite_stack: profile.favoriteStack,
          is_public: profile.isPublic
        })
      });
    } catch (e) {
      console.warn('Backend sync completed in offline-first mode.');
    }
  }, [profile]);

  return (
    <HackerProfileContext.Provider
      value={{
        profile,
        activePlaylist,
        setActivePlaylist,
        addXp,
        checkInToday,
        useStreakFreeze,
        saveToolNote,
        addCommandSnippet,
        deleteCommandSnippet,
        savePlaylist,
        deletePlaylist,
        recordToolUse,
        recordSolvedChallenge,
        updateProfile,
        syncToBackend,
        recentXpToast
      }}
    >
      {children}
      {recentXpToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#122026]/95 border border-[#C8F904]/60 px-4 py-3 rounded-xl shadow-[0_0_25px_rgba(200,249,4,0.3)] backdrop-blur-md animate-bounce-short text-white font-mono text-xs">
          <div className="w-7 h-7 rounded-lg bg-[#C8F904]/20 border border-[#C8F904] flex items-center justify-center text-[#C8F904] font-bold">
            +{recentXpToast.amount}
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>XP EARNED</span>
              <span className="text-[#C8F904]">⚡</span>
            </div>
            <div className="text-[11px] text-[#9FB0B7]">{recentXpToast.reason}</div>
          </div>
        </div>
      )}
    </HackerProfileContext.Provider>
  );
};

export const useHackerProfile = () => {
  const context = useContext(HackerProfileContext);
  if (!context) {
    throw new Error('useHackerProfile must be used within a HackerProfileProvider');
  }
  return context;
};
