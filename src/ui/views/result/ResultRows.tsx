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
import styles from './Result.module.css';

const TROPHY_SIZE = 20;
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
  readonly derived: DerivedEntry;
  readonly rules: ResultRules;
  /** A custom game: every score is required in this way (A2); in Catan points are optional. */
  readonly isPointsRequired: boolean;
  readonly missing: Missing;
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
  rules,
  isPointsRequired,
  missing,
  onPoints,
  onCommit,
  onWinner,
}: PointsRowsProps): React.JSX.Element {
  const hasAnyPoints = persons.some((person) => (entries.points[person.id] ?? '').trim() !== '');
  return (
    <div className={styles.rows}>
      {persons.map((person) => {
        const text = entries.points[person.id] ?? '';
        const isBad = derived.badPoints.includes(person.id);
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
              <TrophyIcon size={TROPHY_SIZE} />
            </PressableButton>
          );
        } else if (derived.isPointsComplete && place !== undefined) {
          trailing = (
            <span className={cx(styles.crown, styles.placeNo)}>
              {t('ergebnis.platzZahl', { platz: place })}
            </span>
          );
        } else if (!isPointsRequired) {
          // Catan with some points: the trophy waits for the others.
          trailing = (
            <span className={cx(styles.crown, styles.locked)} aria-hidden="true">
              <TrophyIcon size={TROPHY_SIZE} />
            </span>
          );
        } else {
          const provisional = provisionalPlace(derived, person.id, rules);
          trailing = (
            <span className={styles.slot} aria-hidden="true">
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
              inputMode="numeric"
              enterKeyHint="next"
              autoComplete="off"
              placeholder={t('ergebnis.punkte')}
              aria-label={t('ergebnis.punkteVon', { name: person.name })}
              aria-invalid={isBad}
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
                      <TrophyIcon size={PLACE_TROPHY_SIZE} />
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
