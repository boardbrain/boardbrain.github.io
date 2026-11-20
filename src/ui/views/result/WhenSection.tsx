import { parseLocalDate, type LocalDate } from '@/core/model';
import { t } from '@/i18n/t';
import { BackIcon, ChevronIcon, TrashIcon } from '@/ui/components/Icons';
import { PressableButton } from '@/ui/components/Pressable';
import { cx } from '@/ui/components/classNames';
import { addDays, dayLabel } from '@/ui/views/games/dates';
import shared from '@/ui/views/match/Match.module.css';
import styles from './Result.module.css';

const ARROW_SIZE = 18;

// Opens the picker of a native field where the browser offers it (Chrome on computers would
// otherwise only let the field be typed into).
function openPicker(input: HTMLInputElement): void {
  if ('showPicker' in input) {
    try {
      input.showPicker();
    } catch {
      // The picker is already open or needs a user gesture: the field takes the input instead.
      input.focus();
    }
  }
}

function nowTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

type WhenSectionProps = {
  readonly date: LocalDate;
  readonly time: string;
  readonly today: LocalDate;
  readonly onDate: (date: LocalDate) => void;
  readonly onTime: (time: string) => void;
};

/**
 * "Wann" (design I3-B D1, Pf2): the day with an arrow for a day earlier and later, never after
 * today (US-ER-01 AK-8); the optional time with a bin to remove it and "Jetzt" (AK-3). The bin
 * keeps its place when there is no time, so nothing moves.
 */
export function WhenSection({
  date,
  time,
  today,
  onDate,
  onTime,
}: WhenSectionProps): React.JSX.Element {
  return (
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>{t('ergebnis.wann')}</h2>
      <div className={shared.group}>
        <div className={styles.optRow}>
          <span className={styles.txt}>{t('ergebnis.datum')}</span>
          <span className={styles.dateCtl}>
            <PressableButton
              type="button"
              className={styles.dayArrow}
              aria-label={t('ergebnis.tagFrueher')}
              onClick={() => {
                onDate(addDays(date, -1));
              }}
            >
              <BackIcon size={ARROW_SIZE} />
            </PressableButton>
            <label className={styles.pickWrap}>
              <span className={cx(styles.valPill, styles.datePill)}>{dayLabel(date, today)}</span>
              <input
                type="date"
                className={styles.pickNative}
                max={today}
                value={date}
                aria-label={t('ergebnis.datumWaehlen')}
                onClick={(event) => {
                  openPicker(event.currentTarget);
                }}
                onChange={(event) => {
                  const picked = parseLocalDate(event.target.value);
                  if (picked.ok && picked.value <= today) {
                    onDate(picked.value);
                  }
                }}
              />
            </label>
            <PressableButton
              type="button"
              className={styles.dayArrow}
              aria-label={t('ergebnis.tagSpaeter')}
              disabled={date >= today}
              onClick={() => {
                onDate(addDays(date, 1));
              }}
            >
              <ChevronIcon size={ARROW_SIZE} />
            </PressableButton>
          </span>
        </div>
        <div className={styles.optRow}>
          <span className={styles.txt}>
            {t('ergebnis.uhrzeit')}
            <span className={styles.optTag}>{t('ergebnis.optional')}</span>
          </span>
          <span className={styles.timeCtl}>
            <PressableButton
              type="button"
              className={cx(styles.clearTime, time === '' && styles.hiddenKeepPlace)}
              aria-label={t('ergebnis.uhrzeitLoeschen')}
              aria-hidden={time === ''}
              tabIndex={time === '' ? -1 : undefined}
              onClick={() => {
                onTime('');
              }}
            >
              <TrashIcon size={ARROW_SIZE} />
            </PressableButton>
            <label className={styles.pickWrap}>
              <span className={cx(styles.valPill, styles.timePill, time === '' && styles.empty)}>
                {time === '' ? t('ergebnis.keineUhrzeit') : time}
              </span>
              <input
                type="time"
                className={styles.pickNative}
                value={time}
                aria-label={t('ergebnis.uhrzeitWaehlen')}
                onClick={(event) => {
                  openPicker(event.currentTarget);
                }}
                onChange={(event) => {
                  onTime(event.target.value);
                }}
              />
            </label>
          </span>
          <PressableButton
            type="button"
            className={shared.pill}
            onClick={() => {
              onTime(nowTime());
            }}
          >
            {t('ergebnis.jetzt')}
          </PressableButton>
        </div>
      </div>
    </section>
  );
}
