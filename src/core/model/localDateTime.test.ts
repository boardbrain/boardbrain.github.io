import { describe, expect, it } from 'vitest';
import { parseLocalDate, parseLocalTime } from './localDateTime';

describe('US-ER-01 AK-2 date of a result', () => {
  it.each(['2026-11-15', '2024-02-29', '1999-12-31', '2026-01-01'])(
    'accepts the calendar day %s',
    (value) => {
      expect(parseLocalDate(value)).toEqual({ ok: true, value });
    },
  );

  it.each([
    ['a day that does not exist', '2026-02-29'],
    ['day 31 of a short month', '2026-04-31'],
    ['month 13', '2026-13-01'],
    ['day 0', '2026-11-00'],
    ['a German date', '15.11.2026'],
    ['no leading zeros', '2026-1-5'],
    ['a timestamp', '2026-11-15T19:30'],
    ['empty', ''],
  ])('rejects %s', (_case, value) => {
    expect(parseLocalDate(value)).toEqual({ ok: false, error: 'date-invalid' });
  });
});

describe('US-ER-01 AK-3 time of a result', () => {
  it.each(['00:00', '09:05', '19:30', '23:59'])('accepts %s', (value) => {
    expect(parseLocalTime(value)).toEqual({ ok: true, value });
  });

  it.each([
    ['hour 24', '24:00'],
    ['minute 60', '19:60'],
    ['seconds', '19:30:00'],
    ['no leading zero', '9:05'],
    ['empty', ''],
  ])('rejects %s', (_case, value) => {
    expect(parseLocalTime(value)).toEqual({ ok: false, error: 'time-invalid' });
  });
});
