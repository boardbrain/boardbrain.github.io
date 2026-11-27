import { describe, expect, it } from 'vitest';
import { day } from '@tests/support/statsFakes';
import { isInPeriod, lastMonthsStart, periodBounds, periodRangeError } from './period';

const TODAY = day('2026-11-17');

describe('US-ST-03 AK-5 period (FA-ST-10)', () => {
  it('the last 3 or 12 months start the day after the same day months earlier', () => {
    expect(lastMonthsStart(TODAY, 3)).toBe('2026-08-18');
    expect(lastMonthsStart(TODAY, 12)).toBe('2025-11-18');
    expect(lastMonthsStart(day('2026-01-15'), 3)).toBe('2025-10-16');
  });

  it('a day that does not exist in the earlier month becomes its last day', () => {
    expect(lastMonthsStart(day('2026-05-31'), 3)).toBe('2026-03-01');
    expect(lastMonthsStart(day('2024-05-31'), 3)).toBe('2024-03-01');
    expect(lastMonthsStart(day('2026-03-31'), 1)).toBe('2026-03-01');
  });

  it('gives the bounds of every kind of period, none for all matches', () => {
    expect(periodBounds({ kind: 'all' }, TODAY)).toBeNull();
    expect(periodBounds({ kind: 'year', year: 2025 }, TODAY)).toEqual({
      from: '2025-01-01',
      to: '2025-12-31',
    });
    expect(periodBounds({ kind: 'last-months', months: 3 }, TODAY)).toEqual({
      from: '2026-08-18',
      to: '2026-11-17',
    });
    expect(
      periodBounds({ kind: 'range', from: day('2026-03-01'), to: day('2026-03-31') }, TODAY),
    ).toEqual({
      from: '2026-03-01',
      to: '2026-03-31',
    });
  });

  it('includes both ends of a period', () => {
    const march = { kind: 'range', from: day('2026-03-01'), to: day('2026-03-31') } as const;

    expect(isInPeriod(day('2026-03-01'), march, TODAY)).toBe(true);
    expect(isInPeriod(day('2026-03-31'), march, TODAY)).toBe(true);
    expect(isInPeriod(day('2026-04-01'), march, TODAY)).toBe(false);
    expect(isInPeriod(day('2026-08-17'), { kind: 'last-months', months: 3 }, TODAY)).toBe(false);
    expect(isInPeriod(day('1999-01-01'), { kind: 'all' }, TODAY)).toBe(true);
  });
});

describe('US-ST-03 AK-6 own range', () => {
  it('needs start and end, the start not after the end and the end not after today', () => {
    expect(periodRangeError(null, TODAY, TODAY)).toBe('range-incomplete');
    expect(periodRangeError(TODAY, null, TODAY)).toBe('range-incomplete');
    expect(periodRangeError(day('2026-05-02'), day('2026-05-01'), TODAY)).toBe('range-reversed');
    expect(periodRangeError(day('2026-05-01'), day('2026-11-18'), TODAY)).toBe('range-in-future');
    expect(periodRangeError(day('2026-05-01'), day('2026-05-01'), TODAY)).toBeNull();
    expect(periodRangeError(day('2026-05-01'), TODAY, TODAY)).toBeNull();
  });
});
