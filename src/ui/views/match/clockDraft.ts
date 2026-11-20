import {
  correctClock,
  elapsedMilliseconds,
  pauseClock,
  resumeClock,
  type SessionClock,
} from '@/core/generation';

const MINUTE = 60_000;

function iso(ms: number): string {
  return new Date(ms).toISOString();
}

// A draft with this beginning and this measured time at `now`, paused or not. The beginning moves
// earlier when more time is measured than has passed since it (Product Owner 20.11.2026); the
// rest of the time since the beginning counts as paused.
function redraft(
  draft: SessionClock,
  startedAt: string,
  elapsedMs: number,
  now: number,
): SessionClock {
  const target = Math.max(0, elapsedMs);
  const start = Math.min(Date.parse(startedAt), now - target);
  const corrected = correctClock(
    { startedAt: iso(start), elapsedMs: target, isPaused: draft.pausedAt !== undefined },
    iso(now),
  );
  return corrected.ok ? corrected.value : draft;
}

/**
 * Whole minutes the draft has measured at `now`, as the overview shows them.
 */
export function draftMinutes(draft: SessionClock, now: number): number {
  return Math.floor(elapsedMilliseconds(draft, iso(now)) / MINUTE);
}

/**
 * The draft with `minutes` more or fewer measured (US-AB-07 AK-6), never below 0. `anchor` is the
 * beginning the window opened with or that was set by hand: more time first uses up a pause, then
 * moves the beginning earlier; less time moves it back, never later than `anchor`, and only then
 * counts as paused. So +5 and −5 give the timer back as it was (Product Owner 20.11.2026).
 */
export function addMinutes(
  draft: SessionClock,
  minutes: number,
  now: number,
  anchor: string = draft.startedAt,
): SessionClock {
  const elapsed = elapsedMilliseconds(draft, iso(now));
  return redraft(draft, anchor, elapsed + minutes * MINUTE, now);
}

/**
 * The draft with another beginning: the measured time grows or shrinks by as much as the
 * beginning moves, never below 0.
 */
export function setBeginning(draft: SessionClock, startedAt: string, now: number): SessionClock {
  const elapsed = elapsedMilliseconds(draft, iso(now));
  const shift = Date.parse(draft.startedAt) - Date.parse(startedAt);
  return redraft(draft, startedAt, elapsed + shift, now);
}

/**
 * The draft paused or resumed at `now`.
 */
export function toggleDraftPause(draft: SessionClock, now: number): SessionClock {
  const changed =
    draft.pausedAt === undefined ? pauseClock(draft, iso(now)) : resumeClock(draft, iso(now));
  return changed.ok ? changed.value : draft;
}
