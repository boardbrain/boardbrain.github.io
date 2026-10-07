import type { CatanColorKey, GameId } from '@/core/model';
import { CATAN_MODULE } from '@/games/catan';
import type { GameModule } from '@/games/types';

/**
 * All supported games; in version 1 only Catan (FA-SP-01, Architecture 5.1).
 */
export const SUPPORTED_GAMES = [CATAN_MODULE] as const satisfies readonly GameModule[];

/**
 * One of the supported games, with the literal type of its text key.
 */
export type SupportedGame = (typeof SUPPORTED_GAMES)[number];

/**
 * What a game offers, independent of whether it is a module or a custom game
 * (FA-SP-05, Architecture 5.1).
 */
export type GameCapabilities = {
  /** Supported game with generation, as opposed to a custom game. */
  readonly isSupported: boolean;
  readonly playerColors: readonly CatanColorKey[] | null;
  readonly supportsVictoryPoints: boolean;
};

const CUSTOM_GAME_CAPABILITIES: GameCapabilities = {
  isSupported: false,
  playerColors: null,
  supportsVictoryPoints: false,
};

/**
 * Returns the supported game with this id, or `undefined` for a custom game.
 */
export function findSupportedGame(gameId: GameId): SupportedGame | undefined {
  return SUPPORTED_GAMES.find((game) => game.id === gameId);
}

/**
 * Capabilities of a game, so the UI need not distinguish modules from custom games
 * (Architecture 5.1). FA-SP-05: custom games have no player colours and no victory points.
 */
export function gameCapabilities(gameId: GameId): GameCapabilities {
  const game = findSupportedGame(gameId);
  if (game === undefined) {
    return CUSTOM_GAME_CAPABILITIES;
  }
  return {
    isSupported: true,
    playerColors: game.playerColors,
    supportsVictoryPoints: game.supportsVictoryPoints,
  };
}
