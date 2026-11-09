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
  /** Small line above the name, e.g. "Als Nächstes" (design I2-D, N1). */
  readonly note?: string | undefined;
  /** Fades in with a new result; a page without a result shows it at rest (E-35). */
  readonly isReveal?: boolean;
  readonly className?: string | undefined;
  /** Distance from the top of a positioned parent, e.g. on the card table of page 8. */
  readonly top?: number | undefined;
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
  note,
  isReveal = true,
  className,
  top,
}: TurnBandProps): React.JSX.Element {
  const content = (
    <>
      <span className={styles.tbPiece}>{icon}</span>
      <span className={styles.tbLine}>
        {note !== undefined && <small className={styles.tbNext}>{note}</small>}
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
    </>
  );
  const look = {
    color: inkOn(color),
    background: `linear-gradient(160deg, var(--color-catan-${color}-band-light), var(--color-catan-${color}-band-dark))`,
    ...(top === undefined ? {} : { top }),
  };
  return isReveal ? (
    <Reveal data-solid="" className={cx(styles.turnBand, className)} style={look}>
      {content}
    </Reveal>
  ) : (
    <div data-solid="" className={cx(styles.turnBand, className)} style={look}>
      {content}
    </div>
  );
}

type DoneBandProps = {
  readonly text: string;
  readonly icon: ReactNode;
  readonly order: TurnBandProps['order'];
};

/**
 * The band once the placement is finished (design I2-D, N1): "Platzierung fertig" in the
 * colours of the app, with the order as mini coins.
 */
export function DoneBand({ text, icon, order }: DoneBandProps): React.JSX.Element {
  return (
    <Reveal data-solid="" className={cx(styles.turnBand, styles.doneBand)}>
      <span className={styles.tbPiece}>{icon}</span>
      <span className={styles.tbLine}>
        <strong className={styles.tbName}>{text}</strong>
      </span>
      <span className={styles.tbOrder}>
        {order.map((person) => (
          <span
            key={person.personId}
            className={styles.mCoin}
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
