import { describe, expect, it } from 'vitest';
import { pauseClock, resumeClock, type SessionClock } from '@/core/generation';
import type { Result } from '@/core/shared';
import {
  clockParts,
  durationText,
  editErrorText,
  historyOf,
  lastTimeOfDay,
  mirrorToggle,
} from './clockHistory';

const START = '2026-11-15T18:00:00.000Z';
const MINUTE = 60_000;
const at = (minutes: number): string =>
  new Date(Date.parse(START) + minutes * MINUTE).toISOString();
const PLAYED: SessionClock = { startedAt: START, pauses: [{ from: at(40), to: at(52) }] };

function value<T>(result: Result<T, string>): T {
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

describe('US-AB-07 AK-6 the history in the sheet of the timer', () => {
  it('lists beginning, played stretches, pauses and now from the top', () => {
    expect(historyOf(PLAYED)).toEqual([
      { kind: 'start' },
      { kind: 'stretch', index: 0, stretch: { from: START, to: at(40) } },
      { kind: 'pause', index: 0, pause: { from: at(40), to: at(52) } },
      { kind: 'stretch', index: 1, stretch: { from: at(52) } },
      { kind: 'now' },
    ]);
  });

  it('a paused timer ends with its lasting pause and "jetzt"', () => {
    const paused = value(pauseClock(PLAYED, at(90)));

    expect(historyOf(paused).map((item) => item.kind)).toEqual([
      'start',
      'stretch',
      'pause',
      'stretch',
      'pause',
      'now',
    ]);
  });

  it('AK-1: hours, minutes and the seconds apart', () => {
    expect(clockParts(83 * MINUTE + 40_000)).toEqual({ hours: 1, minutes: 23, seconds: 40 });
    expect(clockParts(-5)).toEqual({ hours: 0, minutes: 0, seconds: 0 });
  });

  it('durations in minutes, from an hour in hours and minutes, rounded down', () => {
    expect(durationText(40 * MINUTE + 59_000)).toBe('40 min');
    expect(durationText(65 * MINUTE)).toBe('1 h 5 min');
  });

  it('says short why a time is not taken', () => {
    expect(editErrorText('pause-overlaps', { pause: 2 })).toBe('überschneidet Pause 2');
    expect(editErrorText('pause-too-long', { minutes: 40 })).toBe(
      'höchstens 40 min in dieser Strecke',
    );
    expect(editErrorText('pause-before-start')).toBe('vor dem Beginn');
  });
});

describe('US-AB-07 AK-7 pausing in the sheet is no change to save', () => {
  it('a pause started from the sheet is taken into the draft', () => {
    const edited: SessionClock = { ...PLAYED, startedAt: at(-5) };
    const after = value(pauseClock(PLAYED, at(90)));

    expect(mirrorToggle(edited, PLAYED, after)).toEqual({
      startedAt: at(-5),
      pauses: [{ from: at(40), to: at(52) }, { from: at(90) }],
    });
  });

  it('resuming ends the lasting pause of the draft at the same moment', () => {
    const before = value(pauseClock(PLAYED, at(90)));
    const after = value(resumeClock(before, at(93)));

    expect(mirrorToggle(before, before, after)).toEqual(after);
  });

  it('anything else leaves the draft as it is', () => {
    expect(mirrorToggle(PLAYED, PLAYED, PLAYED)).toBe(PLAYED);
  });
});

describe('US-AB-07 AK-6 a time of day', () => {
  const local = (day: number, hours: number, minutes: number): number =>
    new Date(2026, 10, day, hours, minutes).getTime();

  it('is today, or yesterday if it is still to come today', () => {
    const now = local(20, 21, 30);

    expect(lastTimeOfDay('19:45', now)).toBe(new Date(local(20, 19, 45)).toISOString());
    expect(lastTimeOfDay('22:00', now)).toBe(new Date(local(19, 22, 0)).toISOString());
  });

  it('yesterday is the calendar day before, also when the clocks change (25 Oct 2026)', () => {
    expect(lastTimeOfDay('23:00', local(25, 10, 0))).toBe(new Date(local(24, 23, 0)).toISOString());
  });
});
