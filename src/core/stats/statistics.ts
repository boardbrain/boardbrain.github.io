import type { GameId, LocalDate, Match, MatchId, PersonId, ScoringDirection } from '@/core/model';
import { placesOf } from '@/core/results';

/**
 * What the statistics need to know about a game (Architecture 5.1): whether and how it counts
 * points, whether matches have a duration (Catan, FA-ER-10) and whether the best score is a
 * record (custom games with points, FA-ST-08).
 */
export type StatsGame = {
  readonly scoring: ScoringDirection | null;
  readonly tracksDuration: boolean;
  readonly recordsBestScore: boolean;
};

/**
 * The result of a match for one person in the form (FA-ST-02): won alone, part of a draw, or
 * neither.
 */
export type FormResult = 'win' | 'draw' | 'none';

/**
 * One match of the form: which match and its result for the person.
 */
export type FormEntry = {
  readonly matchId: MatchId;
  readonly result: FormResult;
};

/**
 * A run of matches in a row, e.g. a winning streak (Specification 3.8): its length, the first
 * and last match and whether it still runs with the latest match of the filter.
 */
export type MatchRun = {
  readonly length: number;
  readonly firstDate: LocalDate;
  readonly lastDate: LocalDate;
  readonly isOngoing: boolean;
};

/**
 * The game in which a person wins most often (FA-ST-09 (3)).
 */
export type FavoriteGame = {
  readonly gameId: GameId;
  readonly matchCount: number;
  readonly wins: number;
  readonly winRate: number;
};

/**
 * The key figures of one person in the filter (US-ST-01, US-ST-06, Specification 3.8).
 */
export type PersonStatistics = {
  readonly personId: PersonId;
  /** Matches won alone; a draw is no win (FA-ST-05). */
  readonly wins: number;
  readonly draws: number;
  /** Wins ÷ matches, from 0 to 1. */
  readonly winRate: number;
  /** Wins in a row up to the latest match; more than 0 for at most one person (E-57). */
  readonly currentStreak: number;
  readonly longestStreak: MatchRun | null;
  /** Matches since the last win; all matches without a win. */
  readonly drought: number;
  readonly longestDrought: MatchRun | null;
  /** The latest five matches, oldest first. */
  readonly form: readonly FormEntry[];
  /** Over matches with places, `null` without such matches (US-ST-01 AK-3). */
  readonly averagePlace: number | null;
  /** Over matches with points, only for a single game with points; else `null`. */
  readonly averageScore: number | null;
  /** Matches with places. */
  readonly placedMatches: number;
  /** How often a place was taken, without the matches as last (E-58). */
  readonly placeCounts: ReadonlyMap<number, number>;
  /** How often the person was last: the largest place of a match, unless all share place 1. */
  readonly lastCount: number;
  /** Only for all games (FA-ST-09 (3)). */
  readonly favoriteGame: FavoriteGame | null;
};

/**
 * A record that belongs to a run of matches of one person (FA-ST-08).
 */
export type RunRecord = MatchRun & { readonly personId: PersonId };

/**
 * A record that belongs to one match: its duration or a score (FA-ST-08).
 */
export type MatchRecord = {
  readonly matchId: MatchId;
  readonly date: LocalDate;
  /** The winners for a duration, the person with the score for the best score. */
  readonly personIds: readonly PersonId[];
  /** Minutes or points. */
  readonly value: number;
};

/**
 * The records of a group in the filter (US-ST-05); each missing without fitting matches.
 */
export type StatsRecords = {
  readonly longestStreak: RunRecord | null;
  readonly longestDrought: RunRecord | null;
  readonly longestMatch: MatchRecord | null;
  /** Only from two matches with a duration. */
  readonly shortestMatch: MatchRecord | null;
  readonly bestScore: MatchRecord | null;
};

/**
 * The statistics of a group in the filter (US-ST-01, US-ST-05, US-ST-06, Specification 3.8).
 */
export type GroupStatistics = {
  readonly matchCount: number;
  readonly firstDate: LocalDate | null;
  /** In the order of the participants. */
  readonly persons: readonly PersonStatistics[];
  readonly hasDraws: boolean;
  readonly placedMatchCount: number;
  /** Scoring of the single game in the filter, `null` for all games or a game without points. */
  readonly scoring: ScoringDirection | null;
  /** Only for a single game with a duration; `null` without durations. */
  readonly averageDuration: number | null;
  readonly tracksDuration: boolean;
  /** The person with at least two wins in a row up to the latest match (E-57). */
  readonly currentStreak: { readonly personId: PersonId; readonly length: number } | null;
  readonly records: StatsRecords;
};

/**
 * Number of matches a game needs before it can be a favourite game (E-59).
 */
export const FAVORITE_GAME_MIN_MATCHES = 5;

/**
 * Number of matches in the form (FA-ST-02).
 */
export const FORM_LENGTH = 5;

/**
 * Length from which the current winning streak is shown (E-57).
 */
export const SHOWN_STREAK_MIN = 2;

type Run = { length: number; from: number; to: number };

type Tally = {
  wins: number;
  draws: number;
  run: number;
  best: Run | null;
  dry: number;
  bestDry: Run | null;
  placeSum: number;
  placedMatches: number;
  placeCounts: Map<number, number>;
  lastCount: number;
  scoreSum: number;
  scoredMatches: number;
  form: FormEntry[];
  perGame: Map<GameId, { matches: number; wins: number; firstPlayed: number }>;
};

function newTally(): Tally {
  return {
    wins: 0,
    draws: 0,
    run: 0,
    best: null,
    dry: 0,
    bestDry: null,
    placeSum: 0,
    placedMatches: 0,
    placeCounts: new Map(),
    lastCount: 0,
    scoreSum: 0,
    scoredMatches: 0,
    form: [],
    perGame: new Map(),
  };
}

function toRun(run: Run | null, matches: readonly Match[], isOngoing: boolean): MatchRun | null {
  if (run === null) {
    return null;
  }
  const first = matches[run.from];
  const last = matches[run.to];
  if (first === undefined || last === undefined) {
    return null;
  }
  return { length: run.length, firstDate: first.date, lastDate: last.date, isOngoing };
}

// FA-ST-09 (3): the highest win rate over games with enough matches and at least one win; on a
// tie the game with more matches, then the one played first.
function favoriteOf(tally: Tally): FavoriteGame | null {
  const candidates = [...tally.perGame]
    .filter(([, game]) => game.matches >= FAVORITE_GAME_MIN_MATCHES && game.wins > 0)
    .map(([gameId, game]) => ({ gameId, ...game, winRate: game.wins / game.matches }))
    .toSorted(
      (a, b) => b.winRate - a.winRate || b.matches - a.matches || a.firstPlayed - b.firstPlayed,
    );
  const best = candidates[0];
  return best === undefined
    ? null
    : { gameId: best.gameId, matchCount: best.matches, wins: best.wins, winRate: best.winRate };
}

function countMatch(
  tally: Tally,
  personId: PersonId,
  match: Match,
  index: number,
  places: ReadonlyMap<PersonId, number> | null,
  lastPlace: number,
  isScoreCounted: boolean,
): void {
  const winners = match.winnerIds;
  const isSoleWinner = winners.length === 1 && winners[0] === personId;
  const isDraw = !isSoleWinner && winners.includes(personId);
  const game = tally.perGame.get(match.gameId) ?? { matches: 0, wins: 0, firstPlayed: index };
  tally.perGame.set(match.gameId, {
    ...game,
    matches: game.matches + 1,
    wins: game.wins + (isSoleWinner ? 1 : 0),
  });
  // Specification 3.8: losses and draws end a winning streak; a win ends the drought.
  if (isSoleWinner) {
    tally.wins++;
    tally.run++;
    tally.dry = 0;
    if (tally.best === null || tally.run > tally.best.length) {
      tally.best = { length: tally.run, from: index - tally.run + 1, to: index };
    }
  } else {
    tally.run = 0;
    tally.dry++;
    if (isDraw) {
      tally.draws++;
    }
    if (tally.bestDry === null || tally.dry > tally.bestDry.length) {
      tally.bestDry = { length: tally.dry, from: index - tally.dry + 1, to: index };
    }
  }
  tally.form.push({ matchId: match.id, result: isSoleWinner ? 'win' : isDraw ? 'draw' : 'none' });
  const place = places?.get(personId);
  if (place !== undefined) {
    tally.placeSum += place;
    tally.placedMatches++;
    // E-58: last is the largest place unless all share place 1; it counts only as last.
    if (lastPlace > 1 && place === lastPlace) {
      tally.lastCount++;
    } else {
      tally.placeCounts.set(place, (tally.placeCounts.get(place) ?? 0) + 1);
    }
  }
  const score = match.scores?.[personId];
  if (isScoreCounted && score !== undefined) {
    tally.scoreSum += score;
    tally.scoredMatches++;
  }
}

// The earliest of the longest runs over all persons (Specification 3.8: on a tie the one
// reached first).
function longestRun(
  entries: readonly { personId: PersonId; run: Run | null }[],
  matches: readonly Match[],
  isOngoingFor: (personId: PersonId, run: Run) => boolean,
): RunRecord | null {
  let best: { personId: PersonId; run: Run } | null = null;
  for (const { personId, run } of entries) {
    if (
      run !== null &&
      (best === null ||
        run.length > best.run.length ||
        (run.length === best.run.length && run.to < best.run.to))
    ) {
      best = { personId, run };
    }
  }
  if (best === null) {
    return null;
  }
  const run = toRun(best.run, matches, isOngoingFor(best.personId, best.run));
  return run === null ? null : { ...run, personId: best.personId };
}

// The match with the best value; on a tie the earlier one (Specification 3.8).
function pickMatch(
  matches: readonly Match[],
  valueOf: (match: Match) => number | undefined,
  isBetter: (a: number, b: number) => boolean,
): { match: Match; value: number } | null {
  let best: { match: Match; value: number } | null = null;
  for (const match of matches) {
    const value = valueOf(match);
    if (value !== undefined && (best === null || isBetter(value, best.value))) {
      best = { match, value };
    }
  }
  return best;
}

function bestScoreOf(
  matches: readonly Match[],
  participants: readonly PersonId[],
  scoring: ScoringDirection,
): MatchRecord | null {
  let best: MatchRecord | null = null;
  for (const match of matches) {
    for (const personId of participants) {
      const value = match.scores?.[personId];
      const isBetter =
        value !== undefined &&
        (best === null || (scoring === 'highest-wins' ? value > best.value : value < best.value));
      if (isBetter) {
        best = { matchId: match.id, date: match.date, personIds: [personId], value };
      }
    }
  }
  return best;
}

/**
 * Computes the statistics of a group from the matches in the filter (US-ST-01, US-ST-05,
 * US-ST-06, Specification 3.8). `matches` must be in chronological order (3.7); all members
 * took part in every match (E-41). `gameId` is the single game of the filter or `null` for all
 * games; points, durations and the best score count only for a single game (US-ST-03 AK-4).
 */
export function computeStatistics(
  matches: readonly Match[],
  participants: readonly PersonId[],
  gameId: GameId | null,
  gameOf: (gameId: GameId) => StatsGame,
): GroupStatistics {
  const single = gameId === null ? null : gameOf(gameId);
  const scoring = single?.scoring ?? null;
  const tallies = new Map(participants.map((personId) => [personId, newTally()]));
  let hasDraws = false;
  let placedMatchCount = 0;
  matches.forEach((match, index) => {
    const places = placesOf(match, participants, gameOf(match.gameId).scoring);
    if (match.winnerIds.length > 1) {
      hasDraws = true;
    }
    if (places !== null) {
      placedMatchCount++;
    }
    const lastPlace = places === null ? 0 : Math.max(...places.values());
    for (const personId of participants) {
      const tally = tallies.get(personId);
      if (tally !== undefined) {
        countMatch(tally, personId, match, index, places, lastPlace, scoring !== null);
      }
    }
  });
  const lastIndex = matches.length - 1;
  // A run still goes on if it ends with the latest match and has not been broken since.
  const isOngoing = (run: Run | null, current: number): boolean =>
    run !== null && run.to === lastIndex && current === run.length;
  const persons = participants.map((personId): PersonStatistics => {
    const tally = tallies.get(personId) ?? newTally();
    return {
      personId,
      wins: tally.wins,
      draws: tally.draws,
      winRate: matches.length === 0 ? 0 : tally.wins / matches.length,
      currentStreak: tally.run,
      longestStreak: toRun(tally.best, matches, isOngoing(tally.best, tally.run)),
      drought: tally.dry,
      longestDrought: toRun(tally.bestDry, matches, isOngoing(tally.bestDry, tally.dry)),
      form: tally.form.slice(-FORM_LENGTH),
      averagePlace: tally.placedMatches === 0 ? null : tally.placeSum / tally.placedMatches,
      averageScore: tally.scoredMatches === 0 ? null : tally.scoreSum / tally.scoredMatches,
      placedMatches: tally.placedMatches,
      placeCounts: tally.placeCounts,
      lastCount: tally.lastCount,
      favoriteGame: gameId === null ? favoriteOf(tally) : null,
    };
  });
  const runs = (key: 'best' | 'bestDry'): { personId: PersonId; run: Run | null }[] =>
    participants.map((personId) => ({ personId, run: tallies.get(personId)?.[key] ?? null }));
  const timed =
    single?.tracksDuration === true
      ? matches.filter((match) => match.durationMinutes !== undefined)
      : [];
  const duration = (match: Match): number | undefined => match.durationMinutes;
  const longest = pickMatch(timed, duration, (a, b) => a > b);
  const shortest = timed.length > 1 ? pickMatch(timed, duration, (a, b) => a < b) : null;
  const asRecord = (picked: { match: Match; value: number } | null): MatchRecord | null =>
    picked === null
      ? null
      : {
          matchId: picked.match.id,
          date: picked.match.date,
          personIds: picked.match.winnerIds,
          value: picked.value,
        };
  const holder = persons.find((person) => person.currentStreak >= SHOWN_STREAK_MIN);
  return {
    matchCount: matches.length,
    firstDate: matches[0]?.date ?? null,
    persons,
    hasDraws,
    placedMatchCount,
    scoring,
    averageDuration:
      timed.length === 0
        ? null
        : timed.reduce((sum, match) => sum + (match.durationMinutes ?? 0), 0) / timed.length,
    tracksDuration: single?.tracksDuration === true,
    currentStreak:
      holder === undefined ? null : { personId: holder.personId, length: holder.currentStreak },
    records: {
      longestStreak: longestRun(runs('best'), matches, (personId, run) =>
        isOngoing(run, tallies.get(personId)?.run ?? 0),
      ),
      longestDrought: longestRun(runs('bestDry'), matches, (personId, run) =>
        isOngoing(run, tallies.get(personId)?.dry ?? 0),
      ),
      longestMatch: asRecord(longest),
      shortestMatch: asRecord(shortest),
      bestScore:
        single?.recordsBestScore === true && scoring !== null
          ? bestScoreOf(matches, participants, scoring)
          : null,
    },
  };
}

/**
 * The number of matches per game, the most played first, on a tie the one played first
 * (FA-ST-09 (4)); `matches` in chronological order.
 */
export function matchesPerGame(
  matches: readonly Match[],
): readonly { readonly gameId: GameId; readonly matchCount: number }[] {
  const counts = new Map<GameId, number>();
  for (const match of matches) {
    counts.set(match.gameId, (counts.get(match.gameId) ?? 0) + 1);
  }
  return [...counts]
    .map(([id, matchCount], firstPlayed) => ({ gameId: id, matchCount, firstPlayed }))
    .toSorted((a, b) => b.matchCount - a.matchCount || a.firstPlayed - b.firstPlayed)
    .map(({ gameId: id, matchCount }) => ({ gameId: id, matchCount }));
}
