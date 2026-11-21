import {
  clockStretches,
  isClockPaused,
  type ClockEditError,
  type ClockPause,
  type ClockStretch,
  type SessionClock,
} from '@/core/generation';
import type { IsoTimestamp } from '@/core/model';
import { t } from '@/i18n/t';

const MINUTE = 60_000;

/**
 * One line of the history in the sheet of the timer (US-AB-07 AK-6), from the top.
 */
export type HistoryItem =
  | { readonly kind: 'start' }
  | { readonly kind: 'stretch'; readonly index: number; readonly stretch: ClockStretch }
  | { readonly kind: 'pause'; readonly index: number; readonly pause: ClockPause }
  | { readonly kind: 'now' };

/**
 * The history of a timer from the top: beginning, played stretches and pauses in turn, and "jetzt"
 * while it runs (design Z3+, D1).
 */
export function historyOf(clock: SessionClock): readonly HistoryItem[] {
  const stretches = clockStretches(clock);
  const items: HistoryItem[] = [{ kind: 'start' }];
  let next = 0;
  const pushStretch = (): void => {
    const stretch = stretches[next];
    if (stretch !== undefined) {
      items.push({ kind: 'stretch', index: next, stretch });
      next += 1;
    }
  };
  for (const [index, pause] of clock.pauses.entries()) {
    pushStretch();
    items.push({ kind: 'pause', index, pause });
  }
  if (!isClockPaused(clock)) {
    pushStretch();
    items.push({ kind: 'now' });
  }
  return items;
}

/**
 * Hours, minutes and seconds of a duration, for "1:23" with ":40" small.
 */
export function clockParts(milliseconds: number): {
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
} {
  const total = Math.floor(Math.max(0, milliseconds) / 1000);
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor(total / 60) % 60,
    seconds: total % 60,
  };
}

/**
 * "40 min" or "1 h 5 min": a duration in whole minutes, rounded down like the clock.
 */
export function durationText(milliseconds: number): string {
  const minutes = Math.floor(Math.max(0, milliseconds) / MINUTE);
  return minutes >= 60
    ? t('partie.dauerStunden', { stunden: Math.floor(minutes / 60), minuten: minutes % 60 })
    : t('partie.dauerMinuten', { minuten: minutes });
}

/**
 * "19:02": the time of day of a moment at the place of the device.
 */
export function timeOfDay(at: IsoTimestamp): string {
  const date = new Date(at);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * The last moment with this time of day (`HH:mm`) at the place of the device: today, or yesterday
 * if it is still to come today (a match over midnight). A calendar day back, not 24 hours: a day
 * with a change of the clocks has 23 or 25.
 */
export function lastTimeOfDay(time: string, now: number): IsoTimestamp {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  const date = new Date(now);
  date.setHours(hours, minutes, 0, 0);
  if (date.getTime() > now) {
    date.setDate(date.getDate() - 1);
    date.setHours(hours, minutes, 0, 0);
  }
  return date.toISOString();
}

/**
 * The edited draft after the timer was paused or resumed from the sheet: "Anhalten" acts at once
 * on the stored timer (from `before` to `after`), and the draft takes the same step, so pausing
 * alone is no change to save (US-AB-07 AK-7).
 */
export function mirrorToggle(
  draft: SessionClock,
  before: SessionClock,
  after: SessionClock,
): SessionClock {
  const last = after.pauses.at(-1);
  if (last === undefined) {
    return draft;
  }
  if (!isClockPaused(before) && isClockPaused(after)) {
    return { ...draft, pauses: [...draft.pauses, { from: last.from }] };
  }
  const open = draft.pauses.at(-1);
  if (
    isClockPaused(before) &&
    !isClockPaused(after) &&
    open?.to === undefined &&
    open !== undefined &&
    last.to !== undefined
  ) {
    return { ...draft, pauses: [...draft.pauses.slice(0, -1), { from: open.from, to: last.to }] };
  }
  return draft;
}

/**
 * Why a time or a pause is not taken, short (US-AB-07 AK-6). `pause` is the number of the
 * overlapped pause, `minutes` the most a pause in the stretch may last.
 */
export function editErrorText(
  error: ClockEditError,
  details: { readonly pause?: number; readonly minutes?: number } = {},
): string {
  switch (error) {
    case 'start-in-future':
    case 'pause-in-future':
      return t('partie.grundZukunft');
    case 'start-after-pause':
      return t('partie.grundNachPause');
    case 'pause-before-start':
      return t('partie.grundVorBeginn');
    case 'pause-ends-before-start':
      return t('partie.grundEndeVorAnfang');
    case 'pause-overlaps':
      return t('partie.grundUeberschneidet', { nummer: details.pause ?? 1 });
    case 'pause-running':
      return t('partie.grundLaeuft');
    case 'pause-too-short':
      return t('partie.grundZuKurz');
    case 'pause-too-long':
      return t('partie.grundZuLang', { anzahl: details.minutes ?? 0 });
  }
}
