import { err, ok, type Result } from '@/core/shared';

declare const localBrand: unique symbol;

/**
 * Calendar day as meant at the table, without time zone, e.g. `2026-11-15` (Architecture 7.1).
 */
export type LocalDate = string & { readonly [localBrand]: 'LocalDate' };

/**
 * Time of day as meant at the table, without time zone, e.g. `19:30` (Architecture 7.1).
 */
export type LocalTime = string & { readonly [localBrand]: 'LocalTime' };

/**
 * Error code for a date that is not a real calendar day in the form `YYYY-MM-DD`.
 */
export type DateInvalidError = 'date-invalid';

/**
 * Error code for a time that is not in the form `HH:mm` from `00:00` to `23:59`.
 */
export type TimeInvalidError = 'time-invalid';

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function isLocalDate(value: string): value is LocalDate {
  const parts = DATE_PATTERN.exec(value);
  if (parts === null) {
    return false;
  }
  const [year, month, day] = parts.slice(1).map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    return false;
  }
  // A day that does not exist, such as 31 February, rolls over into the next month.
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function isLocalTime(value: string): value is LocalTime {
  return TIME_PATTERN.test(value);
}

/**
 * Reads a date from outside, e.g. from the result form (US-ER-01 AK-2). Only real calendar
 * days are accepted, `2026-02-29` is not.
 */
export function parseLocalDate(value: string): Result<LocalDate, DateInvalidError> {
  return isLocalDate(value) ? ok(value) : err('date-invalid');
}

/**
 * Reads a time of day from outside, e.g. from the result form (US-ER-01 AK-3).
 */
export function parseLocalTime(value: string): Result<LocalTime, TimeInvalidError> {
  return isLocalTime(value) ? ok(value) : err('time-invalid');
}

/**
 * A moment as date and time of day at the place of the device (Architecture 7.1).
 */
export type LocalDateTime = {
  readonly date: LocalDate;
  readonly time: LocalTime;
};
