import { animate, m, useMotionValue, useReducedMotion } from 'motion/react';
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, useTransition } from 'react';
import { useBlocker } from 'react-router';
import {
  addPauseInStretch,
  elapsedMilliseconds,
  isClockPaused,
  isSameClock,
  overlappingPause,
  pausedMilliseconds,
  removePause,
  setClockStart,
  setPauseTimes,
  stretchMinutes,
  type ClockEditError,
  type ClockPause,
  type ClockStretch,
  type SessionClock,
} from '@/core/generation';
import type { IsoTimestamp } from '@/core/model';
import type { Result } from '@/core/shared';
import { t } from '@/i18n/t';
import { useAppDependencies } from '@/ui/AppDependencies';
import { PauseIcon, PlayIcon, TrashIcon } from '@/ui/components/Icons';
import { PressableButton } from '@/ui/components/Pressable';
import { Swap } from '@/ui/components/Swap';
import { Unfold } from '@/ui/components/Unfold';
import { cx } from '@/ui/components/classNames';
import { MatchDialog } from './MatchDialog';
import shared from './Match.module.css';
import {
  clockParts,
  durationText,
  editErrorText,
  historyOf,
  lastTimeOfDay,
  mirrorToggle,
  timeOfDay,
} from './clockHistory';
import styles from './ClockSheet.module.css';

const QUICK_MINUTES = [5, 15, 30] as const;
const SUGGESTED_MINUTES = 10;
const BIG_ICON_SIZE = 26;
const TRASH_SIZE = 16;
// Dragging down this far, or quicker over a shorter way, closes the sheet.
const CLOSE_DISTANCE = 90;
const FLICK_DISTANCE = 40;
const FLICK_SPEED = 0.6;
const ENTER = { type: 'spring', bounce: 0.18, duration: 0.45 } as const;
const SNAP_BACK = { type: 'spring', bounce: 0.3, duration: 0.4 } as const;
const LEAVE = { duration: 0.2 } as const;
// A time that is not taken shakes once, a pause added or removed opens or closes in the history.
const SHAKE = { x: [0, -5, 5, -3, 3, 0] };
const SHAKE_TIMING = { duration: 0.35, ease: 'easeOut' } as const;
const ITEM_TIMING = { duration: 0.2, ease: 'easeOut' } as const;
const ICON_FROM = { opacity: 0, scale: 0.6 };

// Opens or closes an entry of the history; the inline styles go again once it is open.
function unfoldItem(item: Element, isOpening: boolean): Promise<void> {
  if (!(item instanceof HTMLElement)) {
    return Promise.resolve();
  }
  const height = item.offsetHeight;
  item.style.overflow = 'hidden';
  const keyframes = isOpening
    ? { height: [0, height], opacity: [0, 1] }
    : { height: [height, 0], opacity: [1, 0] };
  return animate(item, keyframes, ITEM_TIMING).then(() => {
    if (isOpening) {
      item.style.removeProperty('height');
      item.style.removeProperty('overflow');
    }
  });
}

// A pause and the played stretch after it, as they stand in the history.
function pauseItems(sheet: HTMLElement | null, pause: ClockPause): Element[] {
  const item = sheet?.querySelector(`[data-history="pause-${pause.from}"]`) ?? null;
  const after = item?.nextElementSibling ?? null;
  return [item, after].filter((element) => element !== null);
}

type Adding = { readonly stretch: number; readonly minutes: string };
type Drag = { readonly y: number; readonly at: number };

function iso(ms: number): IsoTimestamp {
  return new Date(ms).toISOString();
}

/**
 * A duration as "1:23" with the seconds small beside it, ":40" (US-AB-07 AK-1).
 */
export function ClockTime({
  milliseconds,
  className,
}: {
  readonly milliseconds: number;
  readonly className?: string | undefined;
}): React.JSX.Element {
  const { hours, minutes, seconds } = clockParts(milliseconds);
  return (
    <span className={cx(styles.time, className)}>
      {t('partie.uhrZeit', { stunden: hours, minuten: String(minutes).padStart(2, '0') })}
      <span className={styles.seconds}>
        {t('partie.uhrSekunden', { sekunden: String(seconds).padStart(2, '0') })}
      </span>
    </span>
  );
}

// A time of day that is tapped to change it: the native picker lies invisibly on top (A2).
function TimeField({
  at,
  label,
  isBad,
  onPick,
}: {
  readonly at: IsoTimestamp;
  readonly label: string;
  readonly isBad: boolean;
  /** Takes the time; false when it is not taken, then the field shakes once. */
  readonly onPick: (at: IsoTimestamp) => boolean;
}): React.JSX.Element {
  const text = timeOfDay(at);
  const shownRef = useRef<HTMLSpanElement>(null);
  const isReduced = useReducedMotion() === true;
  return (
    <label className={styles.pickWrap}>
      <span ref={shownRef} className={cx(styles.tap, isBad && styles.bad)}>
        {text}
      </span>
      <input
        type="time"
        className={styles.pickNative}
        value={text}
        aria-label={label}
        aria-invalid={isBad}
        onChange={(event) => {
          const shown = shownRef.current;
          if (
            event.target.value !== '' &&
            !onPick(lastTimeOfDay(event.target.value, Date.now())) &&
            shown !== null &&
            !isReduced
          ) {
            void animate(shown, SHAKE, SHAKE_TIMING);
          }
        }}
      />
    </label>
  );
}

type ClockSheetProps = {
  /** The stored timer; it changes when the timer is paused or resumed. */
  readonly clock: SessionClock;
  /** Now, in milliseconds; the sheet counts on with it. */
  readonly now: number;
  /** Leaves the sheet, like the back gesture; with unsaved changes it asks first. */
  readonly onClose: () => void;
};

/**
 * The history of the timer as a sheet from below (US-AB-07 AK-6, AK-7, ADR-031, reference
 * `i3b-clock-final-preview.html`): the beginning, played stretches and pauses from the top, each
 * time can be changed, pauses removed and added in minutes. The changes are a draft that "Fertig"
 * stores; any other way of closing asks first. Pausing acts at once.
 */
export function ClockSheet({ clock, now, onClose }: ClockSheetProps): React.JSX.Element {
  const { session } = useAppDependencies();
  const [, startTransition] = useTransition();
  const [draft, setDraft] = useState(clock);
  // The stored timer the draft is based on; it follows the pausing done in the sheet.
  const [expected, setExpected] = useState(clock);
  const [adding, setAdding] = useState<Adding | null>(null);
  const [errors, setErrors] = useState<Readonly<Record<string, string>>>({});
  const [failure, setFailure] = useState<string | null>(null);
  // Closing with changes by tapping beside, the handle or "pulling": the sheet asks itself;
  // the back gesture asks through the router (useBlocker).
  const [isAsking, setIsAsking] = useState(false);
  const isDirty = !isSameClock(draft, expected);
  const blocker = useBlocker(isDirty);
  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const y = useMotionValue(0);
  const isReduced = useReducedMotion() === true;
  // A pause just added, to open it in the history; a pause being removed closes first.
  const appearing = useRef<ClockPause | null>(null);
  const isRemoving = useRef(false);
  const nowIso = iso(now);
  const isPaused = isClockPaused(draft);
  const isStoredPaused = isClockPaused(clock);

  // Motion (external system): an added pause and the stretch after it open in the history.
  useLayoutEffect(() => {
    const added = appearing.current;
    appearing.current = null;
    if (added !== null && !isReduced) {
      for (const item of pauseItems(sheetRef.current, added)) {
        void unfoldItem(item, true);
      }
    }
  }, [draft, isReduced]);

  // The router holds the blocked closing (external system); once saved it may go on.
  useEffect(() => {
    if (blocker.state === 'blocked' && !isDirty) {
      blocker.proceed();
    }
  }, [blocker, isDirty]);

  const close = (): void => {
    if (isDirty) {
      void animate(y, 0, SNAP_BACK);
      setIsAsking(true);
      return;
    }
    const height = sheetRef.current?.offsetHeight ?? 0;
    void animate(y, height, LEAVE).then(onClose);
  };

  // Drag ends: far or quick enough closes, otherwise the sheet springs back.
  const release = (distance: number, milliseconds: number): void => {
    const speed = distance / Math.max(1, milliseconds);
    if (distance > CLOSE_DISTANCE || (distance > FLICK_DISTANCE && speed > FLICK_SPEED)) {
      close();
    } else {
      void animate(y, 0, SNAP_BACK);
    }
  };
  const releaseTouch = useEffectEvent((distance: number, milliseconds: number) => {
    release(distance, milliseconds);
  });

  // Motion (external system): the sheet comes up from below. Touch on the sheet itself, scrolled
  // to the top, pulls it down like the handle; the listener must be able to stop scrolling.
  useEffect(() => {
    const sheet = sheetRef.current;
    if (sheet === null) {
      return undefined;
    }
    y.set(sheet.offsetHeight);
    const entering = animate(y, 0, ENTER);
    let start: Drag | null = null;
    let isPulling = false;
    const onStart = (event: TouchEvent): void => {
      const touch = event.touches[0];
      const target = event.target;
      const isControl =
        target instanceof Element && target.closest('input, label, button') !== null;
      start =
        event.touches.length === 1 && touch !== undefined && !isControl
          ? { y: touch.clientY, at: Date.now() }
          : null;
      isPulling = false;
    };
    const onMove = (event: TouchEvent): void => {
      const touch = event.touches[0];
      if (start === null || touch === undefined) {
        return;
      }
      const distance = touch.clientY - start.y;
      if (!isPulling) {
        if (sheet.scrollTop > 0 || distance < 0) {
          start = null;
          return;
        }
        isPulling = distance > 8;
      }
      if (isPulling) {
        event.preventDefault();
        y.set(Math.max(0, distance));
      }
    };
    const onEnd = (): void => {
      if (start !== null && isPulling) {
        releaseTouch(y.get(), Date.now() - start.at);
      }
      start = null;
      isPulling = false;
    };
    sheet.addEventListener('touchstart', onStart, { passive: true });
    sheet.addEventListener('touchmove', onMove, { passive: false });
    sheet.addEventListener('touchend', onEnd);
    sheet.addEventListener('touchcancel', onEnd);
    return () => {
      entering.stop();
      sheet.removeEventListener('touchstart', onStart);
      sheet.removeEventListener('touchmove', onMove);
      sheet.removeEventListener('touchend', onEnd);
      sheet.removeEventListener('touchcancel', onEnd);
    };
  }, [y]);

  // A time that is not taken stays as it was, and the line says why (US-AB-07 AK-6).
  const apply = (
    key: string,
    result: Result<SessionClock, ClockEditError>,
    details: { readonly pause?: number; readonly minutes?: number } = {},
  ): boolean => {
    const others = Object.fromEntries(Object.entries(errors).filter(([other]) => other !== key));
    if (result.ok) {
      setDraft(result.value);
      setErrors(others);
    } else {
      const grund = editErrorText(result.error, details);
      setErrors({ ...others, [key]: t('partie.nichtUebernommen', { grund }) });
    }
    return result.ok;
  };

  const pauseTimes = (index: number, from: IsoTimestamp, to: IsoTimestamp | undefined): boolean => {
    const overlapped = overlappingPause(draft, from, to, nowIso, index);
    return apply(`pause-${String(index)}`, setPauseTimes(draft, index, from, to, nowIso), {
      pause: (overlapped ?? 0) + 1,
    });
  };

  // The pause and the stretch after it close, then the pause is gone from the draft.
  const remove = (pause: ClockPause, key: string): void => {
    if (isRemoving.current) {
      return;
    }
    isRemoving.current = true;
    const items = isReduced ? [] : pauseItems(sheetRef.current, pause);
    void Promise.all(items.map((item) => unfoldItem(item, false))).then(() => {
      isRemoving.current = false;
      setDraft((current) => {
        const index = current.pauses.findIndex((other) => other.from === pause.from);
        const removed = index < 0 ? undefined : removePause(current, index);
        return removed?.ok === true ? removed.value : current;
      });
      setErrors((current) =>
        Object.fromEntries(Object.entries(current).filter(([other]) => other !== key)),
      );
    });
  };

  const save = (then: () => void, otherwise: () => void = () => undefined): void => {
    startTransition(async () => {
      const saved = await session.replaceClock(expected, draft);
      if (saved.ok) {
        setExpected(draft);
        setFailure(null);
        then();
      } else {
        // E.g. paused on another device meanwhile; nothing is stored.
        setFailure(t('partie.uhrNichtUebernommen'));
        otherwise();
      }
    });
  };

  const togglePause = (): void => {
    const before = clock;
    startTransition(async () => {
      const changed = await (isClockPaused(before) ? session.resumeClock() : session.pauseClock());
      const after = changed.ok ? changed.value.clock : undefined;
      if (after !== undefined) {
        setDraft((current) => mirrorToggle(current, before, after));
        setExpected(after);
      }
    });
  };

  const adder = (stretch: ClockStretch, index: number, state: Adding): React.JSX.Element => {
    const room = stretchMinutes(stretch, nowIso);
    const text = state.minutes.trim();
    const result: Result<SessionClock, ClockEditError> = /^\d+$/u.test(text)
      ? addPauseInStretch(draft, index, Number(text), nowIso)
      : { ok: false, error: 'pause-too-short' };
    const after = result.ok ? clockParts(elapsedMilliseconds(result.value, nowIso)) : null;
    return (
      <div className={styles.adder}>
        <div className={styles.adderHead}>
          <b>{t('partie.pauseNachtragen')}</b>
          {after !== null && (
            <span className={styles.sub}>
              {t('partie.danach', {
                zeit: t('partie.uhrZeit', {
                  stunden: after.hours,
                  minuten: String(after.minutes).padStart(2, '0'),
                }),
              })}
            </span>
          )}
        </div>
        <div className={styles.quickRow}>
          {QUICK_MINUTES.map((minutes) => (
            <PressableButton
              key={minutes}
              type="button"
              className={cx(styles.chip, text === String(minutes) && styles.chipOn)}
              aria-label={t('partie.schnellwahl', { anzahl: minutes })}
              aria-pressed={text === String(minutes)}
              disabled={minutes > room}
              onClick={() => {
                setAdding({ ...state, minutes: String(minutes) });
              }}
            >
              {minutes}
            </PressableButton>
          ))}
          <input
            className={cx(styles.minutes, !result.ok && styles.bad)}
            inputMode="numeric"
            enterKeyHint="done"
            autoComplete="off"
            aria-label={t('partie.pauseMinuten')}
            aria-invalid={!result.ok}
            value={state.minutes}
            onChange={(event) => {
              setAdding({ ...state, minutes: event.target.value });
            }}
            onKeyDown={(event) => {
              // The key of the phone keyboard only closes it (as in the result form).
              if (event.key === 'Enter') {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
          />
          <span>{t('partie.minuten')}</span>
        </div>
        <Unfold isOpen={!result.ok} isQuick>
          <p className={styles.error} role="alert">
            {result.ok ? '' : editErrorText(result.error, { minutes: room })}
          </p>
        </Unfold>
        <div className={styles.buttons}>
          <PressableButton
            type="button"
            className={shared.secondary}
            onClick={() => {
              setAdding(null);
            }}
          >
            {t('partie.abbrechen')}
          </PressableButton>
          <PressableButton
            type="button"
            className={shared.primary}
            disabled={!result.ok}
            onClick={() => {
              if (result.ok) {
                appearing.current =
                  result.value.pauses.find((pause) => !draft.pauses.includes(pause)) ?? null;
                setDraft(result.value);
                setAdding(null);
              }
            }}
          >
            {t('partie.hinzufuegen')}
          </PressableButton>
        </div>
      </div>
    );
  };

  const pauseLine = (pause: ClockPause, index: number): React.JSX.Element => {
    const nummer = index + 1;
    const key = `pause-${String(index)}`;
    const error = errors[key];
    return (
      <div className={styles.pause}>
        <div className={styles.range}>
          <b>{t('partie.pauseNummer', { nummer })}</b>
          <TimeField
            at={pause.from}
            label={t('partie.pauseVon', { nummer })}
            isBad={error !== undefined}
            onPick={(from) => pauseTimes(index, from, pause.to)}
          />
          <span aria-hidden="true">{t('partie.zeitBis')}</span>
          {pause.to === undefined ? (
            <span className={styles.muted}>{t('partie.uhrJetzt')}</span>
          ) : (
            <TimeField
              at={pause.to}
              label={t('partie.pauseBis', { nummer })}
              isBad={error !== undefined}
              onPick={(to) => pauseTimes(index, pause.from, to)}
            />
          )}
          <span className={styles.spacer} />
          {pause.to === undefined ? (
            <ClockTime milliseconds={now - Date.parse(pause.from)} className={styles.live} />
          ) : (
            <span className={styles.muted}>
              {durationText(Date.parse(pause.to) - Date.parse(pause.from))}
            </span>
          )}
          {pause.to !== undefined && (
            <PressableButton
              type="button"
              className={styles.trash}
              aria-label={t('partie.pauseLoeschen', { nummer })}
              onClick={() => {
                remove(pause, key);
              }}
            >
              <TrashIcon size={TRASH_SIZE} />
            </PressableButton>
          )}
        </div>
        <Unfold isOpen={error !== undefined} isQuick>
          <p className={styles.error} role="alert">
            {error}
          </p>
        </Unfold>
      </div>
    );
  };

  const startError = errors.start;
  const pausedFor = durationText(pausedMilliseconds(draft, nowIso));
  return (
    <>
      <div
        className={styles.backdrop}
        onClick={() => {
          close();
        }}
      />
      <m.div
        ref={sheetRef}
        className={styles.sheet}
        style={{ y }}
        role="dialog"
        aria-modal="true"
        aria-label={t('partie.spieldauer')}
      >
        <PressableButton
          type="button"
          className={styles.grab}
          aria-label={t('partie.uhrSchliessen')}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { y: event.clientY, at: Date.now() };
          }}
          onPointerMove={(event) => {
            if (drag.current !== null) {
              y.set(Math.max(0, event.clientY - drag.current.y));
            }
          }}
          onPointerUp={() => {
            const started = drag.current;
            drag.current = null;
            if (started !== null) {
              const distance = y.get();
              if (distance < 4) {
                close();
              } else {
                release(distance, Date.now() - started.at);
              }
            }
          }}
          onPointerCancel={() => {
            drag.current = null;
            void animate(y, 0, SNAP_BACK);
          }}
        />
        <div className={styles.head}>
          <div>
            <ClockTime
              milliseconds={elapsedMilliseconds(draft, nowIso)}
              className={cx(styles.big, isPaused && styles.bigPaused)}
            />
            <p className={styles.sub}>
              {isPaused
                ? t('partie.uhrAngehalten', { pause: pausedFor })
                : t('partie.uhrSeit', { beginn: timeOfDay(draft.startedAt), pause: pausedFor })}
            </p>
          </div>
          {/* Pausing turns the button green, resuming back; the symbol fades in. */}
          <PressableButton
            type="button"
            className={styles.round}
            initial={false}
            animate={{ '--resume': isStoredPaused ? 1 : 0 }}
            aria-label={t(isStoredPaused ? 'partie.fortsetzen' : 'partie.anhalten')}
            onClick={togglePause}
          >
            <Swap swapKey={String(isStoredPaused)} from={ICON_FROM} className={styles.roundIcon}>
              {isStoredPaused ? (
                <PlayIcon size={BIG_ICON_SIZE} />
              ) : (
                <PauseIcon size={BIG_ICON_SIZE} />
              )}
            </Swap>
          </PressableButton>
        </div>
        <div className={styles.history}>
          {historyOf(draft).map((item) => {
            switch (item.kind) {
              case 'start':
                return (
                  <div key="start" className={styles.item} data-history="start">
                    <span className={styles.rail}>
                      <span className={styles.dot} />
                    </span>
                    <div className={styles.event}>
                      <b>{t('partie.beginn')}</b>
                      <TimeField
                        at={draft.startedAt}
                        label={t('partie.beginnFeld')}
                        isBad={startError !== undefined}
                        onPick={(at) => apply('start', setClockStart(draft, at, iso(Date.now())))}
                      />
                      <Unfold
                        isOpen={startError !== undefined}
                        isQuick
                        className={styles.errorLine}
                      >
                        <p className={styles.error} role="alert">
                          {startError}
                        </p>
                      </Unfold>
                    </div>
                  </div>
                );
              case 'stretch': {
                const { stretch, index } = item;
                const played = Date.parse(stretch.to ?? nowIso) - Date.parse(stretch.from);
                return (
                  <div
                    key={`stretch-${stretch.from}`}
                    className={styles.item}
                    data-history={`stretch-${stretch.from}`}
                  >
                    <span className={styles.rail}>
                      <span className={styles.line} />
                    </span>
                    <div className={styles.stretchBody}>
                      <div className={styles.stretch}>
                        <span>{t('partie.gespielt', { dauer: durationText(played) })}</span>
                        <span className={styles.spacer} />
                        <PressableButton
                          type="button"
                          className={styles.textButton}
                          aria-label={t('partie.pauseHier')}
                          aria-expanded={adding?.stretch === index}
                          onClick={() => {
                            const room = stretchMinutes(stretch, nowIso);
                            setAdding(
                              adding?.stretch === index
                                ? null
                                : {
                                    stretch: index,
                                    minutes: String(Math.min(SUGGESTED_MINUTES, room)),
                                  },
                            );
                          }}
                        >
                          {t('partie.plusPause')}
                        </PressableButton>
                      </div>
                      <Unfold isOpen={adding?.stretch === index}>
                        {adding?.stretch === index && adder(stretch, index, adding)}
                      </Unfold>
                    </div>
                  </div>
                );
              }
              case 'pause':
                return (
                  <div
                    key={`pause-${item.pause.from}`}
                    className={styles.item}
                    data-history={`pause-${item.pause.from}`}
                  >
                    <span className={styles.rail}>
                      <span className={cx(styles.line, styles.linePause)} />
                    </span>
                    {pauseLine(item.pause, item.index)}
                  </div>
                );
              case 'now':
                return (
                  <div key="now" className={styles.item}>
                    <span className={styles.rail}>
                      <span className={cx(styles.dot, styles.dotNow)} />
                    </span>
                    <div className={styles.event}>
                      <b>{t('partie.uhrJetzt')}</b>
                      <span className={styles.muted}>{t('partie.laeuft')}</span>
                    </div>
                  </div>
                );
            }
          })}
        </div>
        <Unfold isOpen={failure !== null} isQuick>
          <p className={styles.error} role="alert">
            {failure}
          </p>
        </Unfold>
        <PressableButton
          type="button"
          className={cx(shared.primary, styles.done)}
          onClick={() => {
            if (isDirty) {
              save(onClose);
            } else {
              close();
            }
          }}
        >
          {t('partie.fertig')}
        </PressableButton>
      </m.div>
      {(isAsking || (blocker.state === 'blocked' && isDirty)) && (
        <MatchDialog
          title={t('partie.aenderungenFrage')}
          lines={[t('partie.aenderungenText')]}
          cancelLabel={t('partie.verwerfen')}
          onCancel={() => {
            setIsAsking(false);
            if (blocker.state === 'blocked') {
              blocker.proceed();
            } else {
              // Discarded: the closing below is not blocked once the draft is the stored timer.
              setDraft(expected);
              onClose();
            }
          }}
          onDismiss={() => {
            setIsAsking(false);
            if (blocker.state === 'blocked') {
              blocker.reset();
            }
          }}
          confirmLabel={t('partie.uebernehmen')}
          onConfirm={() => {
            save(
              () => {
                setIsAsking(false);
                if (blocker.state === 'blocked') {
                  blocker.proceed();
                } else {
                  onClose();
                }
              },
              () => {
                setIsAsking(false);
                if (blocker.state === 'blocked') {
                  blocker.reset();
                }
              },
            );
          }}
        />
      )}
    </>
  );
}
