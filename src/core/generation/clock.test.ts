import { describe, expect, it } from 'vitest';
import type { Result } from '@/core/shared';
import { correctClock, elapsedMilliseconds, pauseClock, resumeClock, startClock } from './clock';

const START = '2026-11-15T18:00:00.000Z';
const MINUTE = 60_000;

function at(minutes: number): string {
  return new Date(Date.parse(START) + minutes * MINUTE).toISOString();
}

function value<T>(result: Result<T, string>): T {
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

describe('US-AB-07 Measure the duration of a match', () => {
  it('AK-1: a started timer shows the time since its start', () => {
    const clock = startClock(START);

    expect(clock).toEqual({ startedAt: START, pausedMs: 0 });
    expect(elapsedMilliseconds(clock, START)).toBe(0);
    expect(elapsedMilliseconds(clock, at(42))).toBe(42 * MINUTE);
  });

  it('AK-2: paused time does not count, and the timer stands still while paused', () => {
    const paused = value(pauseClock(startClock(START), at(30)));

    expect(elapsedMilliseconds(paused, at(30))).toBe(30 * MINUTE);
    expect(elapsedMilliseconds(paused, at(45))).toBe(30 * MINUTE);

    const resumed = value(resumeClock(paused, at(45)));

    expect(resumed).toEqual({ startedAt: START, pausedMs: 15 * MINUTE });
    expect(elapsedMilliseconds(resumed, at(60))).toBe(45 * MINUTE);
  });

  it('AK-2: pauses add up over several breaks', () => {
    let clock = startClock(START);
    clock = value(pauseClock(clock, at(10)));
    clock = value(resumeClock(clock, at(15)));
    clock = value(pauseClock(clock, at(20)));
    clock = value(resumeClock(clock, at(30)));

    expect(elapsedMilliseconds(clock, at(40))).toBe(25 * MINUTE);
  });

  it('AK-3: only moments are stored, so the time goes on while the app is closed', () => {
    const stored = structuredClone(startClock(START));

    expect(elapsedMilliseconds(stored, at(90))).toBe(90 * MINUTE);
  });

  it('AK-3: a paused timer stays paused after a restart', () => {
    const stored = structuredClone(value(pauseClock(startClock(START), at(20))));

    expect(elapsedMilliseconds(stored, at(200))).toBe(20 * MINUTE);
  });

  it('rejects pausing a paused timer and resuming a running one', () => {
    const paused = value(pauseClock(startClock(START), at(5)));

    expect(pauseClock(paused, at(6))).toEqual({ ok: false, error: 'clock-paused' });
    expect(resumeClock(startClock(START), at(6))).toEqual({ ok: false, error: 'clock-running' });
  });

  it('never measures a negative time if the clock of the device was set back', () => {
    const clock = startClock(START);

    expect(elapsedMilliseconds(clock, at(-5))).toBe(0);
    const resumed = value(resumeClock(value(pauseClock(clock, at(10))), at(8)));
    expect(elapsedMilliseconds(resumed, at(12))).toBe(12 * MINUTE);
  });
});

describe('US-AB-07 AK-6 correct the timer', () => {
  it('a longer or shorter duration counts on from the correction', () => {
    const corrected = value(
      correctClock({ startedAt: START, elapsedMs: 50 * MINUTE, isPaused: false }, at(60)),
    );

    expect(elapsedMilliseconds(corrected, at(60))).toBe(50 * MINUTE);
    expect(elapsedMilliseconds(corrected, at(70))).toBe(60 * MINUTE);
  });

  it('an earlier beginning with the duration grown by the same time', () => {
    const earlier = at(-12);
    const corrected = value(
      correctClock({ startedAt: earlier, elapsedMs: 72 * MINUTE, isPaused: false }, at(60)),
    );

    expect(corrected).toEqual({ startedAt: earlier, pausedMs: 0 });
    expect(elapsedMilliseconds(corrected, at(61))).toBe(73 * MINUTE);
  });

  it('a paused correction stands still until it is resumed', () => {
    const corrected = value(
      correctClock({ startedAt: START, elapsedMs: 40 * MINUTE, isPaused: true }, at(60)),
    );

    expect(elapsedMilliseconds(corrected, at(90))).toBe(40 * MINUTE);
    const resumed = value(resumeClock(corrected, at(90)));
    expect(elapsedMilliseconds(resumed, at(95))).toBe(45 * MINUTE);
  });

  it('rejects a beginning in the future, more time than has passed and less than a minute', () => {
    const invalid = { ok: false, error: 'clock-correction-invalid' };

    expect(correctClock({ startedAt: at(61), elapsedMs: MINUTE, isPaused: false }, at(60))).toEqual(
      invalid,
    );
    expect(
      correctClock({ startedAt: START, elapsedMs: 61 * MINUTE, isPaused: false }, at(60)),
    ).toEqual(invalid);
    expect(correctClock({ startedAt: START, elapsedMs: 59_999, isPaused: false }, at(60))).toEqual(
      invalid,
    );
    expect(
      correctClock({ startedAt: 'gestern', elapsedMs: MINUTE, isPaused: false }, at(60)),
    ).toEqual(invalid);
  });
});
