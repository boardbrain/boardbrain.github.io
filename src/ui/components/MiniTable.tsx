import type { GroupColorKey, PersonId } from '@/core/model';
import styles from './MiniTable.module.css';

/**
 * One seat of a mini table: who sits there and in which group colour.
 */
export type MiniSeat = {
  readonly personId: PersonId;
  readonly groupColor: GroupColorKey;
};

type MiniTableProps = {
  readonly seats: readonly MiniSeat[];
  /** Width and height in pixels. */
  readonly diameter: number;
  /** This person's seat gets a ring, the others are dimmed (US-VW-05, personal page). */
  readonly highlightId?: PersonId | undefined;
};

// From this many seats they get smaller so they still fit around the table.
const DENSE_FROM = 7;
const FULL_CIRCLE_DEGREES = 360;
const SEAT_RADIUS_PERCENT = 40;

function seatPosition(index: number, count: number): { left: string; top: string } {
  const radians = (((index / count) * FULL_CIRCLE_DEGREES - 90) * Math.PI) / 180;
  return {
    left: `${String(50 + SEAT_RADIUS_PERCENT * Math.cos(radians))}%`,
    top: `${String(50 + SEAT_RADIUS_PERCENT * Math.sin(radians))}%`,
  };
}

function seatClass(seat: MiniSeat, highlightId: PersonId | undefined): string | undefined {
  if (highlightId === undefined) {
    return styles.seat;
  }
  return seat.personId === highlightId ? styles.seatHighlighted : styles.seatDimmed;
}

/**
 * Small round table with coloured seats, e.g. in a row of a person's tables (design I1-E).
 * Decorative: the row around it names the table.
 */
export function MiniTable({ seats, diameter, highlightId }: MiniTableProps): React.JSX.Element {
  const className = [styles.table, seats.length >= DENSE_FROM && styles.dense]
    .filter((name) => typeof name === 'string')
    .join(' ');
  return (
    <span className={className} style={{ width: diameter, height: diameter }} aria-hidden="true">
      <span className={styles.top} />
      {seats.map((seat, index) => (
        <span
          key={seat.personId}
          className={seatClass(seat, highlightId)}
          style={{
            ...seatPosition(index, seats.length),
            background: `var(--color-group-${seat.groupColor})`,
          }}
        />
      ))}
    </span>
  );
}
