import type { CatanColorKey, GameId, Group } from '@/core/model';
import { CATAN_GAME_ID, CATAN_MODULE, canPlayCatan } from '@/games/catan';
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
  /** Keys of the editions; empty for a game without editions (FA-ER-03). */
  readonly editions: readonly string[];
  /** Keys of the modes, the first is the default; empty for a game without modes (FA-ER-03). */
  readonly modes: readonly string[];
  /** Whether a match has exactly one winner (FA-ER-07, E-42). */
  readonly hasSingleWinner: boolean;
  /** Whether the duration of a match is recorded (FA-ER-10, E-43). */
  readonly tracksDuration: boolean;
};

const CUSTOM_GAME_CAPABILITIES: GameCapabilities = {
  isSupported: false,
  playerColors: null,
  supportsVictoryPoints: false,
  editions: [],
  modes: [],
  hasSingleWinner: false,
  tracksDuration: false,
};

/**
 * Returns the supported game with this id, or `undefined` for a custom game.
 */
export function findSupportedGame(gameId: GameId): SupportedGame | undefined {
  return SUPPORTED_GAMES.find((game) => game.id === gameId);
}

/**
 * Capabilities of a game, so the UI need not distinguish modules from custom games
 * (Architecture 5.1). FA-SP-05: custom games have no player colours and no victory points;
 * FA-ER-03, FA-ER-07, FA-ER-10: no edition, no mode, draws possible and no duration.
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
    editions: game.editions,
    modes: game.modes,
    hasSingleWinner: game.hasSingleWinner,
    tracksDuration: game.tracksDuration,
  };
}

/**
 * Whether a group can play a game (Specification 3.4, US-ER-01 AK-5): it is active, and a
 * supported game accepts it, e.g. Catan only with 2 to 4 members; a custom game is open to global
 * groups and to the groups bound to it. Whether the game itself is active is checked by the
 * caller, which knows the custom games.
 */
export function canGroupPlay(group: Group, gameId: GameId): boolean {
  if (gameId === CATAN_GAME_ID) {
    return canPlayCatan(group);
  }
  return !group.archived && (group.binding.kind === 'global' || group.binding.gameId === gameId);
}
