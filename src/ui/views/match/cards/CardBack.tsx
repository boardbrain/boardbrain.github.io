import { useId } from 'react';
import { Logo } from '@/ui/components/Logo';
import styles from './CardBack.module.css';

const CORNERS = [
  [8, 8],
  [92, 8],
  [8, 140],
  [92, 140],
] as const;

/**
 * The back of a card R1 (design I2-D): dark wood with a lozenge pattern, a golden double frame
 * with lozenges in the corners, a medallion with the logo. The same for person and resource
 * cards; it fills its card. Decorative.
 */
export function CardBack(): React.JSX.Element {
  const id = useId();
  const wood = `${id}-wood`;
  const medal = `${id}-medal`;
  const pattern = `${id}-pattern`;
  return (
    <svg
      className={styles.back}
      viewBox="0 0 100 148"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={wood} x1="0" y1="0" x2=".35" y2="1">
          <stop offset="0" className={styles.woodTop} />
          <stop offset="1" className={styles.woodBottom} />
        </linearGradient>
        <radialGradient id={medal} cx="50%" cy="38%" r="65%">
          <stop offset="0" className={styles.medalLight} />
          <stop offset="1" className={styles.medalDark} />
        </radialGradient>
        <pattern
          id={pattern}
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45 50 74)"
        >
          <path d="M0 0H7M0 0V7" className={styles.lozenge} />
        </pattern>
      </defs>
      <rect width="100" height="148" fill={`url(#${wood})`} />
      <rect x="8" y="8" width="84" height="132" rx="4" fill={`url(#${pattern})`} />
      <rect x="4.5" y="4.5" width="91" height="139" rx="6" className={styles.frame} />
      <rect x="8" y="8" width="84" height="132" rx="4" className={styles.innerFrame} />
      {CORNERS.map(([x, y]) => (
        <path
          key={`${String(x)}-${String(y)}`}
          d={`M${String(x)} ${String(y - 2.6)}l2.6 2.6-2.6 2.6-2.6-2.6z`}
          className={styles.gold}
        />
      ))}
      <circle cx="50" cy="74" r="27.5" className={styles.ring} />
      <circle cx="50" cy="74" r="23" fill={`url(#${medal})`} className={styles.medal} />
      <svg x="33" y="57" width="34" height="34" viewBox="0 0 34 34" className={styles.logo}>
        <Logo size={34} />
      </svg>
    </svg>
  );
}
