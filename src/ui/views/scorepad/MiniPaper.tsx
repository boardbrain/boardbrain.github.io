import styles from './MiniPaper.module.css';

// Three rows of a game, as if written by hand (design I3-C2 SY1).
const ROWS = [
  [12, 25],
  [20, 39],
  [35, 41],
] as const;

/**
 * The small sheet of the score pad (design I3-C2 SY1): dark paper with lines, the red margin and
 * handwritten numbers, slightly turned. Decorative.
 */
export function MiniPaper(): React.JSX.Element {
  return (
    <span className={styles.paper} aria-hidden="true">
      {ROWS.map(([left, right]) => (
        <span key={left} className={styles.row}>
          <span>{left}</span>
          <span>{right}</span>
        </span>
      ))}
    </span>
  );
}
