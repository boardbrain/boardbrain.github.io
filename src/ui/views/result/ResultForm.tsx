import { animate } from 'motion/react';
import { useRef, useState, useTransition } from 'react';
import type { ResultDraft } from '@/app/services/resultService';
import {
  CATAN_COLOR_KEYS,
  parseLocalDate,
  setMatchColor,
  type CatanColorKey,
  type LocalDate,
  type MatchId,
  type PersonId,
} from '@/core/model';
import {
  LONG_DURATION_MINUTES,
  MAX_NOTES_LENGTH,
  plausibilityWarnings,
  type ResultInput,
} from '@/core/results';
import { changeEntry, totalsOf, type ScoreRound } from '@/core/scorepad';
import type { Result } from '@/core/shared';
import { t } from '@/i18n/t';
import { CheckIcon, InfoIcon, PadIcon } from '@/ui/components/Icons';
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
  entriesOf,
  isEntryComplete,
  isSameInput,
  NO_ENTRIES,
  outcomeOf,
  rowOrder,
  setPlace,
  setPoints,
  toggleWinner,
  type Way,
  type WayEntries,
} from './resultEntry';
import { winnerText } from '@/ui/views/management/resultList';
import { PersonMark, PlaceRows, PointsRows, type ResultPerson } from './ResultRows';
import { EntryBar } from '@/ui/views/scorepad/EntryBar';
import { ScoreBlock } from '@/ui/views/scorepad/ScoreBlock';
import { WhenSection } from './WhenSection';
import styles from './Result.module.css';

const CHECK_SIZE = 18;
const PAD_SIZE = 18;
const WHOLE_NUMBER = /^-?\d+$/u;
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
  /**
   * Stores the result: the id of the stored result, otherwise why not, as a text shown above the
   * button.
   */
  readonly save: (input: ResultInput) => Promise<Result<MatchId, string>>;
  readonly onSaved: (note: SavedNote, matchId: MatchId) => void;
  /**
   * Changing a stored result (US-ER-05): the form starts with its values, asks before storing a
   * change (AK-1) and calls this without a change.
   */
  readonly onUnchanged?: (() => void) | undefined;
  /**
   * Starts the score pad with this game and table (US-NB-01 AK-2, design I3-C2 FB6); only for a
   * new result of a custom game with points.
   */
  readonly onPad?: (() => void) | undefined;
};

// The way and entries the form starts with: a stored result when changing it or the sums of the
// score pad, else nothing.
function startOf(
  draft: ResultDraft,
  isPrefilled: boolean,
): { readonly way: Way; readonly byWay: Readonly<Record<Way, WayEntries>> } {
  const empty = { points: NO_ENTRIES, places: NO_ENTRIES };
  if (!isPrefilled) {
    return { way: draft.rules.scoring === null ? 'places' : 'points', byWay: empty };
  }
  const { way, entries } = entriesOf(draft.values, draft.rules);
  return { way, byWay: { ...empty, [way]: entries } };
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
  onUnchanged,
  onPad,
}: ResultFormProps): React.JSX.Element {
  const { rules, participants, values } = draft;
  const isEditing = onUnchanged !== undefined;
  // US-NB-04 AK-1: from the score pad the points are its sums and are changed there.
  const isFromPad = values.rounds !== undefined && !isEditing;
  const padInputRef = useRef<HTMLInputElement>(null);
  const [rounds, setRounds] = useState<readonly ScoreRound[] | null>(values.rounds ?? null);
  const [padCell, setPadCell] = useState<{
    readonly index: number;
    readonly personId: PersonId;
  } | null>(null);
  const [padText, setPadText] = useState('');
  const [padError, setPadError] = useState<string | null>(null);
  const [isAskingRounds, setIsAskingRounds] = useState(false);
  const [deletingRound, setDeletingRound] = useState<number | null>(null);
  const isCatan = rules.hasSingleWinner;
  const hasBothWays = rules.scoring !== null && rules.supportsRanking;
  const formRef = useRef<HTMLFormElement>(null);
  const durationRef = useRef<HTMLInputElement>(null);
  const [start] = useState(() => startOf(draft, isEditing || values.rounds !== undefined));
  const [way, setWay] = useState<Way>(start.way);
  const [byWay, setByWay] = useState<Readonly<Record<Way, WayEntries>>>(start.byWay);
  const [committed, setCommitted] = useState<Readonly<Record<PersonId, string>>>(
    start.byWay.points.points,
  );
  const [date, setDate] = useState<LocalDate>(() => {
    const parsed = parseLocalDate(values.date);
    return parsed.ok ? parsed.value : today;
  });
  const [time, setTime] = useState(values.time ?? '');
  const [edition, setEdition] = useState(values.edition ?? rules.editions[0]);
  const [colors, setColors] = useState(values.catanColors);
  const [isColorsOpen, setIsColorsOpen] = useState(false);
  const [duration, setDuration] = useState(() => durationFields(values.durationMinutes));
  const [notes, setNotes] = useState(values.notes ?? '');
  const [isAskingLong, setIsAskingLong] = useState(false);
  const [isAskingChange, setIsAskingChange] = useState(false);
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

  // US-NB-05 AK-2: the points of a result with rounds are the sums of its rounds.
  function changeRounds(next: readonly ScoreRound[]): void {
    const totals = totalsOf(next, participants);
    const points = Object.fromEntries(
      participants.map((personId) => [personId, String(totals[personId] ?? 0)]),
    );
    setRounds(next);
    change({ ...entries, points });
    setCommitted(points);
  }

  function closePadCell(): void {
    const cell = padCell;
    setPadCell(null);
    setPadError(null);
    const text = padText.trim();
    if (cell === null || rounds === null || !WHOLE_NUMBER.test(text)) {
      return;
    }
    const changed = changeEntry(
      rounds,
      cell.index,
      cell.personId,
      Number(text),
      participants,
      'app',
    );
    if (changed.ok) {
      changeRounds(changed.value);
    }
  }

  // FA-NB-08: "Sieger oder Rangfolge" discards the rounds, after a warning.
  function toggleWay(): void {
    if (way === 'points' && rounds !== null) {
      setIsAskingRounds(true);
      return;
    }
    setWay(way === 'places' ? 'points' : 'places');
  }

  const padPerson = persons.find((candidate) => candidate.id === padCell?.personId);

  function input(): ResultInput {
    return {
      date,
      ...(time === '' ? {} : { time }),
      ...(edition === undefined ? {} : { edition }),
      ...(values.mode === undefined ? {} : { mode: values.mode }),
      ...outcomeOf(way, derived, participants),
      ...(way === 'points' && rounds !== null
        ? { rounds, ...(values.target === undefined ? {} : { target: values.target }) }
        : {}),
      ...(colors === undefined ? {} : { catanColors: colors }),
      ...(durationMinutes === undefined ? {} : { durationMinutes }),
      ...(notes.trim() === '' ? {} : { notes }),
    };
  }

  function store(): void {
    setIsAskingLong(false);
    setIsAskingChange(false);
    const result = input();
    // Unexpected errors in the transition reach the error view of the routes (ADR-025).
    startTransition(async () => {
      const stored = await save(result);
      setFailure(stored.ok ? null : stored.error);
      if (stored.ok) {
        const names = derived.winners.map((personId) => byId.get(personId)?.name ?? '');
        onSaved(
          {
            who: winnerText(names),
            where: t('ergebnis.gespeichert', { spiel: gameName, tisch: tableName }),
          },
          stored.value,
        );
      }
    });
  }

  // US-ER-05 AK-1: a change is stored only after the warning; without a change nothing is asked.
  function proceed(): void {
    setIsAskingLong(false);
    if (isEditing) {
      setIsAskingChange(true);
      return;
    }
    store();
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
        if (onUnchanged !== undefined && isSameInput(input(), values)) {
          onUnchanged();
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
        proceed();
      }}
    >
      <section className={shared.section}>
        <h2 className={shared.sectionTitle}>
          {t('ergebnis.abschnitt')}
          {onPad !== undefined && (
            <PressableButton
              type="button"
              className={styles.padBtn}
              aria-label={t('notizblock.formKnopf')}
              onClick={onPad}
            >
              <PadIcon size={PAD_SIZE} />
            </PressableButton>
          )}
        </h2>
        {hasBothWays && (
          <div className={shared.group}>
            <PressableButton
              type="button"
              role="switch"
              className={styles.switchRow}
              aria-checked={way === 'places'}
              onClick={toggleWay}
            >
              <span className={styles.txt}>
                {t('ergebnis.siegerOderRangfolge')}
                <small className={styles.sub}>{t('ergebnis.stattPunkten')}</small>
              </span>
              <span className={options.switch} />
            </PressableButton>
          </div>
        )}
        {way === 'points' && rounds !== null && isEditing ? (
          <ScoreBlock
            persons={persons}
            rounds={rounds}
            scoring={rules.scoring ?? 'highest-wins'}
            calculation="app"
            target={values.target ?? null}
            editing={padCell === null ? null : { ...padCell, text: padText }}
            onCell={(index, personId) => {
              padInputRef.current?.focus({ preventScroll: true });
              setPadCell({ index, personId });
              setPadText(String(rounds[index]?.[personId] ?? ''));
              setPadError(null);
            }}
            onRound={(index) => {
              setDeletingRound(index);
            }}
          />
        ) : (
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
                isReadOnly={isFromPad && rounds !== null}
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
        )}
      </section>
      {isEditing && rounds !== null && (
        <EntryBar
          isOpen={padCell !== null}
          inputRef={padInputRef}
          target={
            padCell === null || padPerson === undefined
              ? null
              : {
                  person: padPerson,
                  subtitle: t('notizblock.rundeAendern', { runde: padCell.index + 1 }),
                }
          }
          strip={[]}
          entries={{}}
          value={padText}
          isLast
          error={padError}
          onValue={(text) => {
            setPadText(text);
            setPadError(null);
          }}
          onEnter={() => {
            if (!WHOLE_NUMBER.test(padText.trim())) {
              setPadError(t('notizblock.ungueltig'));
              return;
            }
            padInputRef.current?.blur();
          }}
          onPerson={() => undefined}
          onClose={closePadCell}
        />
      )}

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
          {t(isEditing ? 'ergebnisse.aenderungenSpeichern' : 'ergebnis.speichern')}
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
          onConfirm={proceed}
        />
      )}
      {isAskingChange && (
        <MatchDialog
          title={t('ergebnisse.aendernFrage')}
          lines={[t('ergebnisse.aendernText')]}
          cancelLabel={t('allgemein.zurueck')}
          onCancel={() => {
            setIsAskingChange(false);
          }}
          confirmLabel={t('allgemein.speichern')}
          onConfirm={store}
        />
      )}
      {isAskingRounds && rounds !== null && (
        <MatchDialog
          title={t('notizblock.verwerfenFrage')}
          lines={[
            rounds.length === 1
              ? t('notizblock.verwerfenEineRunde')
              : t('notizblock.verwerfenText', { anzahl: rounds.length }),
            t('notizblock.verwerfenStatistik'),
          ]}
          cancelLabel={t('allgemein.abbrechen')}
          onCancel={() => {
            setIsAskingRounds(false);
          }}
          confirmLabel={t('notizblock.verwerfen')}
          isDanger
          onConfirm={() => {
            setIsAskingRounds(false);
            setRounds(null);
            setWay('places');
          }}
        />
      )}
      {deletingRound !== null && rounds !== null && (
        <MatchDialog
          title={t('notizblock.rundeLoeschenFrage', { runde: deletingRound + 1 })}
          lines={[
            rounds.length > 1 ? t('notizblock.rundeLoeschenText') : t('notizblock.letzteRunde'),
          ]}
          cancelLabel={t('allgemein.abbrechen')}
          onCancel={() => {
            setDeletingRound(null);
          }}
          {...(rounds.length > 1
            ? {
                confirmLabel: t('notizblock.loeschen'),
                isDanger: true,
                onConfirm: () => {
                  changeRounds(rounds.filter((_, index) => index !== deletingRound));
                  setDeletingRound(null);
                },
              }
            : {})}
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
