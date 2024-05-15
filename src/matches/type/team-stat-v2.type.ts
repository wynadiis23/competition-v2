import { teamStat } from '../matches.service';
import { matchPlayed } from './match-played.type';

export type teamStatV2 = teamStat & {
  matchPlayed: Array<matchPlayed>;
};
