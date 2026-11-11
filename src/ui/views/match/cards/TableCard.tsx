import { m } from 'motion/react';
import type { ReactNode } from 'react';
import type { CatanColorKey } from '@/core/model';
import { cx } from '@/ui/components/classNames';
import { Coin } from '../Coin';
import { CardBack } from './CardBack';
import type { CardBox } from './cardLayout';
import styles from './Cards.module.css';

// Turning a card over by hand (design I2-D, page 8): 0.34 s.
const FLIP = { duration: 0.34, ease: 'easeInOut' } as const;
// The face turned away is hidden from the middle of the turn on: WebKit does not hide it by
// backface-visibility alone and would draw the back over the front.
const FACE_SWITCH = { duration: 0, delay: FLIP.duration / 2 } as const;

// Fronts are laid out for cards of at least this width (an order card on a phone); smaller
// cards, as on low tablets in landscape, show the front scaled down as a whole.
const FRONT_WIDTH = 83;

type TableCardProps = {
  readonly box: CardBox;
  /** The front; a card face down shows the back R1 instead. */
  readonly front?: ReactNode;
  readonly isFaceDown?: boolean;
  /** The front brings its own frame and shadow and may stand out, e.g. a lifted order card. */
  readonly isBareFront?: boolean;
  /** Stacking order; later cards lie on top. */
  readonly z?: number;
  /** Seconds before turning over, e.g. one after another with "Alle umdrehen". */
  readonly delay?: number;
  readonly className?: string | undefined;
};

/**
 * A card lying on the card table (design I2-D): front and back of the same size at the same
 * place. Turning it over is animated; a card that is already face up or down when it appears
 * is shown at rest, also after a restart (US-AB-05 AK-3, FA-SR-05).
 */
export function TableCard({
  box,
  front,
  isFaceDown = false,
  isBareFront = false,
  z,
  delay = 0,
  className,
}: TableCardProps): React.JSX.Element {
  return (
    <div
      data-solid=""
      className={cx(styles.card, className)}
      style={{ left: box.x, top: box.y, width: box.w, height: box.h, zIndex: z }}
    >
      <m.div
        className={styles.inner}
        initial={false}
        animate={{ rotateY: isFaceDown ? 180 : 0 }}
        transition={{ ...FLIP, delay }}
      >
        {front !== undefined && (
          <m.div
            className={cx(styles.front, isBareFront && styles.bareFront)}
            initial={false}
            animate={{ opacity: isFaceDown ? 0 : 1 }}
            transition={{ ...FACE_SWITCH, delay: FACE_SWITCH.delay + delay }}
          >
            <FittedFront w={box.w} h={box.h}>
              {front}
            </FittedFront>
          </m.div>
        )}
        <m.div
          className={styles.back}
          initial={false}
          animate={{ opacity: isFaceDown ? 1 : 0 }}
          transition={{ ...FACE_SWITCH, delay: FACE_SWITCH.delay + delay }}
        >
          <CardBack />
        </m.div>
      </m.div>
    </div>
  );
}

type FittedFrontProps = {
  readonly w: number;
  readonly h: number;
  readonly children: ReactNode;
};

/**
 * A front as laid out for cards of at least 83 px; a smaller card shows it scaled down as a
 * whole (design I2-D).
 */
export function FittedFront({ w, h, children }: FittedFrontProps): React.JSX.Element {
  return w < FRONT_WIDTH ? (
    <div
      className={styles.scaledFront}
      style={{
        width: FRONT_WIDTH,
        height: (FRONT_WIDTH * h) / w,
        transform: `scale(${String(w / FRONT_WIDTH)})`,
      }}
    >
      {children}
    </div>
  ) : (
    <>{children}</>
  );
}

type PersonFrontProps = {
  readonly name: string;
  readonly color: CatanColorKey;
};

/**
 * The front of a person card (design I2-D, page 5): coin, name and a stripe in the Catan colour.
 */
export function PersonFront({ name, color }: PersonFrontProps): React.JSX.Element {
  return (
    <span className={styles.person}>
      <Coin name={name} color={color} />
      <strong className={styles.personName}>{name}</strong>
      <span className={styles.stripe} style={{ background: `var(--color-catan-${color})` }} />
    </span>
  );
}

type PlaceProps = {
  readonly box: CardBox;
  /** The number of the place or "?"; hidden once a card lies on it. */
  readonly label: string;
  readonly isFilled: boolean;
  /** Its name in a movement, which fades its dashed line (design I2-E). */
  readonly stageName?: string | undefined;
};

/**
 * A dashed place where a drawn card is laid (design I2-D). Once a card lies on it, the dashed
 * line goes, so it does not show at the edge (decision of the product owner 09.11.2026).
 */
export function Place({ box, label, isFilled, stageName }: PlaceProps): React.JSX.Element {
  return (
    <div
      data-solid=""
      data-stage={stageName}
      className={cx(styles.place, isFilled && styles.placeFilled)}
      style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}
