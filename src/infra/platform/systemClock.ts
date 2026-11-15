import type { Clock } from '@/app/ports';
import { parseLocalDate, parseLocalTime } from '@/core/model';
import { assert } from '@/core/shared';

function twoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Clock of the device; timestamps are stored in UTC, date and time of day as meant at the table
 * in the time zone of the device (Architecture 7.1).
 */
export const systemClock: Clock = {
  now: () => new Date().toISOString(),
  localDateTime: (at) => {
    const moment = new Date(at);
    const date = parseLocalDate(
      `${String(moment.getFullYear()).padStart(4, '0')}-${twoDigits(moment.getMonth() + 1)}-${twoDigits(moment.getDate())}`,
    );
    const time = parseLocalTime(
      `${twoDigits(moment.getHours())}:${twoDigits(moment.getMinutes())}`,
    );
    assert(date.ok && time.ok, `the moment ${at} is a valid timestamp`);
    return { date: date.value, time: time.value };
  },
};
