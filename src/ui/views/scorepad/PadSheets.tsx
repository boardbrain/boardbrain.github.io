import { m } from 'motion/react';
import { useId, useState, type ReactNode } from 'react';
import type { PersonId, ScoreTarget } from '@/core/model';
import { isValidTarget, type ScorePadSettings } from '@/core/scorepad';
import { formatPadNumber } from '@/i18n/format';
import { t } from '@/i18n/t';
import { PlayIcon, TargetIcon, TrophyIcon } from '@/ui/components/Icons';
import { PressableButton } from '@/ui/components/Pressable';
import { cx } from '@/ui/components/classNames';
import shared from '@/ui/views/match/Match.module.css';
import type { ResultPerson } from '@/ui/views/result/ResultRows';
import styles from './PadSheets.module.css';

const ENTER = { type: 'spring', bounce: 0.15, duration: 0.4 } as const;
const PLAY_SIZE = 18;
const TARGET_ICON_SIZE = 22;
const TROPHY_SIZE = 16;
const QUICK_POINTS = [50, 100, 200, 500] as const;
const QUICK_ROUNDS = [5, 10, 15, 20] as const;
const WHOLE = /^\d{1,5}$/u;

type SheetProps = {
  readonly label: string;
  readonly onClose: () => void;
  readonly className?: string | undefined;
  readonly children: ReactNode;
};

/**
 * A sheet from below over the dimmed score pad (design I3-C2 ES3, EN2); the grip and a tap beside
 * it close it.
 */
function Sheet({ label, onClose, className, children }: SheetProps): React.JSX.Element {
  return (
    <div
      className={styles.back}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      }}
    >
      <m.div
        className={cx(styles.sheet, className)}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={ENTER}
      >
        <PressableButton
          type="button"
          className={styles.grip}
          aria-label={t('partie.schliessen')}
          onClick={onClose}
        />
        {children}
      </m.div>
    </div>
  );
}

type Kind = 'none' | ScoreTarget['kind'];

type SettingsSheetProps = {
  readonly settings: ScorePadSettings;
  readonly subtitle: string;
  /** "Los geht’s" with "Starten" when the score pad starts, else "Einstellungen" (ES3). */
  readonly isStart: boolean;
  readonly isBusy: boolean;
  readonly onDone: (settings: ScorePadSettings) => void;
  readonly onClose: () => void;
};

function quickOf(kind: Kind): readonly number[] {
  if (kind === 'points') {
    return QUICK_POINTS;
  }
  return kind === 'rounds' ? QUICK_ROUNDS : [];
}

/**
 * Target and calculation of one score pad (US-NB-03, design I3-C2 ES3, SD1, HX4): no target,
 * points or rounds with quick values and "Andere"; "App rechnet" or "Selbst rechnen". It holds for
 * this score pad only; who wins stays a setting of the game.
 */
export function SettingsSheet({
  settings,
  subtitle,
  isStart,
  isBusy,
  onDone,
  onClose,
}: SettingsSheetProps): React.JSX.Element {
  const fieldId = useId();
  const start = settings.target;
  const [kind, setKind] = useState<Kind>(start?.kind ?? 'none');
  const [value, setValue] = useState(start === null ? '' : String(start.value));
  const [isOther, setIsOther] = useState(
    start !== null && !quickOf(start.kind).includes(start.value),
  );
  const [calculation, setCalculation] = useState(settings.calculation);
  const number = WHOLE.test(value) ? Number(value) : null;
  const target: ScoreTarget | null =
    kind === 'none' || number === null ? null : { kind, value: number };
  const isTargetBad = kind !== 'none' && (target === null || !isValidTarget(target));
  const quick = quickOf(kind);
  const chooseKind = (next: Kind): void => {
    setKind(next);
    const [middle] = quickOf(next).slice(1, 2);
    setValue(middle === undefined ? '' : String(middle));
    setIsOther(false);
  };
  return (
    <Sheet
      label={t(isStart ? 'notizblock.losGehts' : 'notizblock.einstellungen')}
      onClose={onClose}
    >
      <div className={styles.head}>
        <div className={shared.titles}>
          <h2 className={styles.title}>
            {t(isStart ? 'notizblock.losGehts' : 'notizblock.einstellungen')}
          </h2>
          <div className={cx(shared.small, shared.muted)}>{subtitle}</div>
        </div>
      </div>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('notizblock.ziel')}</h2>
        <div className={styles.seg} role="group" aria-label={t('notizblock.ziel')}>
          {(['none', 'points', 'rounds'] as const).map((key) => (
            <PressableButton
              key={key}
              type="button"
              aria-pressed={kind === key}
              onClick={() => {
                chooseKind(key);
              }}
            >
              {t(
                key === 'none'
                  ? 'notizblock.keinZiel'
                  : key === 'points'
                    ? 'notizblock.punkte'
                    : 'notizblock.runden',
              )}
            </PressableButton>
          ))}
        </div>
        {kind !== 'none' && (
          <div className={styles.quick}>
            {quick.map((amount) => (
              <PressableButton
                key={amount}
                type="button"
                className={styles.pill}
                aria-pressed={!isOther && number === amount}
                onClick={() => {
                  setValue(String(amount));
                  setIsOther(false);
                }}
              >
                {amount}
              </PressableButton>
            ))}
            <PressableButton
              type="button"
              className={styles.pill}
              aria-pressed={isOther}
              onClick={() => {
                setIsOther(true);
              }}
            >
              {t('notizblock.andere')}
            </PressableButton>
          </div>
        )}
        {kind !== 'none' && isOther && (
          <input
            id={fieldId}
            className={cx(styles.other, isTargetBad && styles.bad)}
            inputMode="numeric"
            enterKeyHint="done"
            autoComplete="off"
            aria-label={t('notizblock.andereFeld')}
            aria-invalid={isTargetBad}
            value={value}
            onChange={(event) => {
              setValue(event.target.value.trim());
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
          />
        )}
        <p className={styles.hint}>
          {t(kind === 'none' ? 'notizblock.ohneZielHinweis' : 'notizblock.zielHinweis')}
        </p>
      </section>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('notizblock.rechnen')}</h2>
        <div className={styles.seg} role="group" aria-label={t('notizblock.rechnen')}>
          {(['app', 'self'] as const).map((key) => (
            <PressableButton
              key={key}
              type="button"
              aria-pressed={calculation === key}
              onClick={() => {
                setCalculation(key);
              }}
            >
              {t(key === 'app' ? 'notizblock.appRechnet' : 'notizblock.selbstRechnen')}
            </PressableButton>
          ))}
        </div>
        <p className={styles.hint}>
          {t(calculation === 'app' ? 'notizblock.appHinweis' : 'notizblock.selbstHinweis')}
        </p>
      </section>
      <PressableButton
        type="button"
        className={cx(shared.primary, styles.done)}
        disabled={isTargetBad || isBusy}
        onClick={() => {
          onDone({ target, calculation });
        }}
      >
        {isStart && <PlayIcon size={PLAY_SIZE} />}
        {t(isStart ? 'notizblock.starten' : 'notizblock.fertig')}
      </PressableButton>
    </Sheet>
  );
}

type ReachedSheetProps = {
  readonly persons: readonly ResultPerson[];
  readonly totals: Readonly<Record<PersonId, number>>;
  readonly places: ReadonlyMap<PersonId, number>;
  /** Who reached a target in points; empty for a target in rounds. */
  readonly atTarget: readonly ResultPerson[];
  readonly target: ScoreTarget;
  readonly rounds: number;
  readonly isSelf: boolean;
  readonly onContinue: () => void;
  readonly onFinish: () => void;
};

function reachedLine(
  atTarget: readonly ResultPerson[],
  totals: Readonly<Record<PersonId, number>>,
  target: ScoreTarget,
  rounds: number,
): string {
  const [only] = atTarget;
  if (atTarget.length === 1 && only !== undefined) {
    return t('notizblock.hatPunkte', {
      name: only.name,
      punkte: formatPadNumber(totals[only.id] ?? 0),
    });
  }
  if (atTarget.length > 1) {
    return t('notizblock.habenPunkte', { namen: atTarget.map((person) => person.name).join(', ') });
  }
  return t('notizblock.rundenGespielt', { anzahl: Math.max(rounds, target.value) });
}

/**
 * "Ziel erreicht" once after the round that reached the target (US-NB-03 AK-4, design I3-C2 EN2):
 * the standing by places, "Weiterspielen" or "Ergebnis speichern"; the app never ends on its own.
 */
export function ReachedSheet({
  persons,
  totals,
  places,
  atTarget,
  target,
  rounds,
  isSelf,
  onContinue,
  onFinish,
}: ReachedSheetProps): React.JSX.Element {
  const ranked = persons.toSorted((a, b) => (places.get(a.id) ?? 0) - (places.get(b.id) ?? 0));
  return (
    <Sheet
      label={t('notizblock.zielErreicht')}
      className={styles.reachedSheet}
      onClose={onContinue}
    >
      <div className={styles.reachedHead}>
        <span className={styles.goldIcon}>
          <TargetIcon size={TARGET_ICON_SIZE} />
        </span>
        <div className={shared.titles}>
          <h2 className={styles.title}>{t('notizblock.zielErreicht')}</h2>
          <div className={cx(shared.small, shared.muted)}>
            {isSelf ? t('notizblock.spielBeenden') : reachedLine(atTarget, totals, target, rounds)}
          </div>
        </div>
      </div>
      <ol className={styles.rank}>
        {ranked.map((person) => {
          const place = places.get(person.id) ?? 0;
          return (
            <li key={person.id} className={cx(styles.line, place === 1 && styles.leadLine)}>
              <span
                className={cx(
                  styles.place,
                  place === 1 && styles.first,
                  place === 2 && styles.second,
                  place === 3 && styles.third,
                )}
                aria-label={t('ergebnis.platzVon', { name: person.name, platz: place })}
              >
                {place === 1 ? <TrophyIcon size={TROPHY_SIZE} /> : place}
              </span>
              <span
                className={styles.seat}
                style={{ background: `var(--color-group-${person.groupColor})` }}
                aria-hidden="true"
              >
                {person.name.slice(0, 1)}
              </span>
              <strong className={styles.lineName}>{person.name}</strong>
              <strong className={styles.sum}>{formatPadNumber(totals[person.id] ?? 0)}</strong>
            </li>
          );
        })}
      </ol>
      <div className={styles.choice}>
        <PressableButton type="button" className={shared.secondary} onClick={onContinue}>
          {t('notizblock.weiterspielen')}
        </PressableButton>
        <PressableButton type="button" className={shared.primary} onClick={onFinish}>
          {t('notizblock.ergebnisSpeichern')}
        </PressableButton>
      </div>
    </Sheet>
  );
}
