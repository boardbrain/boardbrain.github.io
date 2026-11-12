import { CATAN_COLOR_KEYS, toGameId } from '@/core/model';
import type { GameModule } from '@/games/types';

/**
 * Built-in id of Catan, the same on every device and recognised automatically on import
 * (NFA-DH-05, Specification 3.9, Architecture 5.1).
 */
export const CATAN_GAME_ID = toGameId('c47a0000-0000-4000-8000-000000000001');

/**
 * Game module Catan for 2 to 4 persons with player colours and victory points (FA-SP-01,
 * FA-SP-05).
 */
export const CATAN_MODULE = {
  id: CATAN_GAME_ID,
  nameKey: 'spiele.namen.catan',
  playerCount: { min: 2, max: 4 },
  playerColors: CATAN_COLOR_KEYS,
  supportsVictoryPoints: true,
} as const satisfies GameModule;
