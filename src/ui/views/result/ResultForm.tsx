import { animate } from 'motion/react';
import { useRef, useState, useTransition } from 'react';
import type { ResultDraft } from '@/app/services/resultService';
import {
  CATAN_COLOR_KEYS,
  parseLocalDate,
  setMatchColor,
  type CatanColorKey,
  type LocalDate,
  type PersonId,
} from '@/core/model';
import {
  LONG_DURATION_MINUTES,
  MAX_NOTES_LENGTH,
  plausibilityWarnings,
  type ResultInput,
} from '@/core/results';
import { t } from '@/i18n/t';
import { CheckIcon, InfoIcon } from '@/ui/components/Icons';
import { Notice } from '@/ui/components/Notice';
import { PressableButton } from '@/ui/components/Pressable';
import { Unfold } from '@/ui/components/Unfold';
import { cx } from '@/ui/components/classNames';
import { MatchDialog } from '@/ui/views/match/MatchDialog';
import shared from '@/ui/views/match/Match.module.css';
import options from '@/ui/views/match/OptionsView.module.css';
import colorStyles from '@/ui/views/match/ColorsView.module.css';
import { durationFields, readDuration } from './duration';
import {
  deriveEntry,
  isEntryComplete,
  NO_ENTRIES,
  outcomeOf,
  rowOrder,
  setPlace,
  setPoints,
  toggleWinner,
  type Way,
  type WayEntries,
} from './resultEntry';
import { PersonMark, PlaceRows, PointsRows, type ResultPerson } from './ResultRows';
import { WhenSection } from './WhenSection';
import styles from './Result.module.css';

const CHECK_SIZE = 18;
const INFO_SIZE = 18;
const MINUTES_PER_HOUR = 60;
const NUDGE_SECONDS = 0.9;

/**
 * What is said after storing (design I3-B R3): who won, game and table.
 */
export type SavedNote = { readonly who: string; readonly where: string };

type ResultFormProps = {
  readonly draft: ResultDraft;
  readonly persons: readonly ResultPerson[];
  readonly gameName: string;
  readonly tableName: string;
  readonly today: LocalDate;
  /** Stores the result; `null` when stored, otherwise why not, as a text shown above the button. */
  readonly save: (input: ResultInput) => Promise<string | null>;
  readonly onSaved: (note: SavedNote) => void;
};

function namesText(names: readonly string[]): string {
  if (names.length <= 1) {
    return names.join('');
  }
  return `${names.slice(0, -1).join(t('ergebnis.komma'))}${t('ergebnis.und')}${names.at(-1) ?? ''}`;
}

// Lights up what is missing once (design I3-B E6): no red, no text.
function nudge(root: HTMLElement | null): void {
  if (root === null) {
    return;
  }
  const gold = getComputedStyle(root).getPropertyValue('--color-accent-text').trim();
  for (const element of root.querySelectorAll('[data-need]')) {
    void animate(
      element,
      { boxShadow: [`0 0 0 0px ${gold}00`, `0 0 0 3px ${gold}cc`, `0 0 0 0px ${gold}00`] },
      { duration: NUDGE_SECONDS, ease: 'easeInOut' },
    );
  }
}

/**
 * The result form (US-ER-01, US-ER-02, US-ER-06, US-ER-03 AK-1, design I3-B E6, A2, G3, M3, D1,
 * C3, H3, LB1): the result first, then when, for Catan the edition, mode, duration and colours,
 * then notes. While something is missing the button only looks disabled; tapping it lights up
 * what is missing.
 */
export function ResultForm({
  draft,
  persons,
  gameName,
  tableName,
  today,
  save,
  onSaved,
}: ResultFormProps): React.JSX.Element {
  const { rules, participants, values } = draft;
  const isCatan = rules.hasSingleWinner;
  const hasBothWays = rules.scoring !== null && rules.supportsRanking;
  const formRef = useRef<HTMLFormElement>(null);
  const durationRef = useRef<HTMLInputElement>(null);
  const [way, setWay] = useState<Way>(rules.scoring === null ? 'places' : 'points');
  const [byWay, setByWay] = useState<Readonly<Record<Way, WayEntries>>>({
    points: NO_ENTRIES,
    places: NO_ENTRIES,
  });
  const [committed, setCommitted] = useState<Readonly<Record<PersonId, string>>>({});
  const [date, setDate] = useState<LocalDate>(() => {
    const parsed = parseLocalDate(values.date);
    return parsed.ok ? parsed.value : today;
  });
  const [time, setTime] = useState(values.time ?? '');
  const [edition, setEdition] = useState(values.edition ?? rules.editions[0]);
  const [colors, setColors] = useState(values.catanColors);
  const [isColorsOpen, setIsColorsOpen] = useState(false);
  const [duration, setDuration] = useState(() => durationFields(values.durationMinutes));
  const [notes, setNotes] = useState('');
  const [isAskingLong, setIsAskingLong] = useState(false);
  const [isShowingRules, setIsShowingRules] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const entries = byWay[way];
  const derived = deriveEntry(way, entries, participants, rules);
  // Places and the trophy follow the points once a field is left, not while typing (PO 21.11.).
  const settled =
    way === 'points'
      ? deriveEntry(way, { ...entries, points: committed }, participants, rules)
      : derived;
  const readDurationResult = readDuration(duration);
  const durationMinutes = readDurationResult.minutes;
  const isDurationBad = readDurationResult.isHoursBad || readDurationResult.isMinutesBad;
  const isLong = durationMinutes !== undefined && durationMinutes > LONG_DURATION_MINUTES;
  const canSave = isEntryComplete(derived) && !isDurationBad && !isPending;
  const byId = new Map(persons.map((person) => [person.id, person]));
  const shown = (way === 'points' ? rowOrder(participants, committed, rules) : participants).map(
    (personId) => {
      const person = byId.get(personId);
      const color = colors?.[personId];
      return person === undefined || color === undefined
        ? person
        : { ...person, catanColor: color };
    },
  );
  const rows = shown.filter((person) => person !== undefined);

  function change(next: WayEntries): void {
    setByWay({ ...byWay, [way]: next });
  }

  function input(): ResultInput {
    return {
      date,
      ...(time === '' ? {} : { time }),
      ...(edition === undefined ? {} : { edition }),
      ...(values.mode === undefined ? {} : { mode: values.mode }),
      ...outcomeOf(way, derived, participants),
      ...(colors === undefined ? {} : { catanColors: colors }),
      ...(durationMinutes === undefined ? {} : { durationMinutes }),
      ...(notes.trim() === '' ? {} : { notes }),
    };
  }

  function store(): void {
    setIsAskingLong(false);
    const result = input();
    // Unexpected errors in the transition reach the error view of the routes (ADR-025).
    startTransition(async () => {
      const problem = await save(result);
      setFailure(problem);
      if (problem === null) {
        const names = derived.winners.map((personId) => byId.get(personId)?.name ?? '');
        onSaved({
          who:
            names.length > 1
              ? t('ergebnis.unentschieden', { namen: namesText(names) })
              : t('ergebnis.gewinnt', { name: names[0] ?? '' }),
          where: t('ergebnis.gespeichert', { spiel: gameName, tisch: tableName }),
        });
      }
    });
  }

  return (
    <form
      ref={formRef}
      className={styles.form}
      onKeyDown={(event) => {
        // The key at the bottom right of the phone keyboard only closes the keyboard, so the
        // next field can be tapped; storing is the button's job (Product Owner 20.11.2026).
        if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
          event.preventDefault();
          event.target.blur();
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave) {
          nudge(formRef.current);
          return;
        }
        // H3: a very long duration asks first (US-ER-01 AK-8).
        if (
          plausibilityWarnings({ ...(durationMinutes === undefined ? {} : { durationMinutes }) })
            .length > 0
        ) {
          setIsAskingLong(true);
          return;
        }
        store();
      }}
    >
      <section className={shared.section}>
        <h2 className={shared.sectionTitle}>{t('ergebnis.abschnitt')}</h2>
        {hasBothWays && (
          <div className={shared.group}>
            <PressableButton
              type="button"
              role="switch"
              className={styles.switchRow}
              aria-checked={way === 'places'}
              onClick={() => {
                setWay(way === 'places' ? 'points' : 'places');
              }}
            >
              <span className={styles.txt}>
                {t('ergebnis.siegerOderRangfolge')}
                <small className={styles.sub}>{t('ergebnis.stattPunkten')}</small>
              </span>
              <span className={options.switch} />
            </PressableButton>
          </div>
        )}
        <div className={shared.group} aria-label={t('ergebnis.personen')} role="group">
          {way === 'points' ? (
            <PointsRows
              persons={rows}
              entries={entries}
              derived={settled}
              badPoints={derived.badPoints}
              committed={committed}
              rules={rules}
              isPointsRequired={hasBothWays}
              missing={derived.missing}
              onPoints={(personId, text) => {
                change(setPoints(entries, personId, text, participants, rules));
              }}
              onCommit={() => {
                setCommitted(entries.points);
              }}
              onWinner={(personId) => {
                change(toggleWinner(entries, personId, rules));
              }}
            />
          ) : (
            <PlaceRows
              persons={rows}
              derived={derived}
              missing={derived.missing}
              onPlace={(personId, place) => {
                change(setPlace(entries, personId, place, rules));
              }}
            />
          )}
        </div>
      </section>

      <WhenSection date={date} time={time} today={today} onDate={setDate} onTime={setTime} />

      {isCatan && (
        <section className={shared.section}>
          <h2 className={shared.sectionTitle}>{t('ergebnis.partie')}</h2>
          <div className={options.seg} role="group" aria-label={t('partie.spielversion')}>
            {rules.editions.map((key) => (
              <PressableButton
                key={key}
                type="button"
                aria-pressed={edition === key}
                onClick={() => {
                  setEdition(key);
                }}
              >
                {t(key === 'base' ? 'partie.basisspiel' : 'partie.staedteUndRitter')}
              </PressableButton>
            ))}
          </div>
          {/* The mode cannot be changed yet: an info line as in the preparation. */}
          <div className={cx(options.modeLine, shared.small)}>
            <span className={shared.muted}>{t('partie.modus')}</span>
            <span>{t('partie.standard')}</span>
            <PressableButton
              type="button"
              className={options.infoBtn}
              aria-label={t('partie.modusInfo')}
              onClick={() => {
                setIsShowingRules(true);
              }}
            >
              <InfoIcon size={INFO_SIZE} />
            </PressableButton>
          </div>
          <div className={shared.group}>
            <div className={styles.optRow}>
              <span className={styles.txt}>
                {t('ergebnis.spieldauer')}
                <span className={cx(styles.optTag, isLong && styles.durWarn)}>
                  {t(isLong ? 'ergebnis.ueberAchtStunden' : 'ergebnis.optional')}
                </span>
              </span>
              {/* Hours and minutes in two fields (Product Owner 21.11.2026). */}
              <span className={styles.duration}>
                <input
                  ref={durationRef}
                  enterKeyHint="done"
                  className={cx(
                    styles.num,
                    styles.durNum,
                    readDurationResult.isHoursBad && styles.bad,
                  )}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder={t('ergebnis.keineUhrzeit')}
                  aria-label={t('ergebnis.stundenFeld')}
                  aria-invalid={readDurationResult.isHoursBad}
                  value={duration.hours}
                  onChange={(event) => {
                    setDuration({ ...duration, hours: event.target.value });
                  }}
                />
                <span className={cx(shared.muted, shared.small)}>{t('ergebnis.stunden')}</span>
                <input
                  enterKeyHint="done"
                  className={cx(
                    styles.num,
                    styles.durNum,
                    readDurationResult.isMinutesBad && styles.bad,
                  )}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder={t('ergebnis.keineUhrzeit')}
                  aria-label={t('ergebnis.minutenFeld')}
                  aria-invalid={readDurationResult.isMinutesBad}
                  value={duration.minutes}
                  onChange={(event) => {
                    setDuration({ ...duration, minutes: event.target.value });
                  }}
                />
                <span className={cx(shared.muted, shared.small)}>{t('ergebnis.minuten')}</span>
              </span>
            </div>
          </div>
        </section>
      )}

      {isCatan && colors !== undefined && (
        <section className={shared.section}>
          <h2 className={shared.sectionTitle}>{t('ergebnis.farben')}</h2>
          {/* "Ändern" opens the colours smoothly in place of the coins. */}
          <div className={shared.group}>
            <Unfold isOpen={!isColorsOpen}>
              <div className={styles.optRow}>
                <span className={styles.coins}>
                  {rows.map((person) => (
                    <PersonMark key={person.id} person={person} />
                  ))}
                </span>
                <PressableButton
                  type="button"
                  className={shared.pill}
                  onClick={() => {
                    setIsColorsOpen(true);
                  }}
                >
                  {t('ergebnis.aendern')}
                </PressableButton>
              </div>
            </Unfold>
            <Unfold isOpen={isColorsOpen} isDivided>
              {participants.map((personId) => {
                const person = byId.get(personId);
                const holderOf = new Map(
                  participants.flatMap((holder) => {
                    const color = colors[holder];
                    return color === undefined ? [] : [[color, holder] as const];
                  }),
                );
                return (
                  <div key={personId} className={colorStyles.colorRow}>
                    <span className={colorStyles.who}>
                      <strong>{person?.name}</strong>
                    </span>
                    <span
                      className={colorStyles.swatches}
                      role="group"
                      aria-label={t('partie.farbeVon', { name: person?.name ?? '' })}
                    >
                      {CATAN_COLOR_KEYS.map((color: CatanColorKey) => {
                        const holder = holderOf.get(color);
                        return (
                          <PressableButton
                            key={color}
                            type="button"
                            className={colorStyles.swatch}
                            style={{ background: `var(--color-catan-${color})` }}
                            aria-pressed={colors[personId] === color}
                            aria-label={t(`farben.${color}`)}
                            onClick={() => {
                              setColors(swapColor(colors, participants, personId, color));
                            }}
                          >
                            {colors[personId] !== color && holder !== undefined && (
                              <span className={colorStyles.initial}>
                                {(byId.get(holder)?.name ?? '').slice(0, 1)}
                              </span>
                            )}
                          </PressableButton>
                        );
                      })}
                    </span>
                  </div>
                );
              })}
            </Unfold>
          </div>
        </section>
      )}

      <section className={shared.section}>
        <h2 className={shared.sectionTitle}>{t('ergebnis.notizen')}</h2>
        <textarea
          className={styles.notes}
          placeholder={t('ergebnis.optional')}
          aria-label={t('ergebnis.notizen')}
          maxLength={MAX_NOTES_LENGTH}
          value={notes}
          onChange={(event) => {
            setNotes(event.target.value);
          }}
        />
      </section>

      <div className={styles.footer}>
        <Unfold isOpen={failure !== null} isQuick>
          <Notice tone="error">
            <p>{failure}</p>
          </Notice>
        </Unfold>
        <PressableButton
          type="submit"
          className={cx(shared.primary, !canSave && styles.looksOff)}
          aria-disabled={!canSave}
        >
          <CheckIcon size={CHECK_SIZE} />
          {t('ergebnis.speichern')}
        </PressableButton>
      </div>

      {isAskingLong && durationMinutes !== undefined && (
        <MatchDialog
          title={t('ergebnis.langeFrage')}
          lines={[
            t('ergebnis.langeText', {
              stunden: Math.floor(durationMinutes / MINUTES_PER_HOUR),
              rest: durationMinutes % MINUTES_PER_HOUR,
            }),
          ]}
          cancelLabel={t('ergebnis.langeKorrigieren')}
          onCancel={() => {
            setIsAskingLong(false);
            durationRef.current?.focus();
          }}
          confirmLabel={t('ergebnis.langeSpeichern')}
          onConfirm={store}
        />
      )}
      {isShowingRules && (
        <MatchDialog
          title={t('partie.modusTitel')}
          cancelLabel={t('partie.schliessen')}
          onCancel={() => {
            setIsShowingRules(false);
          }}
        >
          <ul className={options.ruleList}>
            <li>{t('partie.regelInland')}</li>
            <li>{t('partie.regelStrasse')}</li>
            <li>{t('partie.regelGleich')}</li>
          </ul>
        </MatchDialog>
      )}
    </form>
  );
}

// US-ER-03 AK-1: a taken colour swaps, as in the preparation (Specification 3.3).
function swapColor(
  colors: Readonly<Record<PersonId, CatanColorKey>>,
  participants: readonly PersonId[],
  personId: PersonId,
  color: CatanColorKey,
): Record<PersonId, CatanColorKey> {
  const list = participants.flatMap((id) => {
    const catanColor = colors[id];
    return catanColor === undefined ? [] : [{ personId: id, catanColor }];
  });
  return Object.fromEntries(
    setMatchColor(list, personId, color).map((entry) => [entry.personId, entry.catanColor]),
  );
}
