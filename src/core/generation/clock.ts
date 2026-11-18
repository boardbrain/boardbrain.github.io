import type { IsoTimestamp } from '@/core/model';
import { err, ok, type Result } from '@/core/shared';

/**
 * Timer of a running match (FA-AB-11, Specification 3.5, Architecture 10.2). Only moments are
 * stored, never the elapsed time, so the timer goes on while the app is closed and is stored
 * only when it is paused or resumed.
 */
export type SessionClock = {
  /** When the generation was completed for the first time (US-AB-07 AK-1). */
  readonly startedAt: IsoTimestamp;
  /** Since when the timer is paused; missing while it runs. */
  readonly pausedAt?: IsoTimestamp;
  /** Paused time before `pausedAt`, in milliseconds; it does not count (US-AB-07 AK-2). */
  readonly pausedMs: number;
};

/**
 * Error code when the timer is paused although it is paused already.
 */
export type ClockPausedError = 'clock-paused';

/**
 * Error code when the timer is resumed although it runs.
 */
export type ClockRunningError = 'clock-running';

function millisecondsBetween(from: IsoTimestamp, to: IsoTimestamp): number {
  return Math.max(0, Date.parse(to) - Date.parse(from));
}

/**
 * A timer that starts now (US-AB-07 AK-1).
 */
export function startClock(now: IsoTimestamp): SessionClock {
  return { startedAt: now, pausedMs: 0 };
}

/**
 * Pauses the timer (US-AB-07 AK-2); a paused timer stays paused, also after a restart (AK-3).
 */
export function pauseClock(
  clock: SessionClock,
  now: IsoTimestamp,
): Result<SessionClock, ClockPausedError> {
  if (clock.pausedAt !== undefined) {
    return err('clock-paused');
  }
  return ok({ ...clock, pausedAt: now });
}

/**
 * Resumes a paused timer; the time it was paused does not count (US-AB-07 AK-2).
 */
export function resumeClock(
  clock: SessionClock,
  now: IsoTimestamp,
): Result<SessionClock, ClockRunningError> {
  if (clock.pausedAt === undefined) {
    return err('clock-running');
  }
  return ok({
    startedAt: clock.startedAt,
    pausedMs: clock.pausedMs + millisecondsBetween(clock.pausedAt, now),
  });
}

/**
 * Error code when a corrected timer is impossible: its beginning lies in the future, or it
 * measures more time than has passed since its beginning or less than a minute.
 */
export type ClockCorrectionInvalidError = 'clock-correction-invalid';

/**
 * A correction of the timer from the overview (US-AB-07 AK-6): the beginning of the match, the
 * time measured so far and whether the timer is paused.
 */
export type ClockCorrection = {
  readonly startedAt: IsoTimestamp;
  readonly elapsedMs: number;
  readonly paused: boolean;
};

/**
 * Corrects the timer (US-AB-07 AK-6): afterwards it starts at `startedAt` and has measured
 * `elapsedMs` by `now`; the rest of the time since the beginning counts as paused. Paused, it
 * stays at that time until it is resumed.
 */
export function correctClock(
  correction: ClockCorrection,
  now: IsoTimestamp,
): Result<SessionClock, ClockCorrectionInvalidError> {
  const { startedAt, elapsedMs, paused } = correction;
  const sinceStart = Date.parse(now) - Date.parse(startedAt);
  if (
    !Number.isFinite(sinceStart) ||
    !Number.isFinite(elapsedMs) ||
    elapsedMs < 60_000 ||
    elapsedMs > sinceStart
  ) {
    return err('clock-correction-invalid');
  }
  const pausedMs = sinceStart - elapsedMs;
  return ok(paused ? { startedAt, pausedAt: now, pausedMs } : { startedAt, pausedMs });
}

/**
 * Time measured so far in milliseconds, without paused time (US-AB-07 AK-1 to AK-3). Never
 * negative, even if the clock of the device was set back.
 */
export function elapsedMilliseconds(clock: SessionClock, now: IsoTimestamp): number {
  const end = clock.pausedAt ?? now;
  return Math.max(0, millisecondsBetween(clock.startedAt, end) - clock.pausedMs);
}
