import { animate, useReducedMotion, type AnimationPlaybackControls } from 'motion/react';
import { useEffect, useRef } from 'react';
import type { PersonId, ScoreTarget, ScoringDirection } from '@/core/model';
import {
  placesOfStanding,
  standingsOf,
  totalsOf,
  type ScorePadCalculation,
  type ScoreRound,
} from '@/core/scorepad';
import { formatPadNumber, formatSigned } from '@/i18n/format';
import { t } from '@/i18n/t';
import { TargetIcon, TrophyIcon } from '@/ui/components/Icons';
import { PressableButton } from '@/ui/components/Pressable';
import { cx } from '@/ui/components/classNames';
import type { ResultPerson } from '@/ui/views/result/ResultRows';
import { targetText } from './padTexts';
import { glideScroll } from './scrollGlide';
import styles from './ScoreBlock.module.css';

// A small phone shows about 4 persons, a phone 4 to 5, a tablet many more; with more persons the
// paper moves sideways (PO 24.11.2026).
const COLUMN_MIN_WIDTH = 64;
const ROUND_COLUMN_WIDTH = 30;
const PLACE_TROPHY_SIZE = 14;
const CORNER_ICON_SIZE = 14;
// How far a cell may stick out and still count as seen, against rounding of the browser.
const SEEN_SLACK = 2;
// A stored round lights up once in gold, like a new result in the list (GroupResults).
const LIGHT_UP = { duration: 1.6, times: [0, 0.2, 1], ease: 'easeOut' as const };

/**
 * The round being typed (US-NB-02 AK-2): the numbers so far, the person at the keyboard and the
 * persons still missing when the round should have been stored.
 */
export type NewRound = {
  readonly entries: Readonly<Record<PersonId, number | undefined>>;
  readonly current: PersonId | null;
  readonly missing: readonly PersonId[];
};

type ScoreBlockProps = {
  readonly persons: readonly ResultPerson[];
  readonly rounds: readonly ScoreRound[];
  readonly scoring: ScoringDirection;
  readonly calculation: ScorePadCalculation;
  readonly target: ScoreTarget | null;
  /** The cell at the keyboard while changing a stored number, with what is typed so far. */
  readonly editing?: {
    readonly index: number;
    readonly personId: PersonId;
    readonly text: string;
  } | null;
  /** The new round below the stored ones; without it the block only shows (DF1). */
  readonly newRound?: NewRound | null;
  /** The round just stored: it fades in, the others stand still. */
  readonly freshRound?: number | null;
  /** Read only (detail): no buttons, smaller rows, the target in the corner. */
  readonly isReadOnly?: boolean;
  readonly isInCard?: boolean;
  readonly onCell?: (index: number, personId: PersonId) => void;
  readonly onNewCell?: (personId: PersonId) => void;
  readonly onRound?: (index: number) => void;
};

const PLACE_CLASSES = [styles.first, styles.second, styles.third];

function placeClass(place: number | undefined): string | undefined {
  return place === undefined ? undefined : PLACE_CLASSES[place - 1];
}

/**
 * The score pad BD2 (US-NB-02 AK-1, design I3-C2): per person a column, per round a row with the
 * standing after it and the points of the round, below the new round and the places after the
 * standing. With "Selbst rechnen" only the standings (SC2). A standing at or above a target in
 * points is red (FA-NB-06). The leading column is lightly golden.
 */
export function ScoreBlock({
  persons,
  rounds,
  scoring,
  calculation,
  target,
  editing = null,
  newRound = null,
  freshRound = null,
  isReadOnly = false,
  isInCard = false,
  onCell,
  onNewCell,
  onRound,
}: ScoreBlockProps): React.JSX.Element {
  const participants = persons.map((person) => person.id);
  const standings = standingsOf(rounds, participants);
  const totals = totalsOf(rounds, participants);
  const places = rounds.length > 0 ? placesOfStanding(totals, participants, scoring) : null;
  const isLead = (personId: PersonId): boolean => places?.get(personId) === 1;
  const reachedAt = target?.kind === 'points' ? target.value : null;
  const isSelf = calculation === 'self';
  const nextNumber = rounds.length + 1;
  const isTargetReached =
    target !== null &&
    (target.kind === 'rounds'
      ? rounds.length >= target.value
      : participants.some((personId) => (totals[personId] ?? 0) >= target.value));

  const paperRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLTableSectionElement>(null);
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const isReduced = useReducedMotion() === true;
  // The cell at the keyboard: in a stored round being changed or in the new round.
  const typedRow =
    editing !== null
      ? editing.index
      : newRound !== null && newRound.current !== null
        ? rounds.length
        : null;
  const typedPerson = editing?.personId ?? newRound?.current ?? null;
  const typedColumn = persons.findIndex((person) => person.id === typedPerson);

  // External system: the scroll position of the paper. Only when the cell at the keyboard would be
  // hidden (under the names, under the keyboard or beside the paper), the paper glides until its
  // row is just below the names and its column in view; also once the keyboard has made the page
  // smaller (PO 24.11.2026).
  useEffect(() => {
    const paper = paperRef.current;
    const row = typedRow === null ? undefined : bodyRef.current?.rows[typedRow];
    const cell = row?.cells[typedColumn + 1];
    const roundCell = row?.cells[0];
    const head = headRef.current;
    if (paper === null || cell === undefined || roundCell === undefined || head === null) {
      return undefined;
    }
    let glide: AnimationPlaybackControls | null = null;
    const reveal = (): void => {
      const frame = paper.getBoundingClientRect();
      const box = cell.getBoundingClientRect();
      const top = head.getBoundingClientRect().bottom;
      const bottom = frame.top + paper.clientTop + paper.clientHeight;
      const left = roundCell.getBoundingClientRect().right;
      const right = frame.left + paper.clientLeft + paper.clientWidth;
      const isRowSeen = box.top >= top - SEEN_SLACK && box.bottom <= bottom + SEEN_SLACK;
      const isColumnSeen = box.left >= left - SEEN_SLACK && box.right <= right + SEEN_SLACK;
      if (isRowSeen && isColumnSeen) {
        return;
      }
      const fromTop = paper.scrollTop;
      const fromLeft = paper.scrollLeft;
      const toTop = isRowSeen
        ? fromTop
        : Math.min(fromTop + box.top - top, paper.scrollHeight - paper.clientHeight);
      const toLeft = isColumnSeen
        ? fromLeft
        : box.left < left
          ? fromLeft + box.left - left
          : fromLeft + box.right - right;
      glide?.stop();
      glide = glideScroll(paper, { left: toLeft, top: toTop }, isReduced);
    };
    reveal();
    // Older browsers and test environments cannot watch the size: the cell is then checked once.
    const watcher = 'ResizeObserver' in window ? new ResizeObserver(reveal) : null;
    watcher?.observe(paper);
    return () => {
      watcher?.disconnect();
      glide?.stop();
    };
  }, [typedRow, typedColumn, isReduced]);

  // Motion (external system): the round just stored lights up once in gold, as soon as the block
  // shows it (the saved rounds arrive a moment after the answer of the service).
  const isFreshShown = freshRound !== null && rounds.length === freshRound;
  useEffect(() => {
    const row = isFreshShown ? bodyRef.current?.rows[rounds.length - 1] : undefined;
    if (row === undefined || isReduced) {
      return undefined;
    }
    const gold = getComputedStyle(row).getPropertyValue('--color-accent-text').trim();
    if (gold === '') {
      return undefined;
    }
    const glow = animate(
      row,
      { backgroundColor: [`${gold}00`, `${gold}40`, `${gold}00`] },
      LIGHT_UP,
    );
    return () => {
      glow.stop();
    };
  }, [isFreshShown, rounds.length, isReduced]);

  function stack(standing: number, points: number, isPreview = false): React.JSX.Element {
    return (
      <span className={cx(styles.stack, isPreview && styles.preview)}>
        <b className={cx(reachedAt !== null && standing >= reachedAt && styles.reached)}>
          {formatPadNumber(standing)}
        </b>
        {!isSelf && (
          <small className={cx(points < 0 && styles.minus)}>{formatSigned(points)}</small>
        )}
      </span>
    );
  }

  return (
    <div
      ref={paperRef}
      className={cx(styles.paper, isInCard && styles.inCard)}
      role="region"
      aria-label={t('notizblock.block')}
    >
      <table
        className={styles.table}
        style={{ minWidth: ROUND_COLUMN_WIDTH + persons.length * COLUMN_MIN_WIDTH }}
      >
        <colgroup>
          <col className={styles.roundCol} />
          {persons.map((person) => (
            <col key={person.id} />
          ))}
        </colgroup>
        <thead ref={headRef}>
          <tr className={styles.names}>
            <th className={styles.rn} scope="col">
              {isReadOnly && target !== null && (
                <span
                  className={cx(styles.corner, isTargetReached && styles.reached)}
                  aria-label={t('notizblock.zielLabel', { ziel: targetText(target) })}
                >
                  <TargetIcon size={CORNER_ICON_SIZE} />
                  <span>{targetText(target)}</span>
                </span>
              )}
            </th>
            {persons.map((person) => (
              <th key={person.id} scope="col" className={cx(isLead(person.id) && styles.lead)}>
                <span className={styles.headCell}>
                  <span
                    className={styles.seat}
                    style={{ background: `var(--color-group-${person.groupColor})` }}
                    aria-hidden="true"
                  >
                    {person.name.slice(0, 1)}
                  </span>
                  <span className={styles.name}>{person.name}</span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody ref={bodyRef}>
          {rounds.map((round, index) => {
            const standing = standings[index] ?? round;
            const number = index + 1;
            return (
              <tr key={number} className={styles.row}>
                <th className={styles.rn} scope="row">
                  {isReadOnly || onRound === undefined ? (
                    <span className={styles.roundNumber}>{number}</span>
                  ) : (
                    <PressableButton
                      type="button"
                      className={styles.roundBtn}
                      aria-label={t('notizblock.rundeLoeschen', { runde: number })}
                      onClick={() => {
                        onRound(index);
                      }}
                    >
                      {number}
                    </PressableButton>
                  )}
                </th>
                {persons.map((person) => {
                  const value = standing[person.id] ?? 0;
                  const points = round[person.id] ?? 0;
                  const isEditing = editing?.index === index && editing.personId === person.id;
                  return (
                    <td key={person.id} className={cx(isLead(person.id) && styles.lead)}>
                      {isReadOnly || onCell === undefined ? (
                        <span
                          className={styles.readCell}
                          aria-label={t('notizblock.zelleLesen', {
                            runde: number,
                            name: person.name,
                            stand: value,
                          })}
                        >
                          {stack(value, points)}
                        </span>
                      ) : (
                        <PressableButton
                          type="button"
                          className={cx(styles.cell, isEditing && styles.editing)}
                          aria-label={t('notizblock.zelle', {
                            runde: number,
                            name: person.name,
                            stand: value,
                          })}
                          aria-pressed={isEditing}
                          onMouseDown={(event) => {
                            // The keyboard stays open when moving to another cell.
                            event.preventDefault();
                          }}
                          onClick={() => {
                            onCell(index, person.id);
                          }}
                        >
                          {isEditing ? (
                            // What is typed shows at once; the cursor while it is empty.
                            <span className={styles.stack}>
                              <b className={styles.typed}>{editing.text.replace('-', '−')}</b>
                            </span>
                          ) : (
                            stack(value, points)
                          )}
                        </PressableButton>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {newRound !== null && (
            <tr className={styles.newRow}>
              <th className={styles.rn} scope="row">
                {nextNumber}
              </th>
              {persons.map((person) => {
                const entry = newRound.entries[person.id];
                const isActive = newRound.current === person.id;
                const before = totals[person.id] ?? 0;
                return (
                  <td key={person.id}>
                    <span className={styles.newWrap}>
                      <PressableButton
                        type="button"
                        className={cx(
                          styles.newCell,
                          isActive && styles.active,
                          newRound.missing.includes(person.id) && styles.missing,
                        )}
                        aria-label={t('notizblock.neueZelle', {
                          runde: nextNumber,
                          name: person.name,
                        })}
                        aria-pressed={isActive}
                        onMouseDown={(event) => {
                          event.preventDefault();
                        }}
                        onClick={() => {
                          onNewCell?.(person.id);
                        }}
                      >
                        {entry !== undefined
                          ? stack(
                              isSelf ? entry : before + entry,
                              isSelf ? entry - before : entry,
                              true,
                            )
                          : !isActive && <span className={styles.dot}>{t('notizblock.leer')}</span>}
                      </PressableButton>
                    </span>
                  </td>
                );
              })}
            </tr>
          )}
        </tbody>
        {places !== null && (
          <tfoot>
            <tr className={styles.places}>
              <th className={styles.rn} scope="row">
                {t('notizblock.platz')}
              </th>
              {persons.map((person) => {
                const place = places.get(person.id);
                return (
                  <td key={person.id} className={cx(isLead(person.id) && styles.lead)}>
                    <span
                      className={cx(styles.place, placeClass(place))}
                      aria-label={t('ergebnis.platzVon', { name: person.name, platz: place ?? 0 })}
                    >
                      {place === 1 ? <TrophyIcon size={PLACE_TROPHY_SIZE} /> : place}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
