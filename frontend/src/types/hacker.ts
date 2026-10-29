export type HackerRank = 'Rookie' | 'Analyst' | 'Engineer' | 'Elite' | 'Specter';

export interface HackerBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  category: 'recon' | 'crypto' | 'forensics' | 'retention' | 'mastery';
}

export interface CommandSnippet {
  id: string;
  title: string;
  toolId: string;
  command: string;
  description: string;
  tags: string[];
  createdAt: string;
}

export interface ToolPlaylist {
  id: string;
  title: string;
  description: string;
  icon: string;
  toolIds: string[];
  isCustom?: boolean;
}

export interface HackerProfile {
  callsign: string;
  terminalTitle: string;
  avatarSeed: string;
  avatarColor: string;
  bio: string;
  xp: number;
  level: number;
  rank: HackerRank;
  streak: number;
  streakFreezes: number;
  lastCheckInDate: string;
  checkedInToday: boolean;
  unlockedBadges: string[];
  solvedChallenges: string[];
  favoriteStack: string[];
  personalNotes: Record<string, string>;
  savedSnippets: CommandSnippet[];
  customPlaylists: ToolPlaylist[];
  isPublic: boolean;
  toolsUsedCount: number;
}

export interface CtfChallenge {
  id: string;
  title: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'HARD';
  category: string;
  xpReward: number;
  badgeReward: string;
  description: string;
  hint: string;
  encodedSnippet: string;
}

export interface ToolComparisonItem {
  name: string;
  vendor: string;
  archetype: string;
  speedRating: number;
  stealthRating: number;
  scriptingPower: number;
  cliSyntax: string;
  strengths: string[];
  weaknesses: string[];
  bestUse: string;
}

export interface ToolComparison {
  id: string;
  title: string;
  category: string;
  toolA: ToolComparisonItem;
  toolB: ToolComparisonItem;
  verdict: string;
}
