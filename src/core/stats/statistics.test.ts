import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { PersonId } from '@/core/model';
import { rankPersons, rankingCriteria } from './ranking';
import {
  ANNA,
  BEN,
  CARCASSONNE,
  CATAN,
  CLARA,
  DAVID,
  SKYJO,
  TABLE,
  UNO,
  gameOf,
  series,
} from '@tests/support/statsFakes';
import { computeStatistics, matchesPerGame, type PersonStatistics } from './statistics';

const FC_SEED = 20261125;

function personOf(persons: readonly PersonStatistics[], personId: PersonId): PersonStatistics {
  const person = persons.find((entry) => entry.personId === personId);
  if (person === undefined) {
    throw new Error('person missing');
  }
  return person;
}

describe('US-ST-01 key figures per person', () => {
  const matches = series([
    { winners: [ANNA] },
    { winners: [ANNA] },
    { winners: [BEN, CLARA] },
    { winners: [ANNA] },
    { winners: [DAVID] },
    { winners: [DAVID] },
  ]);
  const stats = computeStatistics(matches, TABLE, null, gameOf);

  it('AK-1: counts the matches once for the group and wins, rate, streaks, drought, form per person', () => {
    const anna = personOf(stats.persons, ANNA);

    expect(stats.matchCount).toBe(6);
    expect(stats.firstDate).toBe('2026-01-01');
    expect(anna.wins).toBe(3);
    expect(anna.winRate).toBeCloseTo(0.5);
    expect(anna.longestStreak).toEqual({
      length: 2,
      firstDate: '2026-01-01',
      lastDate: '2026-01-02',
      isOngoing: false,
    });
    expect(anna.drought).toBe(2);
    expect(personOf(stats.persons, DAVID).currentStreak).toBe(2);
    expect(personOf(stats.persons, CLARA).form.map((entry) => entry.result)).toEqual([
      'none',
      'draw',
      'none',
      'none',
      'none',
    ]);
  });

  it('AK-1: keeps at most the latest five matches in the form, oldest first', () => {
    expect(personOf(stats.persons, ANNA).form.map((entry) => entry.result)).toEqual([
      'win',
      'none',
      'win',
      'none',
      'none',
    ]);
  });

  it('AK-2: counts a draw as a draw, not a win, and ends the winning streak', () => {
    const ben = personOf(stats.persons, BEN);

    expect(ben.wins).toBe(0);
    expect(ben.draws).toBe(1);
    expect(stats.hasDraws).toBe(true);
    const drawn = computeStatistics(
      series([{ winners: [ANNA] }, { winners: [ANNA, BEN] }, { winners: [ANNA] }]),
      TABLE,
      null,
      gameOf,
    );
    expect(personOf(drawn.persons, ANNA).longestStreak?.length).toBe(1);
    expect(personOf(drawn.persons, ANNA).drought).toBe(0);
  });

  it('AK-3: averages points, places and duration only over matches that have them', () => {
    const catan = computeStatistics(
      series([
        { game: CATAN, winners: [ANNA], scores: [10, 8, 7, 5], duration: 90 },
        { game: CATAN, winners: [BEN] },
        { game: CATAN, winners: [ANNA], scores: [12, 9, 9, 4], duration: 120 },
        { game: CATAN, winners: [CLARA], places: [2, 4, 1, 3] },
      ]),
      TABLE,
      CATAN,
      gameOf,
    );
    const anna = personOf(catan.persons, ANNA);

    expect(anna.averageScore).toBeCloseTo(11);
    expect(anna.averagePlace).toBeCloseTo((1 + 1 + 2) / 3);
    expect(anna.placedMatches).toBe(3);
    expect(catan.averageDuration).toBeCloseTo(105);
    expect(catan.tracksDuration).toBe(true);
  });

  it('AK-3: gives no averages without fitting matches', () => {
    const plain = computeStatistics(series([{ winners: [ANNA] }]), TABLE, UNO, gameOf);

    expect(personOf(plain.persons, ANNA).averagePlace).toBeNull();
    expect(personOf(plain.persons, ANNA).averageScore).toBeNull();
    expect(plain.averageDuration).toBeNull();
    expect(plain.placedMatchCount).toBe(0);
  });

  it('AK-4: has no figures without matches', () => {
    const empty = computeStatistics([], TABLE, null, gameOf);

    expect(empty.matchCount).toBe(0);
    expect(empty.firstDate).toBeNull();
    expect(personOf(empty.persons, ANNA).winRate).toBe(0);
    expect(empty.currentStreak).toBeNull();
  });

  it('AK-6: shows the current series from two wins in a row, for one person only (E-57)', () => {
    expect(stats.currentStreak).toEqual({ personId: DAVID, length: 2 });
    const single = computeStatistics(
      series([{ winners: [BEN] }, { winners: [ANNA] }]),
      TABLE,
      null,
      gameOf,
    );
    expect(single.currentStreak).toBeNull();
    const drawLast = computeStatistics(
      series([{ winners: [ANNA] }, { winners: [ANNA] }, { winners: [ANNA, BEN] }]),
      TABLE,
      null,
      gameOf,
    );
    expect(drawLast.currentStreak).toBeNull();
  });
});

describe('US-ST-03 AK-4 several games in the filter', () => {
  const mixed = series([
    { game: CATAN, winners: [ANNA], scores: [10, 8, 7, 5], duration: 90 },
    { game: SKYJO, winners: [BEN], scores: [30, 12, 40, 50] },
  ]);
  const stats = computeStatistics(mixed, TABLE, null, gameOf);

  it('shows no average points, no average duration and no records of single games', () => {
    expect(personOf(stats.persons, ANNA).averageScore).toBeNull();
    expect(stats.averageDuration).toBeNull();
    expect(stats.records.longestMatch).toEqual([]);
    expect(stats.records.bestScore).toEqual([]);
  });

  it('keeps the average place over all games (E-45)', () => {
    expect(personOf(stats.persons, BEN).averagePlace).toBeCloseTo(1.5);
  });
});

describe('US-ST-05 records', () => {
  it('AK-1: the eternal streak lists every longest streak, the one reached first first', () => {
    const stats = computeStatistics(
      series([
        { winners: [BEN] },
        { winners: [BEN] },
        { winners: [ANNA] },
        { winners: [ANNA] },
        { winners: [CLARA] },
      ]),
      TABLE,
      null,
      gameOf,
    );

    expect(stats.records.longestStreak).toEqual([
      {
        personId: BEN,
        length: 2,
        firstDate: '2026-01-01',
        lastDate: '2026-01-02',
        isOngoing: false,
      },
      {
        personId: ANNA,
        length: 2,
        firstDate: '2026-01-03',
        lastDate: '2026-01-04',
        isOngoing: false,
      },
    ]);
  });

  it('AK-1: the same person can hold an equal record twice', () => {
    const stats = computeStatistics(
      series([
        { winners: [ANNA] },
        { winners: [ANNA] },
        { winners: [BEN] },
        { winners: [ANNA] },
        { winners: [ANNA] },
      ]),
      TABLE,
      null,
      gameOf,
    );

    expect(stats.records.longestStreak.map((run) => [run.personId, run.isOngoing])).toEqual([
      [ANNA, false],
      [ANNA, true],
    ]);
  });

  it('AK-1: one win is no streak and one match without a win no drought worth a record', () => {
    // Twelve at a table after one match: no eleven droughts of one (PO 26.11.2026).
    const one = computeStatistics(series([{ winners: [ANNA] }]), TABLE, null, gameOf);
    expect(one.records.longestStreak).toEqual([]);
    expect(one.records.longestDrought).toEqual([]);
  });

  it('AK-1: every longest drought with person and span, ongoing if it still runs', () => {
    const stats = computeStatistics(
      series([{ winners: [DAVID] }, { winners: [ANNA] }, { winners: [ANNA] }, { winners: [ANNA] }]),
      TABLE,
      null,
      gameOf,
    );

    expect(stats.records.longestDrought).toEqual([
      {
        personId: BEN,
        length: 4,
        firstDate: '2026-01-01',
        lastDate: '2026-01-04',
        isOngoing: true,
      },
      {
        personId: CLARA,
        length: 4,
        firstDate: '2026-01-01',
        lastDate: '2026-01-04',
        isOngoing: true,
      },
    ]);
    expect(stats.records.longestStreak.map((run) => run.isOngoing)).toEqual([true]);
    expect(personOf(stats.persons, ANNA).longestStreak?.isOngoing).toBe(true);
  });

  it('AK-2: every longest and every shortest Catan match; the shortest from two with duration', () => {
    const two = series([
      { game: CATAN, winners: [ANNA], duration: 80 },
      { game: CATAN, winners: [BEN], duration: 140 },
      { game: CATAN, winners: [CLARA], duration: 80 },
      { game: CATAN, winners: [DAVID] },
    ]);
    const stats = computeStatistics(two, TABLE, CATAN, gameOf);

    expect(stats.records.longestMatch).toMatchObject([{ value: 140, personIds: [BEN] }]);
    expect(stats.records.shortestMatch).toMatchObject([
      { value: 80, personIds: [ANNA], date: '2026-01-01' },
      { value: 80, personIds: [CLARA], date: '2026-01-03' },
    ]);
    const one = computeStatistics(two.slice(0, 1), TABLE, CATAN, gameOf);
    expect(one.records.longestMatch.map((record) => record.value)).toEqual([80]);
    expect(one.records.shortestMatch).toEqual([]);
    // All matches equally long: they are the longest, not also the shortest.
    const same = computeStatistics(
      [two[0], two[2]].flatMap((m) => m ?? []),
      TABLE,
      CATAN,
      gameOf,
    );
    expect(same.records.longestMatch).toHaveLength(2);
    expect(same.records.shortestMatch).toEqual([]);
  });

  it('AK-4: a record without fitting matches is missing', () => {
    const stats = computeStatistics(
      series([{ winners: [ANNA, BEN] }, { winners: [ANNA, BEN] }]),
      TABLE,
      UNO,
      gameOf,
    );

    expect(stats.records.longestStreak).toEqual([]);
    expect(stats.records.longestMatch).toEqual([]);
    expect(stats.records.bestScore).toEqual([]);
    expect(stats.records.longestDrought.map((run) => run.personId)).toEqual([
      ANNA,
      BEN,
      CLARA,
      DAVID,
    ]);
  });

  it('AK-5: the best score of a custom game, the lowest if the fewest points win, every holder', () => {
    const skyjo = series([
      { game: SKYJO, winners: [CLARA], scores: [20, 30, 8, 40] },
      { game: SKYJO, winners: [ANNA], scores: [8, 20, 30, 40] },
    ]);
    const stats = computeStatistics(skyjo, TABLE, SKYJO, gameOf);

    expect(stats.records.bestScore).toMatchObject([
      { value: 8, personIds: [CLARA], date: '2026-01-01' },
      { value: 8, personIds: [ANNA], date: '2026-01-02' },
    ]);
    const carcassonne = computeStatistics(
      series([{ game: CARCASSONNE, winners: [DAVID, BEN], scores: [80, 120, 70, 120] }]),
      TABLE,
      CARCASSONNE,
      gameOf,
    );
    expect(carcassonne.records.bestScore).toMatchObject([{ value: 120, personIds: [BEN, DAVID] }]);
    const catan = computeStatistics(
      series([{ game: CATAN, winners: [ANNA], scores: [10, 5, 5, 5] }]),
      TABLE,
      CATAN,
      gameOf,
    );
    expect(catan.records.bestScore).toEqual([]);
  });
});

describe('US-ST-06 places and games', () => {
  it('AK-1, AK-2: counts places and the last place apart, without double counting (E-58)', () => {
    const stats = computeStatistics(
      series([
        { game: SKYJO, winners: [ANNA], scores: [5, 10, 20, 30] },
        { game: SKYJO, winners: [BEN], scores: [30, 5, 30, 10] },
        { winners: [ANNA, BEN], places: [1, 1, 1, 1] },
      ]),
      TABLE,
      null,
      gameOf,
    );
    const anna = personOf(stats.persons, ANNA);
    const clara = personOf(stats.persons, CLARA);

    expect(anna.placeCounts.get(1)).toBe(2);
    // Anna and Clara share the last place 3 in the second match.
    expect(anna.lastCount).toBe(1);
    expect(clara.lastCount).toBe(1);
    expect(clara.placeCounts.get(3)).toBe(1);
    expect(personOf(stats.persons, DAVID).lastCount).toBe(1);
    // Everybody on place 1: nobody is last.
    expect(anna.placedMatches).toBe(3);
  });

  it('AK-3: the favourite game needs five matches and a win; ties by matches, then first played', () => {
    const many = series([
      ...Array.from({ length: 5 }, () => ({ game: SKYJO, winners: [ANNA] as PersonId[] })),
      ...Array.from({ length: 4 }, () => ({ game: CARCASSONNE, winners: [ANNA] as PersonId[] })),
      ...Array.from({ length: 6 }, () => ({ game: UNO, winners: [BEN] as PersonId[] })),
    ]);
    const stats = computeStatistics(many, TABLE, null, gameOf);

    expect(personOf(stats.persons, ANNA).favoriteGame).toEqual({
      gameId: SKYJO,
      matchCount: 5,
      wins: 5,
      winRate: 1,
    });
    expect(personOf(stats.persons, BEN).favoriteGame?.gameId).toBe(UNO);
    expect(personOf(stats.persons, CLARA).favoriteGame).toBeNull();
    expect(computeStatistics(many, TABLE, SKYJO, gameOf).persons[0]?.favoriteGame).toBeNull();
  });

  it('AK-3: on an equal rate and count the game played first', () => {
    const tie = series([
      ...Array.from({ length: 5 }, () => ({ game: UNO, winners: [ANNA] as PersonId[] })),
      ...Array.from({ length: 5 }, () => ({ game: SKYJO, winners: [ANNA] as PersonId[] })),
    ]);

    expect(computeStatistics(tie, TABLE, null, gameOf).persons[0]?.favoriteGame?.gameId).toBe(UNO);
  });

  it('AK-4: counts the matches per game, the most played first, on a tie the one played first', () => {
    const matches = series([
      { game: UNO, winners: [ANNA] },
      { game: SKYJO, winners: [ANNA] },
      { game: CATAN, winners: [ANNA] },
      { game: CATAN, winners: [ANNA] },
    ]);

    expect(matchesPerGame(matches)).toEqual([
      { gameId: CATAN, matchCount: 2 },
      { gameId: UNO, matchCount: 1 },
      { gameId: SKYJO, matchCount: 1 },
    ]);
  });
});

describe('Specification 3.8 invariants (property tests)', () => {
  const games = [CATAN, SKYJO, UNO, CARCASSONNE] as const;
  const matchArb = fc.record({
    game: fc.constantFrom(...games),
    winnerSeats: fc.uniqueArray(fc.integer({ min: 0, max: 3 }), { minLength: 1, maxLength: 2 }),
    scores: fc.option(fc.array(fc.integer({ min: -5, max: 20 }), { minLength: 4, maxLength: 4 })),
  });
  const listArb = fc.array(matchArb, { maxLength: 40 });

  it('holds for any list of matches', () => {
    fc.assert(
      fc.property(listArb, (list) => {
        const matches = series(
          list.map((entry) => {
            const isCatan = entry.game === CATAN;
            const seats = isCatan ? entry.winnerSeats.slice(0, 1) : entry.winnerSeats;
            const winners = seats.flatMap((seat) => TABLE.slice(seat, seat + 1));
            return entry.scores === null || entry.game === UNO
              ? { game: entry.game, winners }
              : { game: entry.game, winners, scores: entry.scores };
          }),
        );
        for (const gameId of [null, ...games]) {
          const filtered = gameId === null ? matches : matches.filter((m) => m.gameId === gameId);
          const stats = computeStatistics(filtered, TABLE, gameId, gameOf);
          const wins = stats.persons.reduce((sum, person) => sum + person.wins, 0);
          const draws = filtered.filter((m) => m.winnerIds.length > 1).length;
          expect(wins + draws).toBe(filtered.length);
          expect(
            stats.persons.filter((person) => person.currentStreak > 0).length,
          ).toBeLessThanOrEqual(1);
          for (const person of stats.persons) {
            expect(person.currentStreak).toBeLessThanOrEqual(person.longestStreak?.length ?? 0);
            expect(person.currentStreak === 0 || person.drought === 0).toBe(true);
            const counted = [...person.placeCounts.values()].reduce((sum, n) => sum + n, 0);
            expect(counted + person.lastCount).toBe(person.placedMatches);
            expect(person.form.length).toBe(Math.min(5, filtered.length));
            const place = person.averagePlace ?? 1;
            expect(place).toBeGreaterThanOrEqual(1);
            expect(place).toBeLessThanOrEqual(TABLE.length);
          }
          for (const criterion of rankingCriteria(stats)) {
            const ranked = rankPersons(stats, criterion);
            expect(new Set(ranked.map((entry) => entry.person.personId)).size).toBe(TABLE.length);
            expect(ranked[0]?.rank).toBe(1);
            ranked.forEach((entry, index) => {
              expect(entry.rank).toBeLessThanOrEqual(index + 1);
              expect(entry.rank).toBeGreaterThanOrEqual(ranked[index - 1]?.rank ?? 1);
            });
          }
        }
      }),
      { seed: FC_SEED, numRuns: 300 },
    );
  });
});
