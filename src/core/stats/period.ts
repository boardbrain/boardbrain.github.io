import { parseLocalDate, type LocalDate } from '@/core/model';
import { assert } from '@/core/shared';

/**
 * The period of the statistics (FA-ST-10, Specification 3.8): all matches, a calendar year, the
 * last 3 or 12 months up to today, or an own range with start and end, both included.
 */
export type StatsPeriod =
  | { readonly kind: 'all' }
  | { readonly kind: 'year'; readonly year: number }
  | { readonly kind: 'last-months'; readonly months: 3 | 12 }
  | { readonly kind: 'range'; readonly from: LocalDate; readonly to: LocalDate };

/**
 * Why an own range cannot be taken (US-ST-03 AK-6): start or end missing, the start after the
 * end, or the end after today.
 */
export type PeriodRangeError = 'range-incomplete' | 'range-reversed' | 'range-in-future';

/**
 * The whole period: every match counts.
 */
export const ALL_TIME: StatsPeriod = { kind: 'all' };

function toLocalDate(date: Date): LocalDate {
  const parsed = parseLocalDate(date.toISOString().slice(0, 10));
  assert(parsed.ok, 'a valid date gives a calendar day');
  return parsed.value;
}

/**
 * The first day of "the last n months" up to `today` (FA-ST-10): the day after the same day n
 * months earlier; a day that does not exist in that month becomes its last day.
 */
export function lastMonthsStart(today: LocalDate, months: number): LocalDate {
  const [year = 0, month = 1, day = 1] = today.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 - months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay) + 1);
  return toLocalDate(target);
}

/**
 * The first and last day of a period, both included, or `null` for all matches
 * (Specification 3.8).
 */
export function periodBounds(
  period: StatsPeriod,
  today: LocalDate,
): { readonly from: string; readonly to: string } | null {
  switch (period.kind) {
    case 'all':
      return null;
    case 'year':
      return { from: `${String(period.year)}-01-01`, to: `${String(period.year)}-12-31` };
    case 'last-months':
      return { from: lastMonthsStart(today, period.months), to: today };
    case 'range':
      return { from: period.from, to: period.to };
  }
}

/**
 * Whether a day lies in the period (FA-ST-10).
 */
export function isInPeriod(date: LocalDate, period: StatsPeriod, today: LocalDate): boolean {
  const bounds = periodBounds(period, today);
  return bounds === null || (date >= bounds.from && date <= bounds.to);
}

/**
 * Checks an own range while it is being entered (US-ST-03 AK-6): both days needed, the start
 * not after the end, the end not after today. `null` if it can be taken.
 */
export function periodRangeError(
  from: LocalDate | null,
  to: LocalDate | null,
  today: LocalDate,
): PeriodRangeError | null {
  if (from === null || to === null) {
    return 'range-incomplete';
  }
  if (from > to) {
    return 'range-reversed';
  }
  if (to > today) {
    return 'range-in-future';
  }
  return null;
}
