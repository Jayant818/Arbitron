export interface Nft {
  id: string;
  name: string;
  rarity: string;
  icon: string;
  color: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

export interface Contest {
  id: string;
  name: string;
  rank: number;
  pnl: number;
  prize: number;
  date: string;
}

export interface User {
  username: string;
  email: string;
  avatar: string;
  rank: number;
  xp: number;
  nextLevelXp: number;
  contestsPlayed: number;
  winRate: number;
  totalEarnings: number;
  nfts: Nft[];
  badges: Badge[];
  recentContests: Contest[];
}
