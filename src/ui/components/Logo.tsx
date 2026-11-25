import { useId } from 'react';
import { BrainMark } from './BrainMark';
import styles from './Logo.module.css';

// Design K-20 L2: the two fanned cards of the app icon (scripts/generate-icons.mjs, icon D8)
// without its tile. Coordinates in the 48 × 48 box of the icon; the view box cuts it to the cards.
const VIEW_BOX = { x: 4, y: 0, width: 40, height: 46 };
const BACK = { x: 9.5, y: 3.5, width: 28, height: 39, turn: -8 };
const FRONT = { x: 11, y: 4, width: 28, height: 40, turn: 4 };
const PIVOT = { x: 24, y: 42 };
const CORNER_RADIUS = 0.13;
const PIP_RADIUS = 0.07;
const BRAIN = 24;

function hexagon(cx: number, cy: number, radius: number): string {
  return Array.from({ length: 6 }, (_, index) => {
    const radians = ((60 * index - 90) * Math.PI) / 180;
    return `${(cx + radius * Math.cos(radians)).toFixed(2)},${(cy + radius * Math.sin(radians)).toFixed(2)}`;
  }).join(' ');
}

// Hexagons in the top left and bottom right corner of the front card, as on the app icon.
const PIPS = [
  hexagon(FRONT.x + FRONT.width * 0.19, FRONT.y + FRONT.height * 0.13, FRONT.width * PIP_RADIUS),
  hexagon(FRONT.x + FRONT.width * 0.81, FRONT.y + FRONT.height * 0.87, FRONT.width * PIP_RADIUS),
];

function turn(degrees: number): string {
  return `rotate(${String(degrees)} ${String(PIVOT.x)} ${String(PIVOT.y)})`;
}

type LogoProps = {
  /** Height in px; the width follows from the cards. */
  readonly size: number;
};

/**
 * Logo of the app on the start view (design K-20 L2): two fanned cards like the app icon, the
 * front one with amber edge, two hexagons and the brain. Decorative; the app name stands next to
 * it as text.
 */
export function Logo({ size }: LogoProps): React.JSX.Element {
  const id = useId();
  const face = `${id}-face`;
  const shadow = `${id}-shadow`;
  return (
    <svg
      className={styles.logo}
      width={(size * VIEW_BOX.width) / VIEW_BOX.height}
      height={size}
      viewBox={`${String(VIEW_BOX.x)} ${String(VIEW_BOX.y)} ${String(VIEW_BOX.width)} ${String(VIEW_BOX.height)}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={face} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" className={styles.faceTop} />
          <stop offset="1" className={styles.faceBottom} />
        </linearGradient>
        <filter id={shadow} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" className={styles.shadow} />
        </filter>
      </defs>
      <rect
        className={styles.back}
        transform={turn(BACK.turn)}
        x={BACK.x}
        y={BACK.y}
        width={BACK.width}
        height={BACK.height}
        rx={BACK.width * CORNER_RADIUS}
        filter={`url(#${shadow})`}
      />
      <g transform={turn(FRONT.turn)}>
        <rect
          className={styles.front}
          x={FRONT.x}
          y={FRONT.y}
          width={FRONT.width}
          height={FRONT.height}
          rx={FRONT.width * CORNER_RADIUS}
          fill={`url(#${face})`}
          filter={`url(#${shadow})`}
        />
        {PIPS.map((points) => (
          <polygon key={points} className={styles.pip} points={points} />
        ))}
        <svg
          x={FRONT.x + (FRONT.width - BRAIN) / 2}
          y={FRONT.y + (FRONT.height - BRAIN) / 2}
          width={BRAIN}
          height={BRAIN}
        >
          <BrainMark size={BRAIN} />
        </svg>
      </g>
    </svg>
  );
}
