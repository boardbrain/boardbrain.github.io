import type { GameId, LocalDate, Match } from '@/core/model';

/**
 * How often a game was played and on which day last (design I3-B: the cards of the game list
 * and the games page show both; the list can be sorted by the last day, US-SP-01).
 */
export type PlayedGame = {
  readonly matches: number;
  readonly lastDate: LocalDate;
};

/**
 * The played games of all tables: number of matches and the latest day per game. A game
 * without matches is missing.
 */
export function playedGames(
  matches: readonly Pick<Match, 'gameId' | 'date'>[],
): ReadonlyMap<GameId, PlayedGame> {
  const played = new Map<GameId, PlayedGame>();
  for (const { gameId, date } of matches) {
    const known = played.get(gameId);
    played.set(gameId, {
      matches: (known?.matches ?? 0) + 1,
      // `YYYY-MM-DD` compares like the days it names.
      lastDate: known === undefined || date > known.lastDate ? date : known.lastDate,
    });
  }
  return played;
}
