import { animate, m, useReducedMotion } from 'motion/react';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { CatanColorKey, PersonId } from '@/core/model';
import { inkOn } from './matchColors';
import styles from './MatchView.module.css';
import { cx } from '@/ui/components/classNames';

type TurnBandProps = {
  /** Symbol of what the person gets. */
  readonly icon: ReactNode;
  /** The name of the person at turn, or e.g. "Platzierung fertig". */
  readonly name: string;
  /** What follows the name, e.g. " · Stadt". */
  readonly what?: string;
  /** Catan colour of the person at turn; `null` in the colours of the app (design I2-D, N1). */
  readonly color: CatanColorKey | null;
  /** Placement order as mini coins; the person at turn is ringed. */
  readonly order: readonly {
    readonly personId: PersonId;
    readonly name: string;
    readonly color: CatanColorKey;
  }[];
  /** The person ringed, `null` when no one is at turn. */
  readonly currentId: PersonId | null;
  /** Small line above the name, e.g. "Als Nächstes" (design I2-D, N1; I2-E J1, D1). */
  readonly note?: string | undefined;
  readonly className?: string | undefined;
};

type BandFace = Omit<TurnBandProps, 'className'>;

// Design I2-E: when the person changes, the ring glides to the next coin and the old band fades
// out over the new one.
const RING_GLIDE = { duration: 0.32, ease: [0.3, 0.7, 0.2, 1] } as const;
const BAND_FADE = { duration: 0.26, ease: 'easeOut' } as const;

/**
 * Small round band in the Catan colour of the person at turn below the board or the cards
 * (design I2-C, P9): piece, "Name · Stück" and the order as mini coins. Once the placement is
 * finished it shows "Platzierung fertig" in the colours of the app.
 */
export function TurnBand({ className, ...face }: TurnBandProps): React.JSX.Element {
  const isReduced = useReducedMotion() === true;
  // Changes its content in place, without moving (PO 10.11.2026); the old content fades out.
  const faceKey = [face.color, face.currentId, face.name, face.what, face.note].join('|');
  const [shown, setShown] = useState({ key: faceKey, face });
  const [fading, setFading] = useState<{ key: string; face: BandFace } | null>(null);
  if (shown.key !== faceKey) {
    setShown({ key: faceKey, face });
    setFading(isReduced ? null : shown);
  }

  const orderRef = useRef<HTMLSpanElement>(null);
  const ringFrom = useRef(face.currentId);
  const { currentId } = face;
  useLayoutEffect(() => {
    const from = ringFrom.current;
    ringFrom.current = currentId;
    const box = orderRef.current;
    if (from === null || currentId === null || from === currentId || isReduced || box === null) {
      return;
    }
    const was = box.querySelector<HTMLElement>(`[data-band-coin="${from}"]`);
    const now = box.querySelector<HTMLElement>(`[data-band-coin="${currentId}"]`);
    const ring = now?.querySelector<HTMLElement>('[data-band-ring]');
    if (was === null || now === null || ring === null || ring === undefined) {
      return;
    }
    animate(ring, { x: [was.offsetLeft - now.offsetLeft, 0] }, RING_GLIDE);
  }, [currentId, isReduced]);

  return (
    <div
      data-solid=""
      className={cx(styles.turnBand, lookOf(face), className)}
      style={styleOf(face)}
    >
      <BandContent face={face} orderRef={orderRef} isRinged />
      {fading !== null && (
        <m.div
          key={fading.key}
          aria-hidden="true"
          className={cx(styles.turnBand, styles.bandFade, lookOf(fading.face))}
          style={styleOf(fading.face)}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={BAND_FADE}
          onAnimationComplete={() => {
            setFading(null);
          }}
        >
          <BandContent face={fading.face} isRinged={false} />
        </m.div>
      )}
    </div>
  );
}

function lookOf(face: BandFace): string | undefined {
  return face.color === null ? styles.doneBand : undefined;
}

function styleOf(face: BandFace): { color?: string; background?: string } {
  const { color } = face;
  return color === null
    ? {}
    : {
        color: inkOn(color),
        background: `linear-gradient(160deg, var(--color-catan-${color}-band-light), var(--color-catan-${color}-band-dark))`,
      };
}

type BandContentProps = {
  readonly face: BandFace;
  readonly orderRef?: React.Ref<HTMLSpanElement>;
  /** The coin at turn carries the ring; the band fading out shows none. */
  readonly isRinged: boolean;
};

function BandContent({ face, orderRef, isRinged }: BandContentProps): React.JSX.Element {
  return (
    <>
      <span className={styles.tbPiece}>{face.icon}</span>
      <span className={styles.tbLine}>
        {face.note !== undefined && <small className={styles.tbNext}>{face.note}</small>}
        <strong className={styles.tbName}>{face.name}</strong>
        {face.what}
      </span>
      <span ref={orderRef} className={styles.tbOrder}>
        {face.order.map((person) => {
          const isNow = person.personId === face.currentId;
          return (
            <span
              key={person.personId}
              data-band-coin={isRinged ? person.personId : undefined}
              className={cx(styles.mCoin, isNow && styles.mCoinNow)}
              style={{ background: `var(--color-catan-${person.color})` }}
              aria-hidden="true"
            >
              {person.name.slice(0, 1)}
              {isNow && isRinged && <span data-band-ring="" className={styles.mRing} />}
            </span>
          );
        })}
      </span>
    </>
  );
}
