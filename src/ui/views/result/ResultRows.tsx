import { animate, m, useReducedMotion } from 'motion/react';
import { useLayoutEffect, useRef } from 'react';
import type { CatanColorKey, GroupColorKey, PersonId } from '@/core/model';
import type { ResultRules } from '@/core/results';
import { t } from '@/i18n/t';
import { TrophyIcon } from '@/ui/components/Icons';
import { PressableButton } from '@/ui/components/Pressable';
import { cx } from '@/ui/components/classNames';
import { Coin } from '@/ui/views/match/Coin';
import {
  isPlaceSkipped,
  provisionalPlace,
  type DerivedEntry,
  type Missing,
  type WayEntries,
} from './resultEntry';
import { podiumClass } from './podium';
import styles from './Result.module.css';

const TROPHY_SIZE = 20;
// A row that moves to its new place glides there, like the ring of the order band (TurnBand).
const GLIDE = { duration: 0.25, ease: 'easeOut' } as const;
// The trophy of a new winner jumps up with a wiggle and bounces back while a golden ring spreads
// from it, clearly to be noticed (PO 21.11.). A winner by points waits until the rows have glided.
const POP_FROM = { scale: 1, rotate: 0 };
const POP_TO = { scale: [1, 1.8, 0.85, 1.15, 0.97, 1], rotate: [0, -16, 12, -6, 2, 0] };
const STILL = { scale: 1, rotate: 0 };
const POP = { duration: 0.9, times: [0, 0.25, 0.5, 0.7, 0.85, 1], ease: 'easeOut' as const };
const RING_FROM = { opacity: 0, scale: 0.9 };
const RING_TO = { opacity: [0, 0.9, 0], scale: [0.9, 1.05, 1.7] };
const RING = { duration: 0.8, times: [0, 0.15, 1], ease: 'easeOut' as const };

/**
 * The trophy in its button; a new winner's trophy pops after `delay` seconds.
 */
function Trophy({
  isPopping,
  delay,
  size,
}: {
  readonly isPopping: boolean;
  readonly delay: number;
  readonly size: number;
}): React.JSX.Element {
  return (
    <>
      {isPopping && (
        <m.span
          className={styles.trophyRing}
          aria-hidden="true"
          initial={RING_FROM}
          animate={RING_TO}
          transition={{ ...RING, delay: delay + 0.1 }}
        />
      )}
      <m.span
        className={styles.trophy}
        initial={isPopping ? POP_FROM : false}
        animate={isPopping ? POP_TO : STILL}
        transition={{ ...POP, delay }}
      >
        <TrophyIcon size={size} />
      </m.span>
    </>
  );
}

// The numeric keypad of the iPhone has no minus; the iPad shows its number row with one
// (Product Owner 21.11.2026).
function hasNoMinusOnKeypad(): boolean {
  return /iPhone|iPod/u.test(navigator.userAgent);
}
const PLACE_TROPHY_SIZE = 16;

/**
 * A person of the table as the form shows them: name and colour.
 */
export type ResultPerson = {
  readonly id: PersonId;
  readonly name: string;
  readonly groupColor: GroupColorKey;
  /** Catan only: the colour of the match. */
  readonly catanColor?: CatanColorKey | undefined;
};

/**
 * The person as a coin: in Catan the coin of the match, otherwise the seat in the group colour
 * as on the table page (design I3-B).
 */
export function PersonMark({ person }: { readonly person: ResultPerson }): React.JSX.Element {
  if (person.catanColor !== undefined) {
    return <Coin name={person.name} color={person.catanColor} />;
  }
  return (
    <span
      className={styles.seat}
      style={{ background: `var(--color-group-${person.groupColor})` }}
      aria-hidden="true"
    >
      {person.name.slice(0, 1)}
    </span>
  );
}

type PointsRowsProps = {
  readonly persons: readonly ResultPerson[];
  readonly entries: WayEntries;
  /** Derived from the points as they were when a field was last left. */
  readonly derived: DerivedEntry;
  /** Wrong points, shown while typing. */
  readonly badPoints: readonly PersonId[];
  /** The points as they were when a field was last left. */
  readonly committed: Readonly<Record<PersonId, string>>;
  readonly rules: ResultRules;
  /**
   * Every score is required in this way, since the game also has "Sieger oder Rangfolge" (A2, all
   * games since E-49). A game without a ranking by hand would choose the winner without points.
   */
  readonly isPointsRequired: boolean;
  readonly missing: Missing;
  /** The points come from the score pad and are changed there (US-NB-04 AK-1). */
  readonly isReadOnly?: boolean;
  readonly onPoints: (personId: PersonId, text: string) => void;
  readonly onCommit: () => void;
  readonly onWinner: (personId: PersonId) => void;
};

/**
 * The way of points (design I3-B A2, G3): points for each person; the best wins and shows the
 * trophy, the others their place. While points are missing a dashed circle shows the provisional
 * place. The trophy can only be chosen at a tie at the top, or in Catan without points.
 */
export function PointsRows({
  persons,
  entries,
  derived,
  badPoints,
  committed,
  rules,
  isPointsRequired,
  missing,
  isReadOnly = false,
  onPoints,
  onCommit,
  onWinner,
}: PointsRowsProps): React.JSX.Element {
  const hasAnyPoints = persons.some((person) => (committed[person.id] ?? '').trim() !== '');
  const rowsRef = useRef<HTMLDivElement>(null);
  const isReduced = useReducedMotion() === true;
  const order = persons.map((person) => person.id).join(' ');
  const shownOrder = useRef(order);
  // Motion (external system): sorted by points, each row glides from the place it had before.
  useLayoutEffect(() => {
    const was = shownOrder.current.split(' ');
    shownOrder.current = order;
    const box = rowsRef.current;
    if (box === null || isReduced) {
      return;
    }
    const rows = [...box.children].filter((row) => row instanceof HTMLElement);
    const tops = rows.map((row) => row.offsetTop);
    rows.forEach((row, index) => {
      const from = was.indexOf(row.dataset.person ?? '');
      const top = tops[index];
      const fromTop = tops[from];
      if (from !== index && top !== undefined && fromTop !== undefined) {
        void animate(row, { y: [fromTop - top, 0] }, GLIDE);
      }
    });
  }, [order, isReduced]);
  return (
    <div ref={rowsRef} className={styles.rows}>
      {persons.map((person) => {
        const text = entries.points[person.id] ?? '';
        const isBad = badPoints.includes(person.id);
        const isWinner = derived.winners.includes(person.id);
        const isTieChoice = derived.best.length > 1 && derived.best.includes(person.id);
        const isOpen = !hasAnyPoints && !isPointsRequired;
        const place = derived.places.get(person.id);
        let trailing: React.JSX.Element;
        if (isWinner || isTieChoice || isOpen) {
          trailing = (
            <PressableButton
              type="button"
              className={cx(styles.crown, isWinner && styles.crownOn)}
              aria-label={t('ergebnis.siegerVon', { name: person.name })}
              aria-pressed={isWinner}
              data-need={missing === 'winner' && !isWinner ? 'winner' : undefined}
              disabled={!isTieChoice && !isOpen}
              onClick={() => {
                onWinner(person.id);
              }}
            >
              <Trophy
                key={String(isWinner)}
                isPopping={isWinner}
                delay={isTieChoice || isOpen ? 0 : GLIDE.duration}
                size={TROPHY_SIZE}
              />
            </PressableButton>
          );
        } else if (derived.isPointsComplete && place !== undefined) {
          trailing = (
            <span className={cx(styles.crown, styles.placeNo, podiumClass(place))}>
              {t('ergebnis.platzZahl', { platz: place })}
            </span>
          );
        } else if (!isPointsRequired) {
          // A game without a ranking by hand, with some points: the trophy waits for the rest.
          trailing = (
            <span className={cx(styles.crown, styles.locked)} aria-hidden="true">
              <TrophyIcon size={TROPHY_SIZE} />
            </span>
          );
        } else {
          const provisional = provisionalPlace(derived, person.id, rules);
          trailing = (
            <span className={cx(styles.slot, podiumClass(provisional))} aria-hidden="true">
              {provisional === null ? '' : String(provisional)}
            </span>
          );
        }
        return (
          <div key={person.id} className={styles.row} data-person={person.id}>
            <PersonMark person={person} />
            <span className={styles.name}>{person.name}</span>
            <input
              className={cx(styles.num, isBad && styles.bad)}
              // US-ER-02 AK-3: negative points must be typeable, also where the keypad has no minus.
              inputMode={rules.allowsNegativeScores && hasNoMinusOnKeypad() ? 'text' : 'numeric'}
              enterKeyHint="done"
              autoComplete="off"
              placeholder={t('ergebnis.punkte')}
              aria-label={t('ergebnis.punkteVon', { name: person.name })}
              aria-invalid={isBad}
              readOnly={isReadOnly}
              data-need={missing === 'points' && text.trim() === '' ? 'points' : undefined}
              value={text}
              onChange={(event) => {
                onPoints(person.id, event.target.value);
              }}
              onBlur={onCommit}
            />
            {trailing}
          </div>
        );
      })}
    </div>
  );
}

type PlaceRowsProps = {
  readonly persons: readonly ResultPerson[];
  readonly derived: DerivedEntry;
  readonly missing: Missing;
  readonly onPlace: (personId: PersonId, place: number) => void;
};

/**
 * "Sieger oder Rangfolge" (design I3-B M3): places as numbers in the row, the trophy for place 1;
 * places 2 to n are dashed because they are optional. A place that others' shared places skip
 * is quiet, without a box.
 */
export function PlaceRows({
  persons,
  derived,
  missing,
  onPlace,
}: PlaceRowsProps): React.JSX.Element {
  const count = persons.length;
  return (
    <div className={styles.rows}>
      {persons.map((person) => {
        const current = derived.places.get(person.id);
        const isWrong =
          derived.isRankingWrong &&
          current !== undefined &&
          current !== 1 + [...derived.places.values()].filter((other) => other < current).length;
        return (
          <div key={person.id} className={styles.row} data-person={person.id}>
            <PersonMark person={person} />
            <span className={styles.name}>{person.name}</span>
            <span
              className={cx(styles.placeNums, isWrong && styles.badPlaces)}
              data-need={missing === 'places' && current === undefined ? 'places' : undefined}
            >
              {Array.from({ length: count }, (_, index) => index + 1).map((place) => {
                const isOn = current === place;
                const isSkipped = !isOn && isPlaceSkipped(derived.places, person.id, place);
                return (
                  <PressableButton
                    key={place}
                    type="button"
                    className={cx(
                      styles.pn,
                      place === 1 && styles.pnFirst,
                      isOn && styles.pnOn,
                      place > 1 && !isOn && styles.pnOptional,
                    )}
                    aria-label={t('ergebnis.platzVon', { name: person.name, platz: place })}
                    aria-pressed={isOn}
                    data-need={missing === 'winner' && place === 1 ? 'winner' : undefined}
                    disabled={isSkipped}
                    onClick={() => {
                      onPlace(person.id, place);
                    }}
                  >
                    {place === 1 ? (
                      <Trophy
                        key={String(isOn)}
                        isPopping={isOn}
                        delay={0}
                        size={PLACE_TROPHY_SIZE}
                      />
                    ) : (
                      t('ergebnis.platzZahl', { platz: place })
                    )}
                  </PressableButton>
                );
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
