import type { IsoTimestamp } from '@/core/model';
import { assert, err, ok, type Result } from '@/core/shared';

const MINUTE = 60_000;

/**
 * A pause of the timer (ADR-031): from when, and until when; missing while it lasts.
 */
export type ClockPause = {
  readonly from: IsoTimestamp;
  readonly to?: IsoTimestamp;
};

/**
 * Timer of a running match (FA-AB-11, Specification 3.5, Architecture 10.2, ADR-031). Only
 * moments are stored, never the elapsed time, so the timer goes on while the app is closed and is
 * stored only when it is paused, resumed or edited. The pauses are in order and do not overlap;
 * only the last one may still last, and then the timer is paused.
 */
export type SessionClock = {
  /** When the generation was completed for the first time (US-AB-07 AK-1), or set by hand. */
  readonly startedAt: IsoTimestamp;
  readonly pauses: readonly ClockPause[];
};

/**
 * The timer as version 4 of the session stored it: the paused time only as a sum.
 */
export type ClockVersion4 = {
  readonly startedAt: IsoTimestamp;
  readonly pausedAt?: IsoTimestamp;
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

/**
 * Why a time in the sheet of the timer is not taken (US-AB-07 AK-6).
 */
export type ClockEditError =
  | 'start-in-future'
  | 'start-after-pause'
  | 'pause-before-start'
  | 'pause-ends-before-start'
  | 'pause-in-future'
  | 'pause-overlaps'
  | 'pause-running'
  | 'pause-too-short'
  | 'pause-too-long';

/**
 * Error code for a timer that breaks its rules (see `SessionClock`).
 */
export type ClockInvalidError = 'clock-invalid';

/**
 * A stretch of the match that was played, between the beginning or a pause and the next pause or
 * now (`to` missing).
 */
export type ClockStretch = {
  readonly from: IsoTimestamp;
  readonly to?: IsoTimestamp;
};

function time(at: IsoTimestamp): number {
  return Date.parse(at);
}

function iso(ms: number): IsoTimestamp {
  return new Date(ms).toISOString();
}

function sorted(pauses: readonly ClockPause[]): readonly ClockPause[] {
  return [...pauses].sort((a, b) => time(a.from) - time(b.from));
}

/**
 * A timer that starts now (US-AB-07 AK-1).
 */
export function startClock(now: IsoTimestamp): SessionClock {
  return { startedAt: now, pauses: [] };
}

/**
 * Whether the timer is paused: its last pause still lasts.
 */
export function isClockPaused(clock: SessionClock): boolean {
  const last = clock.pauses.at(-1);
  return last !== undefined && last.to === undefined;
}

/**
 * Whether two timers have the same beginning and the same pauses (ADR-031).
 */
export function isSameClock(a: SessionClock, b: SessionClock): boolean {
  if (a.startedAt !== b.startedAt || a.pauses.length !== b.pauses.length) {
    return false;
  }
  return a.pauses.every((pause, i) => {
    const other = b.pauses[i];
    return pause.from === other?.from && pause.to === other.to;
  });
}

/**
 * Pauses the timer (US-AB-07 AK-2); a paused timer stays paused, also after a restart (AK-3).
 */
export function pauseClock(
  clock: SessionClock,
  now: IsoTimestamp,
): Result<SessionClock, ClockPausedError> {
  if (isClockPaused(clock)) {
    return err('clock-paused');
  }
  return ok({ ...clock, pauses: [...clock.pauses, { from: now }] });
}

/**
 * Resumes a paused timer; the time it was paused does not count (US-AB-07 AK-2). If the clock of
 * the device was set back, the pause ends where it began.
 */
export function resumeClock(
  clock: SessionClock,
  now: IsoTimestamp,
): Result<SessionClock, ClockRunningError> {
  const last = clock.pauses.at(-1);
  if (last?.to !== undefined || last === undefined) {
    return err('clock-running');
  }
  const to = iso(Math.max(time(now), time(last.from)));
  return ok({ ...clock, pauses: [...clock.pauses.slice(0, -1), { from: last.from, to }] });
}

/**
 * Paused time up to `now` in milliseconds; only what lies after the beginning counts.
 */
export function pausedMilliseconds(clock: SessionClock, now: IsoTimestamp): number {
  const start = time(clock.startedAt);
  const end = time(now);
  return clock.pauses.reduce((sum, pause) => {
    const from = Math.max(time(pause.from), start);
    const to = Math.min(pause.to === undefined ? end : time(pause.to), end);
    return sum + Math.max(0, to - from);
  }, 0);
}

/**
 * Time measured so far in milliseconds, without paused time (US-AB-07 AK-1 to AK-3). Never
 * negative, even if the clock of the device was set back.
 */
export function elapsedMilliseconds(clock: SessionClock, now: IsoTimestamp): number {
  const sinceStart = time(now) - time(clock.startedAt);
  return Math.max(0, sinceStart - pausedMilliseconds(clock, now));
}

/**
 * Checks a timer as a whole (ADR-031): the beginning is not in the future, the pauses come in
 * order after the beginning, do not overlap, are not in the future, and only the last one may
 * still last.
 */
export function checkClock(
  clock: SessionClock,
  now: IsoTimestamp,
): Result<SessionClock, ClockInvalidError> {
  const end = time(now);
  let previous = time(clock.startedAt);
  if (!Number.isFinite(previous) || previous > end) {
    return err('clock-invalid');
  }
  for (const [index, pause] of clock.pauses.entries()) {
    const from = time(pause.from);
    const isLast = index === clock.pauses.length - 1;
    if (!Number.isFinite(from) || from < previous || from > end) {
      return err('clock-invalid');
    }
    if (pause.to === undefined) {
      if (!isLast) {
        return err('clock-invalid');
      }
      previous = from;
    } else {
      const to = time(pause.to);
      if (!Number.isFinite(to) || to < from || to > end) {
        return err('clock-invalid');
      }
      previous = to;
    }
  }
  return ok(clock);
}

/**
 * The index of a pause other than `except` that the time from `from` to `to` (or still lasting)
 * overlaps, for the message "überschneidet Pause 2"; `undefined` if none.
 */
export function overlappingPause(
  clock: SessionClock,
  from: IsoTimestamp,
  to: IsoTimestamp | undefined,
  now: IsoTimestamp,
  except?: number,
): number | undefined {
  const start = time(from);
  const end = time(to ?? now);
  const index = clock.pauses.findIndex(
    (pause, i) => i !== except && start < time(pause.to ?? now) && end > time(pause.from),
  );
  return index === -1 ? undefined : index;
}

/**
 * Sets the beginning of the match (US-AB-07 AK-6); not in the future and not after the first
 * pause.
 */
export function setClockStart(
  clock: SessionClock,
  startedAt: IsoTimestamp,
  now: IsoTimestamp,
): Result<SessionClock, ClockEditError> {
  if (time(startedAt) > time(now)) {
    return err('start-in-future');
  }
  const first = clock.pauses[0];
  if (first !== undefined && time(startedAt) > time(first.from)) {
    return err('start-after-pause');
  }
  return ok({ ...clock, startedAt });
}

/**
 * Sets the times of a pause (US-AB-07 AK-6). A pause that still lasts keeps lasting (`to`
 * missing); the others need an end after their beginning. A pause must not lie before the
 * beginning, in the future or over another pause.
 */
export function setPauseTimes(
  clock: SessionClock,
  index: number,
  from: IsoTimestamp,
  to: IsoTimestamp | undefined,
  now: IsoTimestamp,
): Result<SessionClock, ClockEditError> {
  const pause = clock.pauses[index];
  // The sheet keeps a lasting pause lasting and gives the others an end.
  assert(
    pause !== undefined && (to === undefined) === (pause.to === undefined),
    `pause ${String(index)} gets times that fit it`,
  );
  if (time(from) < time(clock.startedAt)) {
    return err('pause-before-start');
  }
  if (to !== undefined && time(to) <= time(from)) {
    return err('pause-ends-before-start');
  }
  if (time(from) > time(now) || (to !== undefined && time(to) > time(now))) {
    return err('pause-in-future');
  }
  if (overlappingPause(clock, from, to, now, index) !== undefined) {
    return err('pause-overlaps');
  }
  const changed = clock.pauses.map((other, i) =>
    i === index ? { from, ...(to === undefined ? {} : { to }) } : other,
  );
  return ok({ ...clock, pauses: sorted(changed) });
}

/**
 * Removes a pause (US-AB-07 AK-6); the time counts again. A pause that still lasts ends by
 * resuming the timer instead.
 */
export function removePause(
  clock: SessionClock,
  index: number,
): Result<SessionClock, ClockEditError> {
  const pause = clock.pauses[index];
  assert(pause !== undefined, `pause ${String(index)} exists`);
  if (pause.to === undefined) {
    return err('pause-running');
  }
  return ok({ ...clock, pauses: clock.pauses.filter((_, i) => i !== index) });
}

/**
 * The stretches that were played, in order (US-AB-07 AK-6): from the beginning or the end of a
 * pause to the next pause; the last one up to now (`to` missing) unless the timer is paused.
 */
export function clockStretches(clock: SessionClock): readonly ClockStretch[] {
  const stretches: ClockStretch[] = [];
  let from: IsoTimestamp | undefined = clock.startedAt;
  for (const pause of clock.pauses) {
    if (from !== undefined) {
      stretches.push({ from, to: pause.from });
    }
    from = pause.to;
  }
  if (from !== undefined) {
    stretches.push({ from });
  }
  return stretches;
}

/**
 * Whole minutes a pause in this stretch may last at most (US-AB-07 AK-6).
 */
export function stretchMinutes(stretch: ClockStretch, now: IsoTimestamp): number {
  const end = time(stretch.to ?? now);
  return Math.max(0, Math.floor((end - time(stretch.from)) / MINUTE));
}

/**
 * Adds a pause of whole `minutes` in the middle of a played stretch (US-AB-07 AK-6, Product
 * Owner 21.11.2026), on whole minutes where it fits, always inside the stretch. The exact times
 * can be changed afterwards.
 */
export function addPauseInStretch(
  clock: SessionClock,
  stretchIndex: number,
  minutes: number,
  now: IsoTimestamp,
): Result<SessionClock, ClockEditError> {
  const stretch = clockStretches(clock)[stretchIndex];
  assert(stretch !== undefined, `stretch ${String(stretchIndex)} exists`);
  if (!Number.isInteger(minutes) || minutes < 1) {
    return err('pause-too-short');
  }
  if (minutes > stretchMinutes(stretch, now)) {
    return err('pause-too-long');
  }
  const start = time(stretch.from);
  const end = time(stretch.to ?? now);
  const length = minutes * MINUTE;
  const middle = Math.round((start + (end - start) / 2 - length / 2) / MINUTE) * MINUTE;
  const from = Math.max(start, Math.min(middle, end - length));
  const pause = { from: iso(from), to: iso(from + length) };
  return ok({ ...clock, pauses: sorted([...clock.pauses, pause]) });
}

/**
 * The timer of a session of version 4 (ADR-031): the sum of its pauses becomes one pause right
 * after the beginning, so the measured time stays exactly the same; a running pause follows.
 */
export function clockFromVersion4(clock: ClockVersion4): SessionClock {
  const start = time(clock.startedAt);
  const pausedAt = clock.pausedAt === undefined ? undefined : time(clock.pausedAt);
  const pauses: ClockPause[] = [];
  const sum = Math.max(0, clock.pausedMs);
  if (sum > 0) {
    pauses.push({ from: clock.startedAt, to: iso(Math.min(start + sum, pausedAt ?? Infinity)) });
  }
  if (clock.pausedAt !== undefined && pausedAt !== undefined) {
    const after = pauses[0]?.to;
    pauses.push({ from: iso(Math.max(pausedAt, after === undefined ? pausedAt : time(after))) });
  }
  return { startedAt: clock.startedAt, pauses };
}
