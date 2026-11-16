import type { CatanColorKey, CustomGame, GameId, Group, ScoringDirection } from '@/core/model';
import { CATAN_GAME_ID, CATAN_MODULE, canPlayCatan } from '@/games/catan';
import { assert } from '@/core/shared';
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
  /** Whether points can be recorded and which score wins, or `null` (FA-SP-05, FA-SP-07). */
  readonly scoring: ScoringDirection | null;
  /** Whether points may be below 0: in custom games, not in Catan (FA-ER-06). */
  readonly allowsNegativeScores: boolean;
  /** Whether a ranking can be entered by hand: only in custom games (FA-ER-12, E-45). */
  readonly supportsRanking: boolean;
  /** Keys of the editions; empty for a game without editions (FA-ER-03). */
  readonly editions: readonly string[];
  /** Keys of the modes, the first is the default; empty for a game without modes (FA-ER-03). */
  readonly modes: readonly string[];
  /** Whether a match has exactly one winner (FA-ER-07, E-42). */
  readonly hasSingleWinner: boolean;
  /** Whether the duration of a match is recorded (FA-ER-10, E-43). */
  readonly tracksDuration: boolean;
};

/**
 * Returns the supported game with this id, or `undefined` for a custom game.
 */
export function findSupportedGame(gameId: GameId): SupportedGame | undefined {
  return SUPPORTED_GAMES.find((game) => game.id === gameId);
}

/**
 * Capabilities of a game, so the UI need not distinguish modules from custom games
 * (Architecture 5.1). For a custom game, pass its record: whether it counts points is its own
 * setting (FA-SP-07); without the record a custom game counts none. FA-SP-05: custom games have
 * no player colours; FA-ER-03, FA-ER-07, FA-ER-10: no edition, no mode, draws possible and no
 * duration; FA-ER-06, FA-ER-12: negative points and a ranking by hand are possible.
 */
export function gameCapabilities(
  gameId: GameId,
  customGame?: Pick<CustomGame, 'id' | 'scoring'>,
): GameCapabilities {
  const game = findSupportedGame(gameId);
  if (game === undefined) {
    assert(customGame === undefined || customGame.id === gameId, 'the record is of this game');
    return {
      isSupported: false,
      playerColors: null,
      scoring: customGame?.scoring ?? null,
      allowsNegativeScores: true,
      supportsRanking: true,
      editions: [],
      modes: [],
      hasSingleWinner: false,
      tracksDuration: false,
    };
  }
  return {
    isSupported: true,
    playerColors: game.playerColors,
    scoring: game.scoring,
    allowsNegativeScores: game.allowsNegativeScores,
    supportsRanking: game.supportsRanking,
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
