import { matchPlayed } from './match-played.type';

export type teamStatV2 = {
  team: string;
  totalMatches: number;
  totalPoint: number;
  win: number;
  lose: number;
  totalReward: number;
  totalPaid: number;
  totalAchv: number;
  totalSales: number;
  totalTarget: number;
  pref: string | null;
  position: number;
  group?: string | null;
  matchPlayed: Array<matchPlayed>;
};
