import { describe, expect, it } from 'vitest';
import { InvariantError, type Result } from '@/core/shared';
import {
  addPauseInStretch,
  checkClock,
  clockFromVersion4,
  clockStretches,
  elapsedMilliseconds,
  isClockPaused,
  isSameClock,
  overlappingPause,
  pauseClock,
  pausedMilliseconds,
  removePause,
  resumeClock,
  setClockStart,
  setPauseTimes,
  startClock,
  stretchMinutes,
  type SessionClock,
} from './clock';

const START = '2026-11-15T18:00:00.000Z';
const MINUTE = 60_000;

function at(minutes: number): string {
  return new Date(Date.parse(START) + minutes * MINUTE).toISOString();
}

function value<T>(result: Result<T, string>): T {
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

// Started at 18:00, a pause from 18:40 to 18:52, now 19:35: 1:23 played.
const PLAYED: SessionClock = { startedAt: START, pauses: [{ from: at(40), to: at(52) }] };
const NOW = at(95);

describe('US-AB-07 Measure the duration of a match', () => {
  it('AK-1: a started timer shows the time since its start', () => {
    const clock = startClock(START);

    expect(clock).toEqual({ startedAt: START, pauses: [] });
    expect(elapsedMilliseconds(clock, START)).toBe(0);
    expect(elapsedMilliseconds(clock, at(42))).toBe(42 * MINUTE);
  });

  it('AK-2: paused time does not count, and the timer stands still while paused', () => {
    const paused = value(pauseClock(startClock(START), at(30)));

    expect(isClockPaused(paused)).toBe(true);
    expect(elapsedMilliseconds(paused, at(30))).toBe(30 * MINUTE);
    expect(elapsedMilliseconds(paused, at(45))).toBe(30 * MINUTE);

    const resumed = value(resumeClock(paused, at(45)));

    expect(resumed).toEqual({ startedAt: START, pauses: [{ from: at(30), to: at(45) }] });
    expect(isClockPaused(resumed)).toBe(false);
    expect(elapsedMilliseconds(resumed, at(60))).toBe(45 * MINUTE);
  });

  it('AK-2, ADR-031: every pause is kept on its own', () => {
    let clock = startClock(START);
    clock = value(pauseClock(clock, at(10)));
    clock = value(resumeClock(clock, at(15)));
    clock = value(pauseClock(clock, at(40)));
    clock = value(resumeClock(clock, at(50)));

    expect(clock.pauses).toEqual([
      { from: at(10), to: at(15) },
      { from: at(40), to: at(50) },
    ]);
    expect(pausedMilliseconds(clock, at(60))).toBe(15 * MINUTE);
    expect(elapsedMilliseconds(clock, at(60))).toBe(45 * MINUTE);
  });

  it('AK-3: only moments are stored, so the time goes on while the app is closed', () => {
    expect(elapsedMilliseconds(PLAYED, NOW)).toBe(83 * MINUTE);
    expect(elapsedMilliseconds(PLAYED, at(155))).toBe(143 * MINUTE);
  });

  it('rejects pausing a paused timer and resuming a running one', () => {
    const paused = value(pauseClock(startClock(START), at(5)));

    expect(pauseClock(paused, at(6))).toEqual({ ok: false, error: 'clock-paused' });
    expect(resumeClock(startClock(START), at(6))).toEqual({ ok: false, error: 'clock-running' });
  });

  it('never measures a negative time if the clock of the device was set back', () => {
    const paused = value(pauseClock(startClock(START), at(10)));

    expect(elapsedMilliseconds(startClock(START), at(-5))).toBe(0);
    expect(value(resumeClock(paused, at(8))).pauses).toEqual([{ from: at(10), to: at(10) }]);
  });
});

describe('US-AB-07 AK-6 the history of the timer', () => {
  it('lists the played stretches between the pauses, the last one up to now', () => {
    expect(clockStretches(PLAYED)).toEqual([{ from: START, to: at(40) }, { from: at(52) }]);
    expect(stretchMinutes({ from: START, to: at(40) }, NOW)).toBe(40);
    expect(stretchMinutes({ from: at(52) }, NOW)).toBe(43);
  });

  it('a paused timer has no stretch after its last pause', () => {
    const paused = value(pauseClock(PLAYED, at(90)));

    expect(clockStretches(paused)).toEqual([
      { from: START, to: at(40) },
      { from: at(52), to: at(90) },
    ]);
  });

  it('the beginning can be set earlier, not in the future and not after the first pause', () => {
    expect(value(setClockStart(PLAYED, at(-10), NOW)).startedAt).toBe(at(-10));
    expect(elapsedMilliseconds(value(setClockStart(PLAYED, at(-10), NOW)), NOW)).toBe(93 * MINUTE);
    expect(setClockStart(PLAYED, at(45), NOW)).toEqual({ ok: false, error: 'start-after-pause' });
    expect(setClockStart(startClock(START), at(100), NOW)).toEqual({
      ok: false,
      error: 'start-in-future',
    });
  });

  it('a pause can be moved, longer or shorter', () => {
    const changed = value(setPauseTimes(PLAYED, 0, at(35), at(55), NOW));

    expect(changed.pauses).toEqual([{ from: at(35), to: at(55) }]);
    expect(elapsedMilliseconds(changed, NOW)).toBe(75 * MINUTE);
  });

  it('a time that breaks the rules is not taken and says why', () => {
    const two: SessionClock = {
      startedAt: START,
      pauses: [
        { from: at(40), to: at(52) },
        { from: at(70), to: at(80) },
      ],
    };

    expect(setPauseTimes(two, 0, at(-5), at(10), NOW)).toEqual({
      ok: false,
      error: 'pause-before-start',
    });
    expect(setPauseTimes(two, 0, at(40), at(40), NOW)).toEqual({
      ok: false,
      error: 'pause-ends-before-start',
    });
    expect(setPauseTimes(two, 1, at(70), at(100), NOW)).toEqual({
      ok: false,
      error: 'pause-in-future',
    });
    expect(setPauseTimes(two, 0, at(40), at(75), NOW)).toEqual({
      ok: false,
      error: 'pause-overlaps',
    });
    expect(overlappingPause(two, at(40), at(75), NOW, 0)).toBe(1);
  });

  it('a pause that still lasts keeps lasting when its beginning moves', () => {
    const paused = value(pauseClock(PLAYED, at(90)));

    expect(value(setPauseTimes(paused, 1, at(85), undefined, NOW)).pauses[1]).toEqual({
      from: at(85),
    });
    expect(() => setPauseTimes(paused, 1, at(85), at(88), NOW)).toThrow(InvariantError);
  });

  it('a pause can be removed, then its time counts again; a lasting one cannot', () => {
    const removed = value(removePause(PLAYED, 0));

    expect(elapsedMilliseconds(removed, NOW)).toBe(95 * MINUTE);
    expect(removePause(value(pauseClock(PLAYED, at(90))), 1)).toEqual({
      ok: false,
      error: 'pause-running',
    });
  });

  it('a pause is added in minutes in the middle of its stretch', () => {
    const added = value(addPauseInStretch(PLAYED, 0, 20, NOW));

    expect(added.pauses).toEqual([
      { from: at(10), to: at(30) },
      { from: at(40), to: at(52) },
    ]);
    expect(elapsedMilliseconds(added, NOW)).toBe(63 * MINUTE);
  });

  it('a pause filling its stretch stays inside it, on odd seconds too', () => {
    const odd: SessionClock = { startedAt: '2026-11-15T18:00:40.000Z', pauses: [] };
    const now = '2026-11-15T18:10:40.000Z';
    const added = value(addPauseInStretch(odd, 0, 10, now));

    expect(added.pauses).toEqual([{ from: odd.startedAt, to: now }]);
    expect(checkClock(added, now).ok).toBe(true);
  });

  it('a pause in the last stretch ends before now', () => {
    const added = value(addPauseInStretch(PLAYED, 1, 15, NOW));

    expect(added.pauses[1]).toEqual({ from: at(66), to: at(81) });
  });

  it('rejects a pause shorter than a minute or longer than its stretch', () => {
    expect(addPauseInStretch(PLAYED, 0, 0, NOW)).toEqual({ ok: false, error: 'pause-too-short' });
    expect(addPauseInStretch(PLAYED, 0, 2.5, NOW)).toEqual({
      ok: false,
      error: 'pause-too-short',
    });
    expect(addPauseInStretch(PLAYED, 0, 41, NOW)).toEqual({ ok: false, error: 'pause-too-long' });
    expect(() => addPauseInStretch(PLAYED, 5, 5, NOW)).toThrow(InvariantError);
  });
});

describe('ADR-031 comparing timers', () => {
  it('two timers are the same with the same beginning and pauses', () => {
    expect(isSameClock(PLAYED, { startedAt: START, pauses: [{ from: at(40), to: at(52) }] })).toBe(
      true,
    );
    expect(isSameClock(PLAYED, startClock(START))).toBe(false);
    expect(isSameClock(PLAYED, { startedAt: START, pauses: [{ from: at(40) }] })).toBe(false);
    expect(isSameClock(PLAYED, { ...PLAYED, startedAt: at(1) })).toBe(false);
  });
});

describe('ADR-031 a timer is checked as a whole', () => {
  it('accepts a timer that keeps its rules', () => {
    expect(checkClock(PLAYED, NOW)).toEqual({ ok: true, value: PLAYED });
    expect(checkClock(value(pauseClock(PLAYED, NOW)), NOW).ok).toBe(true);
  });

  it.each([
    ['a beginning in the future', { startedAt: at(100), pauses: [] }],
    ['a pause before the beginning', { startedAt: START, pauses: [{ from: at(-1), to: at(5) }] }],
    [
      'pauses out of order or overlapping',
      {
        startedAt: START,
        pauses: [
          { from: at(20), to: at(30) },
          { from: at(25), to: at(35) },
        ],
      },
    ],
    [
      'a pause ending before it begins',
      { startedAt: START, pauses: [{ from: at(20), to: at(10) }] },
    ],
    ['a pause in the future', { startedAt: START, pauses: [{ from: at(90), to: at(99) }] }],
    [
      'a lasting pause that is not the last',
      {
        startedAt: START,
        pauses: [{ from: at(10) }, { from: at(20), to: at(30) }],
      },
    ],
    ['a time that is no time', { startedAt: 'gestern', pauses: [] }],
  ])('rejects %s', (_name, clock: SessionClock) => {
    expect(checkClock(clock, NOW)).toEqual({ ok: false, error: 'clock-invalid' });
  });
});

describe('ADR-031 a timer of session version 4', () => {
  it('turns the sum of its pauses into one pause after the beginning, same time measured', () => {
    const clock = clockFromVersion4({ startedAt: START, pausedMs: 12 * MINUTE });

    expect(clock).toEqual({ startedAt: START, pauses: [{ from: START, to: at(12) }] });
    expect(elapsedMilliseconds(clock, NOW)).toBe(83 * MINUTE);
  });

  it('keeps a paused timer paused at the same time', () => {
    const clock = clockFromVersion4({ startedAt: START, pausedAt: at(60), pausedMs: 5 * MINUTE });

    expect(clock.pauses).toEqual([{ from: START, to: at(5) }, { from: at(60) }]);
    expect(elapsedMilliseconds(clock, NOW)).toBe(55 * MINUTE);
    expect(checkClock(clock, NOW).ok).toBe(true);
  });

  it('a timer without pauses stays without', () => {
    expect(clockFromVersion4({ startedAt: START, pausedMs: 0 })).toEqual(startClock(START));
  });
});
