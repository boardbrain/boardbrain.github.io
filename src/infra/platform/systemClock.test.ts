import { afterEach, describe, expect, it, vi } from 'vitest';
import { InvariantError } from '@/core/shared';
import { systemClock } from './systemClock';

describe('Architecture 7.1 system clock', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the current time as a UTC timestamp in ISO 8601 format', () => {
    vi.useFakeTimers({ now: new Date('2026-10-07T18:30:00.000Z') });

    expect(systemClock.now()).toBe('2026-10-07T18:30:00.000Z');
  });

  it('US-AB-07 AK-4: gives date and time of day of a moment in the time zone of the device', () => {
    // Built from local values, so the test holds in every time zone.
    const moment = new Date(2026, 0, 5, 9, 7, 42);

    expect(systemClock.localDateTime(moment.toISOString())).toEqual({
      date: '2026-01-05',
      time: '09:07',
    });
  });

  it('throws for a text that is no timestamp', () => {
    expect(() => systemClock.localDateTime('gestern')).toThrow(InvariantError);
  });
});
