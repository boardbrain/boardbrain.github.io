import { describe, expect, it } from 'vitest';
import { startClock } from '@/core/generation';
import { addMinutes, draftMinutes, setBeginning, toggleDraftPause } from './clockDraft';

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
