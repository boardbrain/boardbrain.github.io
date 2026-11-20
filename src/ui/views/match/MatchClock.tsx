import { useEffect, useState, useTransition } from 'react';
import { elapsedMilliseconds, type SessionClock } from '@/core/generation';
import { t } from '@/i18n/t';
import { useAppDependencies } from '@/ui/AppDependencies';
import { PauseIcon, PlayIcon } from '@/ui/components/Icons';
import { PressableButton } from '@/ui/components/Pressable';
import { cx } from '@/ui/components/classNames';
import { MatchDialog } from './MatchDialog';
import shared from './Match.module.css';
import {
  addMinutes,
  draftMinutes,
  lastTimeOfDay,
  setBeginning,
  toggleDraftPause,
} from './clockDraft';
import styles from './MatchClock.module.css';

// Every second, so a new minute shows at once, in the overview and in the details.
const TICK_MS = 1000;
const PILL_ICON_SIZE = 16;
const STEP_ICON_SIZE = 14;
const PAUSED_ICON_SIZE = 22;

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
  const minutes = draftMinutes(clock, now);
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
  readonly now: number;
  readonly onClose: () => void;
};

// UZ3: the time large and running on, the duration in steps of 1 and 5 minutes, the beginning
// and pausing; "Schließen" discards, "Übernehmen" stores (US-AB-07 AK-6). The window edits a
// draft of the timer, so it keeps counting like the overview while it is open.
function ClockDetails({ clock, now, onClose }: ClockDetailsProps): React.JSX.Element {
  const { session } = useAppDependencies();
  const [, startTransition] = useTransition();
  const [draft, setDraft] = useState<SessionClock>(clock);
  // The beginning the window opened with or that was set by hand (see `addMinutes`).
  const [anchor, setAnchor] = useState(clock.startedAt);
  const [isRefused, setIsRefused] = useState(false);
  const isPaused = draft.pausedAt !== undefined;
  const minutes = draftMinutes(draft, now);
  const stepButton = (step: number): React.JSX.Element => (
    <PressableButton
      type="button"
      className={styles.step}
      aria-label={t(step < 0 ? 'partie.minutenWeniger' : 'partie.minutenMehr', {
        anzahl: Math.abs(step),
      })}
      disabled={minutes + step < 0}
      onClick={() => {
        setDraft(addMinutes(draft, step, Date.now(), anchor));
      }}
    >
      {t(step < 0 ? 'partie.schrittWeniger' : 'partie.schrittMehr', { anzahl: Math.abs(step) })}
    </PressableButton>
  );
  return (
    <MatchDialog
      cancelLabel={t('partie.schliessen')}
      onCancel={onClose}
      confirmLabel={t('partie.uebernehmen')}
      onConfirm={() => {
        const at = Date.now();
        startTransition(async () => {
          const corrected = await session.correctClock({
            startedAt: draft.startedAt,
            elapsedMs: elapsedMilliseconds(draft, new Date(at).toISOString()),
            isPaused,
          });
          if (corrected.ok) {
            onClose();
          } else {
            // E.g. the clock of the device was set back or the match ended meanwhile.
            setIsRefused(true);
          }
        });
      }}
    >
      <div className={styles.head}>
        <span className={styles.bigRow}>
          <span className={cx(styles.big, isPaused && styles.bigPaused)}>{clockText(minutes)}</span>
          {/* Paused as a symbol beside the time: no line of its own that moves everything. */}
          {isPaused && (
            <span className={styles.pausedMark} role="img" aria-label={t('partie.angehalten')}>
              <PauseIcon size={PAUSED_ICON_SIZE} />
            </span>
          )}
        </span>
        <h2 className={styles.title}>{t('partie.spieldauer')}</h2>
        {isRefused && (
          <span className={cx(shared.small, shared.dangerText)} role="alert">
            {t('partie.uhrNichtUebernommen')}
          </span>
        )}
      </div>
      <div className={shared.group}>
        <div className={cx(styles.row, styles.stepLine)}>
          <span className={styles.txt}>{t('partie.dauerKorrigieren')}</span>
          <span className={styles.steps}>
            {stepButton(-5)}
            {stepButton(-1)}
            <b className={styles.value}>{t('partie.minutenWert', { anzahl: minutes })}</b>
            {stepButton(1)}
            {stepButton(5)}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.txt}>{t('partie.beginn')}</span>
          <label className={styles.pickWrap}>
            <span className={styles.valPill}>{timeOfDay(draft.startedAt)}</span>
            <input
              type="time"
              className={styles.pickNative}
              value={timeOfDay(draft.startedAt)}
              aria-label={t('partie.beginnFeld')}
              onChange={(event) => {
                if (event.target.value === '') {
                  return;
                }
                const at = Date.now();
                const changed = setBeginning(draft, lastTimeOfDay(event.target.value, at), at);
                setDraft(changed);
                // A beginning set by hand is the new anchor of the steps (see `addMinutes`).
                setAnchor(changed.startedAt);
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
              setDraft(toggleDraftPause(draft, Date.now()));
            }}
          >
            {isPaused ? <PlayIcon size={STEP_ICON_SIZE} /> : <PauseIcon size={STEP_ICON_SIZE} />}
            {t(isPaused ? 'partie.fortsetzen' : 'partie.anhalten')}
          </PressableButton>
        </div>
      </div>
    </MatchDialog>
  );
}
