import { describe, expect, it } from 'vitest';
import { startClock } from '@/core/generation';
import {
  addMinutes,
  draftMinutes,
  lastTimeOfDay,
  setBeginning,
  toggleDraftPause,
} from './clockDraft';

const MINUTE = 60_000;
const START = Date.parse('2026-11-20T19:00:00.000Z');
const at = (minutes: number): number => START + minutes * MINUTE;
const iso = (ms: number): string => new Date(ms).toISOString();

describe('US-AB-07 AK-6 correcting the timer in its details', () => {
  it('shows the same whole minutes as the overview, also 0', () => {
    const clock = startClock(iso(START));

    expect(draftMinutes(clock, at(0) + 30_000)).toBe(0);
    expect(draftMinutes(clock, at(83) + 59_000)).toBe(83);
  });

  it('more minutes than have passed move the beginning earlier', () => {
    const draft = addMinutes(startClock(iso(START)), 5, at(1));

    expect(draftMinutes(draft, at(1))).toBe(6);
    expect(draft.startedAt).toBe(iso(at(-5)));
    // It keeps running live.
    expect(draftMinutes(draft, at(3))).toBe(8);
  });

  it('+5 and −5 give the timer back as it was: the beginning returns, no pause appears', () => {
    const opened = startClock(iso(START));
    const anchor = opened.startedAt;
    const longer = addMinutes(opened, 5, at(1), anchor);
    const back = addMinutes(longer, -5, at(1), anchor);

    expect(longer.startedAt).toBe(iso(at(-5)));
    expect(back.startedAt).toBe(anchor);
    expect(back.pausedMs).toBe(0);
    expect(draftMinutes(back, at(1))).toBe(1);
  });

  it('more minutes first use up a pause, then move the beginning', () => {
    const paused = toggleDraftPause(startClock(iso(START)), at(10));
    const withBreak = toggleDraftPause(paused, at(20));
    const anchor = withBreak.startedAt;

    const shorterBreak = addMinutes(withBreak, 5, at(30), anchor);
    expect(shorterBreak.startedAt).toBe(anchor);
    expect(draftMinutes(shorterBreak, at(30))).toBe(25);
    const earlier = addMinutes(shorterBreak, 10, at(30), anchor);
    expect(earlier.startedAt).toBe(iso(at(-5)));
    expect(draftMinutes(earlier, at(30))).toBe(35);
  });

  it('fewer minutes count the rest as paused, never below 0', () => {
    const draft = addMinutes(startClock(iso(START)), -5, at(30));

    expect(draftMinutes(draft, at(30))).toBe(25);
    expect(draft.startedAt).toBe(iso(START));
    expect(draftMinutes(addMinutes(draft, -60, at(30)), at(30))).toBe(0);
  });

  it('an earlier beginning makes the duration longer by the same time', () => {
    const draft = setBeginning(startClock(iso(START)), iso(at(-12)), at(83));

    expect(draftMinutes(draft, at(83))).toBe(95);
  });

  it('a paused draft stands still until it is resumed', () => {
    const paused = toggleDraftPause(startClock(iso(START)), at(10));

    expect(draftMinutes(paused, at(40))).toBe(10);
    const resumed = toggleDraftPause(paused, at(40));
    expect(draftMinutes(resumed, at(45))).toBe(15);
    expect(draftMinutes(addMinutes(paused, 3, at(40)), at(50))).toBe(13);
  });
});

describe('US-AB-07 AK-6 the beginning as a time of day', () => {
  // Local times, as the device shows them.
  const local = (day: number, hours: number, minutes: number): number =>
    new Date(2026, 10, day, hours, minutes).getTime();

  it('is today, or yesterday if the time is still to come today', () => {
    const now = local(20, 21, 30);

    expect(lastTimeOfDay('19:45', now)).toBe(iso(local(20, 19, 45)));
    expect(lastTimeOfDay('22:00', now)).toBe(iso(local(19, 22, 0)));
  });

  it('a time in the future and then one in the past ends up today again', () => {
    const now = local(20, 21, 30);
    lastTimeOfDay('23:00', now);

    expect(lastTimeOfDay('20:00', now)).toBe(iso(local(20, 20, 0)));
  });

  it('yesterday is the calendar day before, also when the clocks change (25 Oct 2026)', () => {
    // In zones without a change of the clocks this is the same as 24 hours.
    expect(lastTimeOfDay('23:00', local(25, 10, 0))).toBe(iso(local(24, 23, 0)));
  });

  it('after midnight a beginning before midnight is yesterday', () => {
    expect(lastTimeOfDay('23:30', local(21, 0, 40))).toBe(iso(local(20, 23, 30)));
  });
});
