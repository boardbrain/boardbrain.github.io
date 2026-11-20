import { CATAN_COLOR_KEYS, toGameId } from '@/core/model';
import type { GameModule } from '@/games/types';
import { CATAN_MODES } from './generation/options';
import { CATAN_EDITIONS } from './placement/rounds';

/**
 * Built-in id of Catan, the same on every device and recognised automatically on import
 * (NFA-DH-05, Specification 3.9, Architecture 5.1).
 */
export const CATAN_GAME_ID = toGameId('c47a0000-0000-4000-8000-000000000001');

/**
 * Game module Catan for 2 to 4 persons with player colours and victory points (FA-SP-01,
 * FA-SP-05); a result has an edition, exactly one winner and may have a duration (FA-ER-03,
 * FA-ER-07, FA-ER-10); places follow from the victory points (FA-ER-11, E-42) or, without them,
 * from a ranking by hand with exactly one person on place 1 (FA-ER-12, E-49).
 */
export const CATAN_MODULE = {
  id: CATAN_GAME_ID,
  nameKey: 'spiele.namen.catan',
  playerCount: { min: 2, max: 4 },
  playerColors: CATAN_COLOR_KEYS,
  scoring: 'highest-wins',
  allowsNegativeScores: false,
  // E-49: the person entering decides whether to note the victory points or only the ranking.
  supportsRanking: true,
  editions: CATAN_EDITIONS,
  modes: CATAN_MODES,
  hasSingleWinner: true,
  tracksDuration: true,
} as const satisfies GameModule;
