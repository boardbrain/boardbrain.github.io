const MINUTES_PER_HOUR = 60;
const DIGITS = /^\d+$/u;

/**
 * The duration of a match as typed in the result form: hours and minutes in two fields
 * (US-ER-01 AK-7, Product Owner 21.11.2026).
 */
export type DurationFields = { readonly hours: string; readonly minutes: string };

/**
 * What the two fields give: the duration in whole minutes (`undefined` when both are empty or a
 * field is wrong) and which field is wrong.
 */
export type ReadDuration = {
  readonly minutes: number | undefined;
  readonly isHoursBad: boolean;
  readonly isMinutesBad: boolean;
};

/**
 * The fields for a duration in minutes, e.g. 83 → 1 h 23 min; empty without a duration.
 */
export function durationFields(minutes: number | undefined): DurationFields {
  if (minutes === undefined) {
    return { hours: '', minutes: '' };
  }
  return {
    hours: String(Math.floor(minutes / MINUTES_PER_HOUR)),
    minutes: String(minutes % MINUTES_PER_HOUR),
  };
}

/**
 * Reads the two fields. An empty field counts as 0, both empty as no duration. Hours are whole
 * numbers from 0, minutes from 0 to 59; together at least 1 minute (US-ER-01 AK-7).
 */
export function readDuration(fields: DurationFields): ReadDuration {
  const hours = fields.hours.trim();
  const minutes = fields.minutes.trim();
  if (hours === '' && minutes === '') {
    return { minutes: undefined, isHoursBad: false, isMinutesBad: false };
  }
  const isHoursBad = hours !== '' && !DIGITS.test(hours);
  const isMinutesBad =
    minutes !== '' && (!DIGITS.test(minutes) || Number(minutes) >= MINUTES_PER_HOUR);
  if (isHoursBad || isMinutesBad) {
    return { minutes: undefined, isHoursBad, isMinutesBad };
  }
  const total = Number(hours || '0') * MINUTES_PER_HOUR + Number(minutes || '0');
  if (total < 1) {
    // 0 h 0 min: the field typed last is not known, so both are marked.
    return { minutes: undefined, isHoursBad: hours !== '', isMinutesBad: minutes !== '' };
  }
  return { minutes: total, isHoursBad: false, isMinutesBad: false };
}
