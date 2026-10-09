import { useId } from 'react';
import styles from './Logo.module.css';

// Design D-3 "Eine Kontur": one brain outline, symmetric to x = 24 in a 48 × 48 box.
const OUTLINE =
  'M24 8.5C21 5 14 5.5 12 10 7 10 5 15 7 18 3 20 3 27 7 29 5 33 8 38 12 37 13 41 18 42.5 22 40.5 23 41 23.5 41 24 40.5 24.5 41 25 41 26 40.5 30 42.5 35 41 36 37 40 38 43 33 41 29 45 27 45 20 41 18 43 15 41 10 36 10 34 5.5 27 5 24 8.5Z';
const FOLDS = 'M36 10c-2 3-6 3-7 6M41 18c-4 0-6 3-5 6M41 29c-4-1-7 1-8 4M30.5 22c2 3 0 6-3 6';
const MIDDLE = 'M24 8.5V40.5';
const SQUARE = 5.4;
const COLUMNS = 5;
const ROWS = { from: -5, to: 5 };

// The squares start exactly at the middle line and run to the left; the rows are centred on
// y = 24, so the board meets the middle without a gap.
const SQUARES = Array.from({ length: COLUMNS }, (_, column) =>
  Array.from({ length: ROWS.to - ROWS.from }, (_, index) => ROWS.from + index)
    .filter((row) => (((column + row) % 2) + 2) % 2 === 0)
    .map((row) => ({
      x: Number((24 - SQUARE * (column + 1)).toFixed(2)),
      y: Number((24 + SQUARE * row).toFixed(2)),
    })),
).flat();

type LogoProps = {
  readonly size: number;
};

/**
 * Logo of the app: a brain whose left half is a checkerboard (design D-3). Decorative; the app
 * name stands next to it as text.
 */
export function Logo({ size }: LogoProps): React.JSX.Element {
  const id = useId();
  const outlineClip = `${id}-outline`;
  const leftClip = `${id}-left`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <clipPath id={outlineClip}>
        <path d={OUTLINE} />
      </clipPath>
      <clipPath id={leftClip}>
        <rect x="0" y="0" width="24" height="48" />
      </clipPath>
      <g clipPath={`url(#${outlineClip})`}>
        <g clipPath={`url(#${leftClip})`}>
          {SQUARES.map(({ x, y }) => (
            <rect
              key={`${String(x)}-${String(y)}`}
              className={styles.square}
              x={x}
              y={y}
              width={SQUARE}
              height={SQUARE}
            />
          ))}
        </g>
      </g>
      <path className={styles.folds} d={FOLDS} />
      <path className={styles.line} d={OUTLINE} />
      <path className={styles.line} d={MIDDLE} />
    </svg>
  );
}
