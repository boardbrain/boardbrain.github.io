import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { toPersonId, type PersonId, type ScoringDirection } from '@/core/model';
import {
  durationMinutesOf,
  placesOf,
  plausibilityWarnings,
  suggestedWinners,
  winnersOfRanking,
} from './evaluation';

const FC_SEED = 20261115;
const ANNA = toPersonId('00000000-0000-4000-8000-0000000000a1');
const BEN = toPersonId('00000000-0000-4000-8000-0000000000a2');
const CLARA = toPersonId('00000000-0000-4000-8000-0000000000a3');
const DAVID = toPersonId('00000000-0000-4000-8000-0000000000a4');
const TABLE: readonly PersonId[] = [ANNA, BEN, CLARA, DAVID];

function points(anna: number, ben: number, clara: number, david: number): Record<PersonId, number> {
  return { [ANNA]: anna, [BEN]: ben, [CLARA]: clara, [DAVID]: david };
}

describe('US-ER-02 AK-4 plausibility warnings', () => {
  it('warns nothing for a winner with the highest score', () => {
    expect(
      plausibilityWarnings(
        { winnerIds: [ANNA], scores: points(10, 8, 8, 6) },
        TABLE,
        'highest-wins',
      ),
    ).toEqual([]);
  });

  it('warns nothing without points or for a game without points', () => {
    expect(plausibilityWarnings({ winnerIds: [BEN] }, TABLE, 'highest-wins')).toEqual([]);
    expect(
      plausibilityWarnings({ winnerIds: [BEN], scores: points(10, 8, 8, 6) }, TABLE, null),
    ).toEqual([]);
  });

  it('warns if a winner does not have the highest score', () => {
    expect(
      plausibilityWarnings(
        { winnerIds: [BEN], scores: points(10, 8, 8, 6) },
        TABLE,
        'highest-wins',
      ),
    ).toEqual(['winner-not-best']);
  });

  it('warns if a winner does not have the lowest score when the fewest points win (FA-SP-07)', () => {
    expect(
      plausibilityWarnings(
        { winnerIds: [DAVID], scores: points(10, 8, 8, 6) },
        TABLE,
        'lowest-wins',
      ),
    ).toEqual([]);
    expect(
      plausibilityWarnings(
        { winnerIds: [ANNA], scores: points(10, 8, 8, 6) },
        TABLE,
        'lowest-wins',
      ),
    ).toEqual(['winner-not-best']);
  });

  it('warns nothing for a draw of winners with the same, best score', () => {
    expect(
      plausibilityWarnings(
        { winnerIds: [ANNA, BEN], scores: points(9, 9, 8, 6) },
        TABLE,
        'highest-wins',
      ),
    ).toEqual([]);
  });

  it('warns if winners of a draw have different scores', () => {
    expect(
      plausibilityWarnings(
        { winnerIds: [ANNA, BEN], scores: points(10, 8, 8, 6) },
        TABLE,
        'highest-wins',
      ),
    ).toEqual(['winner-not-best', 'winners-differ']);
  });
});

describe('US-ER-02 AK-6 suggested winners', () => {
  it('suggests the person with the best score once every participant has points', () => {
    expect(suggestedWinners(points(10, 8, 8, 6), TABLE, 'highest-wins', true)).toEqual([ANNA]);
    expect(suggestedWinners(points(10, 8, 8, 6), TABLE, 'lowest-wins', false)).toEqual([DAVID]);
  });

  it('suggests a draw of all persons with the best score in a game with draws', () => {
    expect(suggestedWinners(points(3, 9, 3, 6), TABLE, 'lowest-wins', false)).toEqual([
      ANNA,
      CLARA,
    ]);
  });

  it('suggests nobody for a tie at the top in a game with exactly one winner', () => {
    expect(suggestedWinners(points(9, 9, 8, 6), TABLE, 'highest-wins', true)).toEqual([]);
  });

  it('suggests nobody while points are missing', () => {
    expect(suggestedWinners({ [ANNA]: 10, [BEN]: 8 }, TABLE, 'highest-wins', false)).toEqual([]);
  });
});

describe('US-ER-06 AK-3 winners of a ranking', () => {
  it('are the persons on place 1', () => {
    expect(winnersOfRanking(points(2, 1, 4, 2), TABLE)).toEqual([BEN]);
    expect(winnersOfRanking(points(1, 3, 1, 4), TABLE)).toEqual([ANNA, CLARA]);
  });

  it('are nobody while nobody is on place 1', () => {
    expect(winnersOfRanking({ [ANNA]: 2 }, TABLE)).toEqual([]);
  });
});

describe('US-ER-02 AK-5 places from points (FA-ER-11)', () => {
  it('10, 8, 8, 6 points give the places 1, 2, 2, 4', () => {
    const places = placesOf(
      { winnerIds: [ANNA], scores: points(10, 8, 8, 6) },
      TABLE,
      'highest-wins',
    );

    expect(places).toEqual(
      new Map([
        [ANNA, 1],
        [BEN, 2],
        [CLARA, 2],
        [DAVID, 4],
      ]),
    );
  });

  it('when the fewest points win, 6, 8, 8, 10 points give the places 1, 2, 2, 4 (FA-SP-07)', () => {
    const places = placesOf(
      { winnerIds: [DAVID], scores: points(10, 8, 8, 6) },
      TABLE,
      'lowest-wins',
    );

    expect(places).toEqual(
      new Map([
        [ANNA, 4],
        [BEN, 2],
        [CLARA, 2],
        [DAVID, 1],
      ]),
    );
  });

  it('the winner keeps place 1 even without the best score after the warning', () => {
    const places = placesOf(
      { winnerIds: [DAVID], scores: points(10, 8, 8, 6) },
      TABLE,
      'highest-wins',
    );

    expect(places).toEqual(
      new Map([
        [ANNA, 2],
        [BEN, 3],
        [CLARA, 3],
        [DAVID, 1],
      ]),
    );
  });

  it('gives no places without points and ranking, or for a game without points', () => {
    expect(placesOf({ winnerIds: [ANNA] }, TABLE, 'highest-wins')).toBeNull();
    expect(placesOf({ winnerIds: [ANNA], scores: points(10, 8, 8, 6) }, TABLE, null)).toBeNull();
  });

  it('has place 1 for the winner, and a place k is shared by persons with the same score (property)', () => {
    const score = fc.integer({ min: -20, max: 20 });
    fc.assert(
      fc.property(
        fc.tuple(score, score, score, score),
        fc.constantFrom(...TABLE),
        fc.constantFrom<ScoringDirection>('highest-wins', 'lowest-wins'),
        ([a, b, c, d], winner, scoring) => {
          const scores = points(a, b, c, d);
          const places = placesOf({ winnerIds: [winner], scores }, TABLE, scoring);
          if (places === null) return false;
          const others = TABLE.filter((personId) => personId !== winner);
          const better = (x: number, y: number): boolean =>
            scoring === 'highest-wins' ? x > y : x < y;
          return (
            places.get(winner) === 1 &&
            others.every((personId) => {
              const place = places.get(personId) ?? 0;
              const ahead = others.filter((other) =>
                better(scores[other] ?? 0, scores[personId] ?? 0),
              ).length;
              return place === 2 + ahead;
            })
          );
        },
      ),
      { seed: FC_SEED },
    );
  });
});

describe('US-ER-06 AK-5 places of a ranking by hand (FA-ER-12)', () => {
  it('are taken as entered, whatever the game counts', () => {
    const ranking = points(2, 1, 4, 2);
    const expected = new Map([
      [ANNA, 2],
      [BEN, 1],
      [CLARA, 4],
      [DAVID, 2],
    ]);

    expect(placesOf({ winnerIds: [BEN], places: ranking }, TABLE, null)).toEqual(expected);
    expect(placesOf({ winnerIds: [BEN], places: ranking }, TABLE, 'lowest-wins')).toEqual(expected);
  });
});

describe('US-AB-07 AK-4 duration in whole minutes', () => {
  it.each([
    [0, 1],
    [29_999, 1],
    [60_000, 1],
    [89_999, 1],
    [90_000, 2],
    [95 * 60_000 + 20_000, 95],
    [95 * 60_000 + 40_000, 96],
  ])('%i ms give %i minutes', (milliseconds, minutes) => {
    expect(durationMinutesOf(milliseconds)).toBe(minutes);
  });
});
