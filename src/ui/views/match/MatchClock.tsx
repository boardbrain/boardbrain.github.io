import { useEffect, useState, useTransition } from 'react';
import { elapsedMilliseconds, type SessionClock } from '@/core/generation';
import { t } from '@/i18n/t';
import { useAppDependencies } from '@/ui/AppDependencies';
import { PauseIcon, PlayIcon } from '@/ui/components/Icons';
import { PressableButton } from '@/ui/components/Pressable';
import { cx } from '@/ui/components/classNames';
import { MatchDialog } from './MatchDialog';
import shared from './Match.module.css';
import styles from './MatchClock.module.css';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const TICK_MS = 15_000;
const PILL_ICON_SIZE = 16;
const STEP_ICON_SIZE = 14;

/**
 * "1:23": hours and minutes of a duration in whole minutes.
 */
export function clockText(minutes: number): string {
  return t('partie.uhrZeit', {
    stunden: Math.floor(minutes / 60),
    minuten: String(minutes % 60).padStart(2, '0'),
  });
}

function timeOfDay(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// The beginning at a time of day: on the day of the old beginning, a day earlier if that would
// lie in the future (a match over midnight).
function beginningAt(time: string, previous: string, now: number): string {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  const date = new Date(previous);
  date.setHours(hours, minutes, 0, 0);
  const at = date.getTime() > now ? date.getTime() - DAY : date.getTime();
  return new Date(at).toISOString();
}

// External system: the time goes on while the page is open.
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, TICK_MS);
    return () => {
      clearInterval(timer);
    };
  }, []);
  return now;
}

/**
 * The timer of the running match (US-AB-07, design I3-B T4): the time, underlined to show it can
 * be tapped, and a round button to pause or resume. Tapping the time opens the details (UZ3).
 */
export function MatchClock({ clock }: { readonly clock: SessionClock }): React.JSX.Element {
  const { session } = useAppDependencies();
  const now = useNow();
  const [isOpen, setIsOpen] = useState(false);
  const [, startTransition] = useTransition();
  const isPaused = clock.pausedAt !== undefined;
  const minutes = Math.floor(elapsedMilliseconds(clock, new Date(now).toISOString()) / MINUTE);
  const text = clockText(minutes);
  return (
    <>
      <span className={styles.pill}>
        <PressableButton
          type="button"
          className={cx(styles.time, isPaused && styles.paused)}
          aria-label={t('partie.uhrDetails', { zeit: text })}
          onClick={() => {
            setIsOpen(true);
          }}
        >
          {text}
        </PressableButton>
        <PressableButton
          type="button"
          className={styles.toggle}
          aria-label={t(isPaused ? 'partie.fortsetzen' : 'partie.anhalten')}
          onClick={() => {
            startTransition(async () => {
              await (isPaused ? session.resumeClock() : session.pauseClock());
            });
          }}
        >
          {isPaused ? <PlayIcon size={PILL_ICON_SIZE} /> : <PauseIcon size={PILL_ICON_SIZE} />}
        </PressableButton>
      </span>
      {isOpen && (
        <ClockDetails
          clock={clock}
          minutes={Math.max(1, minutes)}
          now={now}
          onClose={() => {
            setIsOpen(false);
          }}
        />
      )}
    </>
  );
}

type ClockDetailsProps = {
  readonly clock: SessionClock;
  readonly minutes: number;
  readonly now: number;
  readonly onClose: () => void;
};

// UZ3: the time large, the duration in steps of 1 and 5 minutes, the beginning and pausing;
// "Schließen" discards, "Übernehmen" stores (US-AB-07 AK-6).
function ClockDetails({ clock, minutes, now, onClose }: ClockDetailsProps): React.JSX.Element {
  const { session } = useAppDependencies();
  const [, startTransition] = useTransition();
  const [edit, setEdit] = useState({
    minutes,
    startedAt: clock.startedAt,
    isPaused: clock.pausedAt !== undefined,
  });
  const sinceStart = Math.floor((now - Date.parse(edit.startedAt)) / MINUTE);
  const stepButton = (step: number): React.JSX.Element => {
    const next = edit.minutes + step;
    return (
      <PressableButton
        type="button"
        className={styles.step}
        aria-label={t(step < 0 ? 'partie.minutenWeniger' : 'partie.minutenMehr', {
          anzahl: Math.abs(step),
        })}
        disabled={next < 1 || next > sinceStart}
        onClick={() => {
          setEdit({ ...edit, minutes: next });
        }}
      >
        {t(step < 0 ? 'partie.schrittWeniger' : 'partie.schrittMehr', { anzahl: Math.abs(step) })}
      </PressableButton>
    );
  };
  return (
    <MatchDialog
      cancelLabel={t('partie.schliessen')}
      onCancel={onClose}
      confirmLabel={t('partie.uebernehmen')}
      onConfirm={() => {
        onClose();
        startTransition(async () => {
          await session.correctClock({
            startedAt: edit.startedAt,
            elapsedMs: edit.minutes * MINUTE,
            isPaused: edit.isPaused,
          });
        });
      }}
    >
      <div className={styles.head}>
        <span className={cx(styles.big, edit.isPaused && styles.bigPaused)}>
          {clockText(edit.minutes)}
        </span>
        <h2 className={styles.title}>{t('partie.spieldauer')}</h2>
        {edit.isPaused && (
          <span className={cx(shared.small, shared.muted)}>{t('partie.angehalten')}</span>
        )}
      </div>
      <div className={shared.group}>
        <div className={cx(styles.row, styles.stepLine)}>
          <span className={styles.txt}>{t('partie.dauerKorrigieren')}</span>
          <span className={styles.steps}>
            {stepButton(-5)}
            {stepButton(-1)}
            <b className={styles.value}>{t('partie.minutenWert', { anzahl: edit.minutes })}</b>
            {stepButton(1)}
            {stepButton(5)}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.txt}>{t('partie.beginn')}</span>
          <label className={styles.pickWrap}>
            <span className={styles.valPill}>{timeOfDay(edit.startedAt)}</span>
            <input
              type="time"
              className={styles.pickNative}
              value={timeOfDay(edit.startedAt)}
              aria-label={t('partie.beginnFeld')}
              onChange={(event) => {
                if (event.target.value === '') {
                  return;
                }
                const startedAt = beginningAt(event.target.value, edit.startedAt, now);
                // The duration grows by as much as the beginning moves earlier.
                const shift = Math.round(
                  (Date.parse(edit.startedAt) - Date.parse(startedAt)) / MINUTE,
                );
                setEdit({ ...edit, startedAt, minutes: Math.max(1, edit.minutes + shift) });
              }}
            />
          </label>
        </div>
        <div className={styles.row}>
          <span className={styles.txt}>{t('partie.uhr')}</span>
          <PressableButton
            type="button"
            className={shared.pill}
            onClick={() => {
              setEdit({ ...edit, isPaused: !edit.isPaused });
            }}
          >
            {edit.isPaused ? (
              <PlayIcon size={STEP_ICON_SIZE} />
            ) : (
              <PauseIcon size={STEP_ICON_SIZE} />
            )}
            {t(edit.isPaused ? 'partie.fortsetzen' : 'partie.anhalten')}
          </PressableButton>
        </div>
      </div>
    </MatchDialog>
  );
}
