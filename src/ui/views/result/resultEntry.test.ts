import { describe, expect, it } from 'vitest';
import { toPersonId, type PersonId } from '@/core/model';
import type { ResultRules } from '@/core/results';
import {
  deriveEntry,
  isEntryComplete,
  isPlaceSkipped,
  NO_ENTRIES,
  outcomeOf,
  provisionalPlace,
  rowOrder,
  setPlace,
  setPoints,
  toggleWinner,
  type WayEntries,
} from './resultEntry';

const ANNA = toPersonId('00000000-0000-4000-8000-0000000000a1');
const BEN = toPersonId('00000000-0000-4000-8000-0000000000a2');
const CLARA = toPersonId('00000000-0000-4000-8000-0000000000a3');
const TABLE: readonly PersonId[] = [ANNA, BEN, CLARA];

const CATAN: ResultRules = {
  editions: ['base', 'cities-and-knights'],
  modes: ['standard'],
  hasSingleWinner: true,
  scoring: 'highest-wins',
  allowsNegativeScores: false,
  supportsRanking: true,
  playerColors: ['red', 'blue', 'white', 'orange'],
  tracksDuration: true,
};
const SKYJO: ResultRules = {
  editions: [],
  modes: [],
  hasSingleWinner: false,
  scoring: 'lowest-wins',
  allowsNegativeScores: true,
  supportsRanking: true,
  playerColors: null,
  tracksDuration: false,
};
const WIZARD: ResultRules = { ...SKYJO, scoring: 'highest-wins' };

function typed(
  rules: ResultRules,
  points: readonly [PersonId, string][],
  start: WayEntries = NO_ENTRIES,
): WayEntries {
  return points.reduce(
    (entries, [personId, text]) => setPoints(entries, personId, text, TABLE, rules),
    start,
  );
}

describe('US-ER-02 points in the result form (design I3-B A2)', () => {
  it('AK-6: with every score the best wins, no choice', () => {
    const entries = typed(SKYJO, [
      [ANNA, '12'],
      [BEN, '-3'],
      [CLARA, '40'],
    ]);
    const derived = deriveEntry('points', entries, TABLE, SKYJO);

    expect(derived.winners).toEqual([BEN]);
    expect(derived.places).toEqual(
      new Map([
        [ANNA, 2],
        [BEN, 1],
        [CLARA, 3],
      ]),
    );
    expect(isEntryComplete(derived)).toBe(true);
    expect(outcomeOf('points', derived, TABLE)).toEqual({
      winnerIds: [BEN],
      scores: { [ANNA]: 12, [BEN]: -3, [CLARA]: 40 },
    });
  });

  it('AK-6: a tie at the top starts as a draw of the best in a custom game, a choice remains', () => {
    const entries = typed(WIZARD, [
      [ANNA, '80'],
      [BEN, '80'],
      [CLARA, '20'],
    ]);

    expect(deriveEntry('points', entries, TABLE, WIZARD).winners).toEqual([ANNA, BEN]);
    const one = toggleWinner(entries, BEN, WIZARD);
    expect(deriveEntry('points', one, TABLE, WIZARD).winners).toEqual([ANNA]);
    // Only the best can win: Clara's trophy does not count.
    const wrong = toggleWinner(one, CLARA, WIZARD);
    expect(deriveEntry('points', wrong, TABLE, WIZARD).winners).toEqual([ANNA]);
  });

  it('AK-6: a winner chosen at a tie stays when a lower score is corrected', () => {
    const tie = typed(WIZARD, [
      [ANNA, '80'],
      [BEN, '80'],
      [CLARA, '20'],
    ]);
    const chosen = toggleWinner(tie, BEN, WIZARD);
    const corrected = setPoints(chosen, CLARA, '25', TABLE, WIZARD);

    expect(deriveEntry('points', corrected, TABLE, WIZARD).winners).toEqual([ANNA]);
    // A new tie starts again with all of the best.
    const newTie = setPoints(corrected, CLARA, '80', TABLE, WIZARD);
    expect(deriveEntry('points', newTie, TABLE, WIZARD).winners).toEqual([ANNA, BEN, CLARA]);
  });

  it('AK-6: a tie at the top in Catan asks for one winner', () => {
    const entries = typed(CATAN, [
      [ANNA, '10'],
      [BEN, '10'],
      [CLARA, '7'],
    ]);
    const derived = deriveEntry('points', entries, TABLE, CATAN);

    expect(derived.winners).toEqual([]);
    expect(derived.missing).toBe('winner');
    const chosen = deriveEntry('points', toggleWinner(entries, BEN, CATAN), TABLE, CATAN);
    expect(chosen.winners).toEqual([BEN]);
    expect(isEntryComplete(chosen)).toBe(true);
  });

  it('AK-6: in a custom game every score is required in the way of points', () => {
    expect(deriveEntry('points', NO_ENTRIES, TABLE, SKYJO).missing).toBe('points');
    const some = typed(SKYJO, [[ANNA, '3']]);
    expect(deriveEntry('points', some, TABLE, SKYJO).missing).toBe('points');
  });

  it('E-49: Catan needs every victory point in the way of points, like a custom game', () => {
    expect(deriveEntry('points', NO_ENTRIES, TABLE, CATAN).missing).toBe('points');
  });

  it('a game without a ranking by hand chooses the winner by hand without points', () => {
    const noRanking = { ...CATAN, supportsRanking: false };
    const chosen = toggleWinner(NO_ENTRIES, CLARA, noRanking);
    const derived = deriveEntry('points', chosen, TABLE, noRanking);

    expect(derived.winners).toEqual([CLARA]);
    expect(outcomeOf('points', derived, TABLE)).toEqual({ winnerIds: [CLARA] });
  });

  it('AK-2: points for only some are missing points (US-ER-02 AK-2)', () => {
    const entries = typed(CATAN, [[ANNA, '10']]);

    expect(deriveEntry('points', entries, TABLE, CATAN).missing).toBe('points');
  });

  it('AK-3: wrong points are marked, also beyond 99 999 (US-ER-01 AK-8)', () => {
    const catan = typed(CATAN, [
      [ANNA, '-1'],
      [BEN, '7.5'],
      [CLARA, '100000'],
    ]);
    expect(deriveEntry('points', catan, TABLE, CATAN).badPoints).toEqual([ANNA, BEN, CLARA]);
    const skyjo = typed(SKYJO, [
      [ANNA, '-99999'],
      [BEN, 'x'],
    ]);
    expect(deriveEntry('points', skyjo, TABLE, SKYJO).badPoints).toEqual([BEN]);
  });

  it('G3: a provisional place while points are missing', () => {
    const entries = typed(SKYJO, [
      [ANNA, '12'],
      [BEN, '3'],
    ]);
    const derived = deriveEntry('points', entries, TABLE, SKYJO);

    expect(provisionalPlace(derived, ANNA, SKYJO)).toBe(2);
    expect(provisionalPlace(derived, BEN, SKYJO)).toBe(1);
    expect(provisionalPlace(derived, CLARA, SKYJO)).toBeNull();
  });

  it('rows move to their place, persons without points last', () => {
    expect(rowOrder(TABLE, { [ANNA]: '12', [CLARA]: '3' }, SKYJO)).toEqual([CLARA, ANNA, BEN]);
    expect(rowOrder(TABLE, { [ANNA]: '12', [CLARA]: '3' }, WIZARD)).toEqual([ANNA, CLARA, BEN]);
  });
});

describe('US-ER-06 "Sieger oder Rangfolge" in the result form (design I3-B M3)', () => {
  it('AK-3: the winners alone are enough, stored without places', () => {
    const entries = setPlace(NO_ENTRIES, BEN, 1, SKYJO);
    const derived = deriveEntry('places', entries, TABLE, SKYJO);

    expect(isEntryComplete(derived)).toBe(true);
    expect(outcomeOf('places', derived, TABLE)).toEqual({ winnerIds: [BEN] });
  });

  it('AK-2: further places for everyone or for nobody', () => {
    const partly = setPlace(setPlace(NO_ENTRIES, BEN, 1, SKYJO), ANNA, 2, SKYJO);
    expect(deriveEntry('places', partly, TABLE, SKYJO).missing).toBe('places');

    const all = setPlace(partly, CLARA, 3, SKYJO);
    const derived = deriveEntry('places', all, TABLE, SKYJO);
    expect(isEntryComplete(derived)).toBe(true);
    expect(outcomeOf('places', derived, TABLE)).toEqual({
      winnerIds: [BEN],
      places: { [ANNA]: 2, [BEN]: 1, [CLARA]: 3 },
    });
  });

  it('AK-2: shared places skip the next (1, 1, 3); a wrong skip is marked', () => {
    const shared = setPlace(setPlace(NO_ENTRIES, ANNA, 1, SKYJO), BEN, 1, SKYJO);
    const places = deriveEntry('places', shared, TABLE, SKYJO).places;

    expect(isPlaceSkipped(places, CLARA, 2)).toBe(true);
    expect(isPlaceSkipped(places, CLARA, 3)).toBe(false);
    const wrong = setPlace(shared, CLARA, 2, SKYJO);
    expect(deriveEntry('places', wrong, TABLE, SKYJO).isRankingWrong).toBe(true);
  });

  it('without a winner the winner is missing; tapping a place again removes it', () => {
    expect(deriveEntry('places', NO_ENTRIES, TABLE, SKYJO).missing).toBe('winner');
    const again = setPlace(setPlace(NO_ENTRIES, ANNA, 1, SKYJO), ANNA, 1, SKYJO);
    expect(again.places).toEqual({});
  });
});

describe('E-49 Catan with "Sieger oder Rangfolge"', () => {
  it('a new person on place 1 takes it, so there is exactly one winner', () => {
    const first = setPlace(NO_ENTRIES, ANNA, 1, CATAN);
    const taken = setPlace(first, BEN, 1, CATAN);
    const derived = deriveEntry('places', taken, TABLE, CATAN);

    expect(derived.winners).toEqual([BEN]);
    expect(outcomeOf('places', derived, TABLE)).toEqual({ winnerIds: [BEN] });
  });

  it('a whole ranking with shared second places', () => {
    const ranked = [
      [BEN, 1],
      [ANNA, 2],
      [CLARA, 2],
    ] as const;
    const entries = ranked.reduce(
      (current, [personId, place]) => setPlace(current, personId, place, CATAN),
      NO_ENTRIES,
    );
    const derived = deriveEntry('places', entries, TABLE, CATAN);

    expect(isEntryComplete(derived)).toBe(true);
    expect(outcomeOf('places', derived, TABLE)).toEqual({
      winnerIds: [BEN],
      places: { [ANNA]: 2, [BEN]: 1, [CLARA]: 2 },
    });
  });
});
