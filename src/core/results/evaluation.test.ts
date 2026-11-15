import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { toPersonId, type PersonId } from '@/core/model';
import { durationMinutesOf, placesOf, plausibilityWarnings } from './evaluation';

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
      plausibilityWarnings({ winnerIds: [ANNA], victoryPoints: points(10, 8, 8, 6) }, TABLE),
    ).toEqual([]);
  });

  it('warns nothing without victory points', () => {
    expect(plausibilityWarnings({ winnerIds: [BEN] }, TABLE)).toEqual([]);
  });

  it('warns if a winner does not have the highest score', () => {
    expect(
      plausibilityWarnings({ winnerIds: [BEN], victoryPoints: points(10, 8, 8, 6) }, TABLE),
    ).toEqual(['winner-not-highest']);
  });

  it('warns nothing for a draw of winners with the same, highest score', () => {
    expect(
      plausibilityWarnings({ winnerIds: [ANNA, BEN], victoryPoints: points(9, 9, 8, 6) }, TABLE),
    ).toEqual([]);
  });

  it('warns if winners of a draw have different scores', () => {
    expect(
      plausibilityWarnings({ winnerIds: [ANNA, BEN], victoryPoints: points(10, 8, 8, 6) }, TABLE),
    ).toEqual(['winner-not-highest', 'winners-differ']);
  });
});

describe('US-ER-02 AK-5 places from victory points (FA-ER-11)', () => {
  it('10, 8, 8, 6 points give the places 1, 2, 2, 4', () => {
    const places = placesOf({ winnerIds: [ANNA], victoryPoints: points(10, 8, 8, 6) }, TABLE);

    expect(places).toEqual(
      new Map([
        [ANNA, 1],
        [BEN, 2],
        [CLARA, 2],
        [DAVID, 4],
      ]),
    );
  });

  it('the winner keeps place 1 even with fewer points after the warning', () => {
    const places = placesOf({ winnerIds: [DAVID], victoryPoints: points(10, 8, 8, 6) }, TABLE);

    expect(places).toEqual(
      new Map([
        [ANNA, 2],
        [BEN, 3],
        [CLARA, 3],
        [DAVID, 1],
      ]),
    );
  });

  it('gives no places without victory points', () => {
    expect(placesOf({ winnerIds: [ANNA] }, TABLE)).toBeNull();
  });

  it('has place 1 once, and a place k is shared by persons with the same score (property)', () => {
    const score = fc.integer({ min: 0, max: 20 });
    fc.assert(
      fc.property(
        fc.tuple(score, score, score, score),
        fc.constantFrom(...TABLE),
        ([a, b, c, d], winner) => {
          const victoryPoints = points(a, b, c, d);
          const places = placesOf({ winnerIds: [winner], victoryPoints }, TABLE);
          if (places === null) return false;
          const others = TABLE.filter((personId) => personId !== winner);
          return (
            places.get(winner) === 1 &&
            others.every((personId) => {
              const place = places.get(personId) ?? 0;
              const ahead = others.filter(
                (other) => (victoryPoints[other] ?? 0) > (victoryPoints[personId] ?? 0),
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
