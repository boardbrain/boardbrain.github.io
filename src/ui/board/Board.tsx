import { useId } from 'react';
import type { Board as BoardModel } from '@/core/board';
import { t } from '@/i18n/t';
import { layoutBoard } from './boardLayout';
import styles from './Board.module.css';

type BoardProps = {
  readonly board: BoardModel;
};

/**
 * The board as SVG (US-PL-01, Architecture 13.5, design I1-D): wooden tiles without content on
 * a hexagonal sea with shallow water and a sand coast. Own graphics, no original graphics of
 * the game (AK-2, NFA-GB-06); scales into any area without turning (AK-3).
 */
export function Board({ board }: BoardProps): React.JSX.Element {
  const id = useId();
  const wood = `${id}-wood`;
  const waves = `${id}-waves`;
  const tileShadow = `${id}-tile-shadow`;
  const seaShadow = `${id}-sea-shadow`;
  const layout = layoutBoard(board);

  return (
    <svg
      className={styles.board}
      viewBox={layout.viewBox}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={t('brett.beschreibung')}
    >
      <defs>
        <linearGradient id={wood} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className={styles.woodTop} />
          <stop offset="1" className={styles.woodBottom} />
        </linearGradient>
        <filter id={tileShadow} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="1.1" stdDeviation="0.9" className={styles.shadow} />
        </filter>
        <filter id={seaShadow} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" className={styles.shadow} />
        </filter>
        <pattern id={waves} width="8" height="5" patternUnits="userSpaceOnUse">
          <path d="M0 3q2 -2.4 4 0t4 0" className={styles.wave} />
        </pattern>
      </defs>
      <polygon points={layout.sea} className={styles.sea} filter={`url(#${seaShadow})`} />
      <polygon points={layout.sea} fill={`url(#${waves})`} />
      <polygon points={layout.sea} className={styles.seaRim} />
      {layout.coastlines.map((path) => (
        <path key={`shallow-${path}`} d={path} className={styles.shallow} />
      ))}
      {layout.coastlines.map((path) => (
        <path key={`sand-${path}`} d={path} className={styles.sand} />
      ))}
      <g filter={`url(#${tileShadow})`}>
        {layout.tiles.map((tile) => (
          <polygon
            key={tile.key}
            points={tile.points}
            fill={`url(#${wood})`}
            className={styles.tile}
            data-testid="board-hex"
          />
        ))}
      </g>
      {layout.highlights.map((highlight) => (
        <polyline key={highlight.key} points={highlight.points} className={styles.highlight} />
      ))}
    </svg>
  );
}
