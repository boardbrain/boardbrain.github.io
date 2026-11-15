import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseLocalDate, parseLocalTime, toMatchId } from '@/core/model';
import { compareMatches, sortMatches, type MatchMoment } from './order';

const FC_SEED = 20261115;

function moment(
  number: number,
  date: string,
  time: string | undefined,
  recordedAt: string,
): MatchMoment {
  const day = parseLocalDate(date);
  if (!day.ok) throw new Error(date);
  const id = toMatchId(`00000000-0000-4000-8000-${String(number).padStart(12, '0')}`);
  if (time === undefined) {
    return { id, date: day.value, recordedAt };
  }
  const clock = parseLocalTime(time);
  if (!clock.ok) throw new Error(time);
  return { id, date: day.value, time: clock.value, recordedAt };
}

// Expected order of Specification 3.7, oldest first.
const CHRONOLOGICAL = [
  moment(1, '2026-11-14', '21:00', '2026-11-15T09:00:00.000Z'),
  moment(2, '2026-11-14', undefined, '2026-11-14T22:00:00.000Z'),
  moment(3, '2026-11-15', '18:05', '2026-11-15T23:00:00.000Z'),
  moment(4, '2026-11-15', '20:30', '2026-11-15T20:00:00.000Z'),
  moment(5, '2026-11-15', undefined, '2026-11-15T19:00:00.000Z'),
  moment(6, '2026-11-15', undefined, '2026-11-15T22:00:00.000Z'),
];

describe('Specification 3.7 order of matches (FA-ER-08)', () => {
  it('sorts by date, within a day by time, matches without time after those with time', () => {
    const shuffled = [3, 0, 5, 1, 4, 2].flatMap((index) => CHRONOLOGICAL.slice(index, index + 1));

    expect(sortMatches(shuffled)).toEqual(CHRONOLOGICAL);
  });

  it('orders matches without a time among each other by the time of recording', () => {
    const [, , , , early, late] = CHRONOLOGICAL;
    if (early === undefined || late === undefined) throw new Error('fixture');

    expect(compareMatches(early, late)).toBeLessThan(0);
    expect(compareMatches(late, early)).toBeGreaterThan(0);
  });

  it('orders matches with the same time by the time of recording, then by id', () => {
    const a = moment(7, '2026-11-15', '20:00', '2026-11-15T21:00:00.000Z');
    const b = moment(8, '2026-11-15', '20:00', '2026-11-15T20:00:00.000Z');
    const c = moment(9, '2026-11-15', '20:00', '2026-11-15T20:00:00.000Z');

    expect(sortMatches([a, c, b])).toEqual([b, c, a]);
    expect(compareMatches(a, a)).toBe(0);
  });

  it('gives the same order whatever order the matches are read in (property)', () => {
    fc.assert(
      fc.property(fc.shuffledSubarray(CHRONOLOGICAL, { minLength: 6 }), (shuffled) => {
        expect(sortMatches(shuffled)).toEqual(CHRONOLOGICAL);
      }),
      { seed: FC_SEED },
    );
  });

  it('leaves the given list unchanged', () => {
    const reversed = [...CHRONOLOGICAL].reverse();
    sortMatches(reversed);

    expect(reversed[0]).toBe(CHRONOLOGICAL[5]);
  });
});
