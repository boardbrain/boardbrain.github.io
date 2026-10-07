import { afterEach, describe, expect, it, vi } from 'vitest';
import { systemClock } from './systemClock';

describe('Architecture 7.1 system clock', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the current time as a UTC timestamp in ISO 8601 format', () => {
    vi.useFakeTimers({ now: new Date('2026-10-07T18:30:00.000Z') });

    expect(systemClock.now()).toBe('2026-10-07T18:30:00.000Z');
  });
});
