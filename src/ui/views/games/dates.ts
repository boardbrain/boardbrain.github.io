import { parseLocalDate, type LocalDate } from '@/core/model';
import { t } from '@/i18n/t';

const DAY_MS = 86_400_000;
// Sunday first, like `Date.getUTCDay`.
const WEEKDAYS = [
  'datum.wochentage.so',
  'datum.wochentage.mo',
  'datum.wochentage.di',
  'datum.wochentage.mi',
  'datum.wochentage.do',
  'datum.wochentage.fr',
  'datum.wochentage.sa',
] as const;

function utcOf(date: LocalDate): number {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function fromUtc(ms: number): LocalDate {
  const parsed = parseLocalDate(new Date(ms).toISOString().slice(0, 10));
  if (!parsed.ok) {
    throw new Error('a calendar day gives a local date');
  }
  return parsed.value;
}

/**
 * Whole days from `from` to `to`; negative if `to` is earlier.
 */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((utcOf(to) - utcOf(from)) / DAY_MS);
}

/**
 * The day `days` after `date` (before it for a negative number).
 */
export function addDays(date: LocalDate, days: number): LocalDate {
  return fromUtc(utcOf(date) + days * DAY_MS);
}

/**
 * "20.10." in the current year, "31.12.2025" in another (design I3-B).
 */
export function shortDate(date: LocalDate, today: LocalDate): string {
  const [year, month, day] = date.split('-');
  const dayMonth = `${String(day)}.${String(month)}.`;
  return date.slice(0, 4) === today.slice(0, 4) ? dayMonth : `${dayMonth}${String(year)}`;
}

/**
 * The day in the result form (design I3-B D1): "heute, 17.11.", "gestern, 16.11.", "Sa, 14.11.",
 * in another year "Mi, 31.12.2025".
 */
export function dayLabel(date: LocalDate, today: LocalDate): string {
  const days = daysBetween(date, today);
  const short = shortDate(date, today);
  if (days === 0) {
    return `${t('datum.heute')}, ${short}`;
  }
  if (days === 1) {
    return `${t('datum.gestern')}, ${short}`;
  }
  const weekday = WEEKDAYS[new Date(utcOf(date)).getUTCDay()] ?? 'datum.wochentage.so';
  return `${t(weekday)}, ${short}`;
}

/**
 * Today at the place of the device.
 */
export function localToday(now: Date = new Date()): LocalDate {
  const pad = (value: number): string => String(value).padStart(2, '0');
  const parsed = parseLocalDate(
    `${String(now.getFullYear())}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
  );
  if (!parsed.ok) {
    throw new Error('a calendar day gives a local date');
  }
  return parsed.value;
}
