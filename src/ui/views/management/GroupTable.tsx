import type { CatanColorKey, GroupColorKey, PersonId } from '@/core/model';
import styles from './GroupTable.module.css';

/**
 * One seat at the table: a member with the colours they have in the group.
 */
export type TableSeat = {
  readonly id: PersonId;
  /** Spoken description, e.g. "Anna, Rot". */
  readonly label: string;
  readonly initial: string;
  readonly groupColor: GroupColorKey;
  /** Catan colour, shown as a square marker; only where Catan is possible. */
  readonly catanColor?: CatanColorKey;
};

type GroupTableProps = {
  readonly seats: readonly TableSeat[];
  /** `small` for the overview cards (decoration), `large` for the editor (seats are buttons). */
  readonly size: 'small' | 'large';
  readonly selectedId?: PersonId | undefined;
  readonly onSelect?: (id: PersonId) => void;
  /** Text in the middle of the table (large only). */
  readonly title?: string | undefined;
  readonly subtitle?: string | undefined;
};

// More than this many seats get smaller so they still fit around the table.
const DENSE_FROM = 7;
const FULL_CIRCLE_DEGREES = 360;

function seatPosition(index: number, count: number): { left: string; top: string } {
  const angle = (index / count) * FULL_CIRCLE_DEGREES - 90;
  const radians = (angle * Math.PI) / 180;
  const radius = 41;
  return {
    left: `${String(50 + radius * Math.cos(radians))}%`,
    top: `${String(50 + radius * Math.sin(radians))}%`,
  };
}

/**
 * Round table with the members of a group as coloured seats (US-PG-03, Specification 3.3). In
 * the overview it only shows the colours; in the editor each seat selects a person.
 */
export function GroupTable({
  seats,
  size,
  selectedId,
  onSelect,
  title,
  subtitle,
}: GroupTableProps): React.JSX.Element {
  const isDense = seats.length >= DENSE_FROM;
  const className = [
    styles.wrap,
    size === 'large' ? styles.large : styles.small,
    isDense && styles.dense,
  ]
    .filter((name) => typeof name === 'string')
    .join(' ');
  return (
    <div className={className}>
      <div className={styles.table}>
        {title !== undefined && <strong className={styles.title}>{title}</strong>}
        {subtitle !== undefined && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
      {seats.map((seat, index) => {
        const position = seatPosition(index, seats.length);
        const style = { ...position, background: `var(--color-group-${seat.groupColor})` };
        const mark = seat.catanColor !== undefined && (
          <span
            className={styles.catan}
            style={{ background: `var(--color-catan-${seat.catanColor})` }}
          />
        );
        if (size === 'small') {
          return <span key={seat.id} className={styles.seat} style={style} aria-hidden="true" />;
        }
        return (
          <button
            key={seat.id}
            type="button"
            className={seat.id === selectedId ? styles.seatSelected : styles.seat}
            style={style}
            aria-label={seat.label}
            aria-pressed={seat.id === selectedId}
            onClick={() => {
              onSelect?.(seat.id);
            }}
          >
            {seat.initial}
            {mark}
          </button>
        );
      })}
    </div>
  );
}
