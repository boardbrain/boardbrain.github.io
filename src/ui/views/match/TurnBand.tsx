import type { ReactNode } from 'react';
import type { CatanColorKey, PersonId } from '@/core/model';
import { inkOn } from './matchColors';
import { Reveal } from './Reveal';
import styles from './MatchView.module.css';
import { cx } from '@/ui/components/classNames';

type TurnBandProps = {
  /** Symbol of what the person gets. */
  readonly icon: ReactNode;
  readonly name: string;
  /** What follows the name, e.g. " · Stadt". */
  readonly what: string;
  readonly color: CatanColorKey;
  /** Placement order as mini coins; the person at turn is ringed. */
  readonly order: readonly {
    readonly personId: PersonId;
    readonly name: string;
    readonly color: CatanColorKey;
  }[];
  readonly currentId: PersonId;
};

/**
 * Small round band in the Catan colour of the person at turn below the board or the cards
 * (design I2-C, P9): piece, "Name · Stück" and the order as mini coins.
 */
export function TurnBand({
  icon,
  name,
  what,
  color,
  order,
  currentId,
}: TurnBandProps): React.JSX.Element {
  return (
    <Reveal
      className={styles.turnBand}
      style={{
        color: inkOn(color),
        background: `linear-gradient(160deg, var(--color-catan-${color}-band-light), var(--color-catan-${color}-band-dark))`,
      }}
    >
      <span className={styles.tbPiece}>{icon}</span>
      <span className={styles.tbLine}>
        <strong className={styles.tbName}>{name}</strong>
        {what}
      </span>
      <span className={styles.tbOrder}>
        {order.map((person) => (
          <span
            key={person.personId}
            className={cx(styles.mCoin, person.personId === currentId && styles.mCoinNow)}
            style={{ background: `var(--color-catan-${person.color})` }}
            aria-hidden="true"
          >
            {person.name.slice(0, 1)}
          </span>
        ))}
      </span>
    </Reveal>
  );
}
