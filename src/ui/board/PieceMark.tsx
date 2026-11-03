import type { CatanColorKey } from '@/core/model';
import { buildingPath, roadLine, type PieceKind } from './pieces';
import styles from './Pieces.module.css';

/**
 * Colour of a piece: a Catan colour or the sand of the board for neutral symbols, e.g. on the
 * cards of the editions.
 */
export type PieceColor = CatanColorKey | 'sand';

type PieceMarkProps = {
  readonly kind: PieceKind;
  readonly color: PieceColor;
  /** Height in pixels. */
  readonly size: number;
  /**
   * `square` draws the piece in a square box (in a band or on a card); `fit` cuts the box to
   * the outline, so settlement, city and road are equally high side by side (design I2-C, W2).
   */
  readonly box?: 'square' | 'fit';
  readonly className?: string | undefined;
};

// Boxes of the reference: the building stands at (5, 5.4) of a 10 × 10 box.
const ANCHOR = { x: 5, y: 5.4 };
const FIT_BOX = { settlement: [1.55, 1.95, 6.9, 6.3], city: [0.6, 1.3, 8.8, 7.1] } as const;
const SQUARE_ROAD = { from: { x: 2.6, y: 7.6 }, to: { x: 7.4, y: 2.8 } };
// roadLine draws only 34 % to 86 % of its span, hence the longer span for the fitted box.
const FIT_ROAD = roadLine({ x: -2.62, y: 12.62 }, { x: 10.08, y: -0.08 });

/**
 * Fill of a piece in its colour.
 */
export function pieceFill(color: PieceColor): string {
  return color === 'sand' ? 'var(--color-board-sand)' : `var(--color-catan-${color})`;
}

/**
 * A piece as a small symbol in its colour with the dark outline (US-PL-04, G1, R1).
 * Decorative: the text beside it names the piece.
 */
export function PieceMark({
  kind,
  color,
  size,
  box = 'square',
  className,
}: PieceMarkProps): React.JSX.Element {
  if (kind === 'road') {
    const line = box === 'fit' ? FIT_ROAD : { start: SQUARE_ROAD.from, end: SQUARE_ROAD.to };
    return (
      <svg viewBox="0 0 10 10" width={size} height={size} className={className} aria-hidden="true">
        <RoadShape start={line.start} end={line.end} color={color} />
      </svg>
    );
  }
  const [x, y, width, height] = box === 'fit' ? FIT_BOX[kind] : [0, 0, 10, 10];
  return (
    <svg
      viewBox={`${String(x)} ${String(y)} ${String(width)} ${String(height)}`}
      width={Math.round((size * width) / height)}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path d={buildingPath(kind, ANCHOR)} className={styles.building} fill={pieceFill(color)} />
    </svg>
  );
}

type RoadShapeProps = {
  readonly start: { readonly x: number; readonly y: number };
  readonly end: { readonly x: number; readonly y: number };
  readonly color: PieceColor;
};

/**
 * A road as two lines: the dark outline and the colour on top (R1).
 */
export function RoadShape({ start, end, color }: RoadShapeProps): React.JSX.Element {
  return (
    <>
      <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className={styles.roadOutline} />
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        className={styles.road}
        stroke={pieceFill(color)}
      />
    </>
  );
}
