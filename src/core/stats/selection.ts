import type { GameId, LocalDate, Match } from '@/core/model';
import { sortMatches } from '@/core/results';
import { isInPeriod, type StatsPeriod } from './period';
import { matchesPerGame } from './statistics';

/**
 * How many calendar years the quick choice of the period offers: this year and the two before
 * (PO 26.11.2026); older years go through an own range.
 */
export const QUICK_YEAR_COUNT = 3;

/**
 * What the person asks to see (US-ST-03): one game or all (`null`), one edition or all (`null`)
 * and the period. The statistics take from it only what exists in the matches.
 */
export type StatsRequest = {
  readonly gameId: GameId | null;
  readonly edition: string | null;
  readonly period: StatsPeriod;
};

/**
 * A game with its number of matches in the period (FA-ST-06, FA-ST-09 (4)).
 */
export type GameMatchCount = {
  readonly gameId: GameId;
  readonly matchCount: number;
};

/**
 * The filter as it applies to a group (Specification 3.8, US-ST-03).
 */
export type StatsSelection = {
  /** Years with matches for the quick choice, newest first, at most this year and the two before (FA-ST-10). */
  readonly years: readonly number[];
  /** Games with matches in the period, the most played first, then the one played first. */
  readonly games: readonly GameMatchCount[];
  /** Whether a game can be chosen: only with more than one played game (FA-ST-06). */
  readonly canChooseGame: boolean;
  /** The game shown, or `null` for all games; with a single played game it is that one. */
  readonly gameId: GameId | null;
  /** Editions to choose from: only if the game was played in more than one (FA-ST-07). */
  readonly editions: readonly string[];
  /** The edition shown, or `null` for all. */
  readonly edition: string | null;
  /** The matches in the filter, oldest first (Specification 3.7). */
  readonly matches: readonly Match[];
};

function editionsOf(matches: readonly Match[]): string[] {
  return [
    ...new Set(matches.flatMap((match) => (match.edition === undefined ? [] : [match.edition]))),
  ];
}

/**
 * Applies the filter to the matches of a group (US-ST-03, FA-ST-06, FA-ST-07, FA-ST-10): first
 * the period, then the game and the edition. Only games played in the period can be chosen,
 * and only if there are several; a single game is fixed. Editions can be chosen only if the
 * game was played in more than one. A requested game or edition that does not exist falls back
 * to all.
 */
export function selectMatches(
  matches: readonly Match[],
  request: StatsRequest,
  today: LocalDate,
): StatsSelection {
  const chronological = sortMatches(matches);
  const oldestQuickYear = Number(today.slice(0, 4)) - QUICK_YEAR_COUNT + 1;
  const years = [...new Set(chronological.map((match) => Number(match.date.slice(0, 4))))]
    .filter((year) => year >= oldestQuickYear)
    .toSorted((a, b) => b - a);
  const inPeriod = chronological.filter((match) => isInPeriod(match.date, request.period, today));
  const games = matchesPerGame(inPeriod);
  const canChooseGame = games.length > 1;
  const onlyGame = games.length === 1 ? (games[0]?.gameId ?? null) : null;
  const requested = games.some((game) => game.gameId === request.gameId) ? request.gameId : null;
  const gameId = canChooseGame ? requested : onlyGame;
  const ofGame = gameId === null ? inPeriod : inPeriod.filter((match) => match.gameId === gameId);
  const playedEditions = gameId === null ? [] : editionsOf(ofGame);
  const editions = playedEditions.length > 1 ? playedEditions : [];
  const edition =
    request.edition !== null && editions.includes(request.edition) ? request.edition : null;
  return {
    years,
    games,
    canChooseGame,
    gameId,
    editions,
    edition,
    matches: edition === null ? ofGame : ofGame.filter((match) => match.edition === edition),
  };
}
