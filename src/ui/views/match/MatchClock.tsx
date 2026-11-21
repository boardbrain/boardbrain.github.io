import { useEffect, useState, useTransition } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { elapsedMilliseconds, isClockPaused, type SessionClock } from '@/core/generation';
import { t } from '@/i18n/t';
import { useAppDependencies } from '@/ui/AppDependencies';
import { PauseIcon, PlayIcon } from '@/ui/components/Icons';
import { PressableButton } from '@/ui/components/Pressable';
import { Swap } from '@/ui/components/Swap';
import { ClockSheet, ClockTime } from './ClockSheet';
import { clockParts } from './clockHistory';
import styles from './MatchClock.module.css';

// Every second, so the seconds count on, in the overview and in the sheet.
const TICK_MS = 1000;
const PILL_ICON_SIZE = 16;
const ICON_FROM = { opacity: 0, scale: 0.6 };

// The sheet is an entry of its own in the history of the router, so the back gesture closes it.
const SHEET_STATE = 'clockSheet';

function isSheetOpen(state: unknown): boolean {
  return typeof state === 'object' && state !== null && SHEET_STATE in state;
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
 * The timer of the running match (US-AB-07, design I3-B): hours and minutes with small seconds,
 * underlined to show it can be tapped, and a round button to pause or resume. Tapping the time
 * opens its history as a sheet (AK-6).
 */
export function MatchClock({ clock }: { readonly clock: SessionClock }): React.JSX.Element {
  const { session } = useAppDependencies();
  const now = useNow();
  const location = useLocation();
  const navigate = useNavigate();
  const [, startTransition] = useTransition();
  const isPaused = isClockPaused(clock);
  const elapsed = elapsedMilliseconds(clock, new Date(now).toISOString());
  const { hours, minutes } = clockParts(elapsed);
  const text = t('partie.uhrZeit', { stunden: hours, minuten: String(minutes).padStart(2, '0') });
  return (
    <>
      <span className={styles.pill}>
        <PressableButton
          type="button"
          className={styles.time}
          initial={false}
          animate={{ '--paused': isPaused ? 1 : 0 }}
          aria-label={t('partie.uhrDetails', { zeit: text })}
          onClick={() => {
            void navigate(
              { pathname: location.pathname, search: location.search },
              { state: { [SHEET_STATE]: true } },
            );
          }}
        >
          <ClockTime milliseconds={elapsed} />
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
          <Swap swapKey={String(isPaused)} from={ICON_FROM} className={styles.icon}>
            {isPaused ? <PlayIcon size={PILL_ICON_SIZE} /> : <PauseIcon size={PILL_ICON_SIZE} />}
          </Swap>
        </PressableButton>
      </span>
      {isSheetOpen(location.state) && (
        <ClockSheet
          clock={clock}
          now={now}
          onClose={() => {
            void navigate(-1);
          }}
        />
      )}
    </>
  );
}
