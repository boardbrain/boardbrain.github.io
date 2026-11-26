import { useReducedMotion } from 'motion/react';
import { useRef, useState } from 'react';
import { parseLocalDate, type LocalDate, type Match } from '@/core/model';
import {
  isInPeriod,
  periodRangeError,
  type PeriodRangeError,
  type StatsPeriod,
} from '@/core/stats';
import { BottomSheet } from '@/ui/components/BottomSheet';
import { t } from '@/i18n/t';
import { PressableButton } from '@/ui/components/Pressable';
import { cx } from '@/ui/components/classNames';
import { nudgeMissing } from '@/ui/components/nudge';
import shared from '@/ui/views/match/Match.module.css';
import { matchCountText, periodParam } from './statsView';
import styles from './PeriodSheet.module.css';

const ERROR_TEXT: Readonly<Record<PeriodRangeError, string>> = {
  'range-incomplete': t('statistik.fehler.unvollstaendig'),
  'range-reversed': t('statistik.fehler.umgekehrt'),
  'range-in-future': t('statistik.fehler.zukunft'),
};

function dayOrNull(value: string): LocalDate | null {
  const parsed = parseLocalDate(value);
  return parsed.ok ? parsed.value : null;
}

/**
 * The period of the statistics as a sheet from below (US-ST-03 AK-5, AK-6, design I3-D ZE2):
 * quick choices for all matches, the years with matches up to two years back and the last 3 or
 * 12 months, below an own range from–to for anything else. Errors show at once and keep the range
 * from being taken; the button says how many matches lie in it. Like every form it only looks
 * greyed out then, and a tap lights up the dates to change (Architecture 13.6).
 */
export function PeriodSheet({
  matches,
  period,
  years,
  today,
  onChoose,
  onClose,
}: {
  readonly matches: readonly Match[];
  readonly period: StatsPeriod;
  readonly years: readonly number[];
  readonly today: LocalDate;
  readonly onChoose: (period: StatsPeriod) => void;
  readonly onClose: () => void;
}): React.JSX.Element {
  const first = matches[0]?.date ?? today;
  const [from, setFrom] = useState<string>(period.kind === 'range' ? period.from : first);
  const [to, setTo] = useState<string>(period.kind === 'range' ? period.to : today);
  const fromDay = dayOrNull(from);
  const toDay = dayOrNull(to);
  const error = periodRangeError(fromDay, toDay, today);
  const range: StatsPeriod | null =
    error === null && fromDay !== null && toDay !== null
      ? { kind: 'range', from: fromDay, to: toDay }
      : null;
  const inRange =
    range === null ? 0 : matches.filter((match) => isInPeriod(match.date, range, today)).length;
  const quick: readonly { readonly period: StatsPeriod; readonly label: string }[] = [
    { period: { kind: 'all' }, label: t('statistik.gesamt') },
    ...years.map((year) => ({ period: { kind: 'year', year } as const, label: String(year) })),
    { period: { kind: 'last-months', months: 3 }, label: t('statistik.letzte3') },
    { period: { kind: 'last-months', months: 12 }, label: t('statistik.letzte12') },
  ];
  const current = periodParam(period);
  const sheetRef = useRef<HTMLDivElement>(null);
  const isReduced = useReducedMotion() === true;
  const canTake = range !== null && inRange > 0;
  const isFromWrong =
    !canTake && (error === 'range-reversed' || error === null || fromDay === null);
  const isToWrong =
    !canTake &&
    (error === 'range-reversed' || error === 'range-in-future' || error === null || toDay === null);
  return (
    <BottomSheet
      label={t('statistik.zeitraum')}
      title={t('statistik.zeitraum')}
      sheetRef={sheetRef}
      onClose={onClose}
    >
      <div className={styles.quick}>
        {quick.map((choice) => {
          const isChosen = periodParam(choice.period) === current;
          return (
            <PressableButton
              key={choice.label}
              type="button"
              className={cx(styles.choice, isChosen && styles.chosen)}
              aria-pressed={isChosen}
              onClick={() => {
                onChoose(choice.period);
              }}
            >
              {choice.label}
            </PressableButton>
          );
        })}
      </div>
      <span className={styles.label}>{t('statistik.eigenerZeitraum')}</span>
      <div className={styles.dates}>
        <label className={styles.date}>
          <span className={styles.label}>{t('statistik.von')}</span>
          <input
            type="date"
            value={from}
            max={today}
            data-need={isFromWrong ? '' : undefined}
            onChange={(event) => {
              setFrom(event.target.value);
            }}
          />
        </label>
        <span className={styles.dash} aria-hidden="true">
          {t('statistik.strich')}
        </span>
        <label className={styles.date}>
          <span className={styles.label}>{t('statistik.bis')}</span>
          <input
            type="date"
            value={to}
            max={today}
            data-need={isToWrong ? '' : undefined}
            onChange={(event) => {
              setTo(event.target.value);
            }}
          />
        </label>
      </div>
      {error !== null && (
        <span className={styles.error} role="alert">
          {ERROR_TEXT[error]}
        </span>
      )}
      <PressableButton
        type="button"
        className={cx(shared.primary, styles.take, !canTake && styles.looksOff)}
        aria-disabled={!canTake}
        onClick={() => {
          if (range !== null && inRange > 0) {
            onChoose(range);
          } else {
            nudgeMissing(sheetRef.current, isReduced);
          }
        }}
      >
        {range === null
          ? t('statistik.uebernehmen')
          : inRange === 0
            ? t('statistik.keineImZeitraum')
            : t('statistik.zeigen', { partien: matchCountText(inRange) })}
      </PressableButton>
    </BottomSheet>
  );
}
