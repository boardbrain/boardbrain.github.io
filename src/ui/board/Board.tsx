import { m } from 'motion/react';
import { useId } from 'react';
import type { CatanBuildingType, Board as BoardModel, EdgeId, VertexId } from '@/games/catan';
import type { CatanColorKey } from '@/core/model';
import { t } from '@/i18n/t';
import { edgeInSvg, layoutBoard, vertexInSvg } from './boardLayout';
import { RoadShape } from './PieceMark';
import { buildingPath, roadLine } from './pieces';
import styles from './Board.module.css';
import pieceStyles from './Pieces.module.css';

/**
 * A building on the board in the Catan colour of its person for this match (US-PL-04 AK-1).
 */
export type BoardBuilding = {
  readonly key: string;
  readonly vertex: VertexId;
  readonly type: CatanBuildingType;
  readonly color: CatanColorKey;
};

/**
 * A road on the board, drawn from its building outwards (US-PL-03, R1).
 */
export type BoardRoad = {
  readonly key: string;
  readonly edge: EdgeId;
  readonly from: VertexId;
  readonly color: CatanColorKey;
};

type BoardProps = {
  readonly board: BoardModel;
  readonly buildings?: readonly BoardBuilding[];
  readonly roads?: readonly BoardRoad[];
  /** Name of the board for screen readers; by default the empty board. */
  readonly label?: string;
  /** Key of the piece just drawn; it fades in (design I2-C), without a mark of its own. */
  readonly newestKey?: string | undefined;
};

// I2-C: the new piece fades in; D-2 designs the highlighting on its own. Every piece keeps the
// target, so a fade cut short by the next piece still ends opaque (PO 09.11.2026: pieces stayed
// partly transparent when the next one came within the fade).
const FADE = { duration: 0.52, ease: 'easeOut' } as const;
const OPAQUE = { opacity: 1 } as const;

function fadeIn(isNewest: boolean): {
  initial: { opacity: number } | false;
  animate: typeof OPAQUE;
  transition: typeof FADE;
} {
  return { initial: isNewest ? { opacity: 0 } : false, animate: OPAQUE, transition: FADE };
}

/**
 * The board as SVG (US-PL-01, Architecture 13.5, design I1-D): wooden tiles without content on
 * a hexagonal sea with shallow water and a sand coast. Own graphics, no original graphics of
 * the game (AK-2, NFA-GB-06); scales into any area without turning (AK-3).
 */
export function Board({
  board,
  buildings = [],
  roads = [],
  label = t('brett.beschreibung'),
  newestKey,
}: BoardProps): React.JSX.Element {
  const id = useId();
  const wood = `${id}-wood`;
  const seaClip = `${id}-sea-clip`;
  const tileShadow = `${id}-tile-shadow`;
  const seaShadow = `${id}-sea-shadow`;
  const layout = layoutBoard(board);

  return (
    <svg
      className={styles.board}
      viewBox={layout.viewBox}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={label}
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
        <clipPath id={seaClip}>
          <polygon points={layout.sea} />
        </clipPath>
      </defs>
      <polygon points={layout.sea} className={styles.sea} filter={`url(#${seaShadow})`} />
      <g clipPath={`url(#${seaClip})`}>
        {layout.waves.map((path) => (
          <path key={path} d={path} className={styles.wave} />
        ))}
      </g>
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
      {/* Roads first, so buildings lie on top of them (design I2-C). */}
      {roads.map((road) => {
        const { from, to } = edgeInSvg(board, road.edge, road.from);
        const line = roadLine(from, to);
        return (
          <m.g key={road.key} data-testid="board-road" {...fadeIn(road.key === newestKey)}>
            <RoadShape start={line.start} end={line.end} color={road.color} />
          </m.g>
        );
      })}
      {buildings.map((building) => (
        <m.path
          key={building.key}
          {...fadeIn(building.key === newestKey)}
          d={buildingPath(building.type, vertexInSvg(board, building.vertex))}
          className={pieceStyles.building}
          fill={`var(--color-catan-${building.color})`}
          data-testid={`board-${building.type}`}
        />
      ))}
    </svg>
  );
}
