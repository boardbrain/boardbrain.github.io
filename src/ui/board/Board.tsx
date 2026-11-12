import { useId, useRef, type ReactNode, type Ref } from 'react';
import type { CatanBuildingType, Board as BoardModel, EdgeId, VertexId } from '@/games/catan';
import type { CatanColorKey } from '@/core/model';
import { t } from '@/i18n/t';
import { PressableButton } from '@/ui/components/Pressable';
import { edgeInSvg, layoutBoard, vertexInSvg, type BoardLayout } from './boardLayout';
import { RoadShape } from './PieceMark';
import { pieceAt, tapAnchor, type TapTarget } from './pieceHit';
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
  /** Name of its tap area, e.g. "Siedlung von Anna wiederholen" (US-AB-03 AK-8). */
  readonly label?: string;
};

/**
 * A road on the board, drawn from its building outwards (US-PL-03, R1).
 */
export type BoardRoad = {
  readonly key: string;
  readonly edge: EdgeId;
  readonly from: VertexId;
  readonly color: CatanColorKey;
  /** Name of its tap area, e.g. "Straße von Anna wiederholen" (US-AB-03 AK-8). */
  readonly label?: string;
};

/**
 * The pieces marked while repeating one is asked (US-AB-03 AK-8, design I2-H, M1): the piece
 * itself and the pieces discarded with it.
 */
export type PieceMarking = {
  readonly main: string;
  readonly others: readonly string[];
};

type BoardProps = {
  readonly board: BoardModel;
  readonly buildings?: readonly BoardBuilding[];
  readonly roads?: readonly BoardRoad[];
  /** Name of the board for screen readers; by default the empty board. */
  readonly label?: string;
  /**
   * Drawn over the pieces, e.g. the highlighting before a piece is fixed (design D-2); in the
   * board's SVG units.
   */
  readonly overlay?: ReactNode;
  /** Keys of pieces drawn over `overlay`, e.g. the building of a road while it is highlighted. */
  readonly lifted?: readonly string[] | undefined;
  /** Drawn over everything, e.g. the ring when a piece is set (design D-2, F4). */
  readonly top?: ReactNode;
  /** Makes every piece with a label a button (US-AB-03 AK-8); it gets the key of the piece. */
  readonly onPieceTap?: ((key: string) => void) | undefined;
  readonly marked?: PieceMarking | null | undefined;
  /** The area the board is drawn in, e.g. to lay the marked pieces over a dialog's backdrop. */
  readonly ref?: Ref<HTMLDivElement> | undefined;
};

// Design I2-H: a tap area is 44 px square, centred on its piece.
const TAP_AREA = 44;
// Design I2-H, M1: the ring around a marked building, in SVG units.
const MARK_RADIUS = { main: 5.8, other: 5.2 } as const;
// The dashed ring has 12 dashes of equal length (4 parts dash, 3 parts gap), so it has no seam
// where the circle starts (PO 10.11.2026).
const MARK_DASHES = 12;
const MARK_PERIOD = (2 * Math.PI * MARK_RADIUS.other) / MARK_DASHES;
const MARK_DASH_ARRAY = `${(MARK_PERIOD * (4 / 7)).toFixed(3)} ${(MARK_PERIOD * (3 / 7)).toFixed(3)}`;

type PlacedRoad = BoardRoad & {
  readonly start: { x: number; y: number };
  readonly end: { x: number; y: number };
};

function placeRoads(board: BoardModel, roads: readonly BoardRoad[]): PlacedRoad[] {
  return roads.map((road) => {
    const { from, to } = edgeInSvg(board, road.edge, road.from);
    return { ...road, start: from, end: to };
  });
}

/**
 * The board as SVG (US-PL-01, Architecture 13.5, design I1-D): wooden tiles without content on
 * a hexagonal sea with shallow water and a sand coast. Own graphics, no original graphics of
 * the game (AK-2, NFA-GB-06); scales into any area without turning (AK-3). With `onPieceTap`
 * every piece is an invisible button (US-AB-03 AK-8, design I2-H); nothing is added to the
 * picture.
 */
export function Board({
  board,
  buildings = [],
  roads = [],
  label = t('brett.beschreibung'),
  overlay,
  lifted = [],
  top,
  onPieceTap,
  marked,
  ref,
}: BoardProps): React.JSX.Element {
  const id = useId();
  const wood = `${id}-wood`;
  const seaClip = `${id}-sea-clip`;
  const tileShadow = `${id}-tile-shadow`;
  const seaShadow = `${id}-sea-shadow`;
  const layout = layoutBoard(board);
  const placed = placeRoads(board, roads);
  const { width, height } = layout.bounds;

  return (
    <div className={styles.frame}>
      <div
        ref={ref}
        className={styles.fit}
        // As large as fits, in the shape of the board: the tap areas lie exactly on the pieces.
        style={{
          aspectRatio: `${String(width)} / ${String(height)}`,
          width: `min(100cqw, ${String(width / height)} * 100cqh)`,
        }}
      >
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
          <Pieces
            board={board}
            buildings={buildings.filter((building) => !lifted.includes(building.key))}
            roads={placed.filter((road) => !lifted.includes(road.key))}
            marked={marked}
          />
          {overlay}
          {lifted.length > 0 && (
            <Pieces
              board={board}
              buildings={buildings.filter((building) => lifted.includes(building.key))}
              roads={placed.filter((road) => lifted.includes(road.key))}
            />
          )}
          {top}
        </svg>
        {onPieceTap !== undefined && (
          <TapLayer
            board={board}
            layout={layout}
            buildings={buildings}
            roads={placed}
            onPieceTap={onPieceTap}
          />
        )}
      </div>
    </div>
  );
}

type PiecesProps = {
  readonly board: BoardModel;
  readonly buildings: readonly BoardBuilding[];
  readonly roads: readonly PlacedRoad[];
  readonly marked?: PieceMarking | null | undefined;
};

// The marks below the pieces (design I2-H, M1), then the roads, then the buildings on top of them
// (design I2-C).
function Pieces({ board, buildings, roads, marked }: PiecesProps): React.JSX.Element {
  const isMain = (key: string): boolean => marked?.main === key;
  const isMarked = (key: string): boolean => isMain(key) || (marked?.others.includes(key) ?? false);
  return (
    <>
      {roads
        .filter((road) => isMarked(road.key))
        .map((road) => {
          // The mark reaches a little beyond the road: 30 % to 90 % of its edge.
          const at = (share: number): { x: number; y: number } => ({
            x: road.start.x + (road.end.x - road.start.x) * share,
            y: road.start.y + (road.end.y - road.start.y) * share,
          });
          const a = at(0.3);
          const b = at(0.9);
          return (
            <line
              key={`mark-${road.key}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className={isMain(road.key) ? pieceStyles.markRoad : pieceStyles.markRoadOther}
              data-testid={isMain(road.key) ? 'piece-mark' : 'piece-mark-other'}
            />
          );
        })}
      {buildings
        .filter((building) => isMarked(building.key))
        .map((building) => {
          const at = vertexInSvg(board, building.vertex);
          return (
            <circle
              key={`mark-${building.key}`}
              cx={at.x}
              cy={at.y}
              r={isMain(building.key) ? MARK_RADIUS.main : MARK_RADIUS.other}
              className={isMain(building.key) ? pieceStyles.mark : pieceStyles.markOther}
              strokeDasharray={isMain(building.key) ? undefined : MARK_DASH_ARRAY}
              data-testid={isMain(building.key) ? 'piece-mark' : 'piece-mark-other'}
            />
          );
        })}
      {roads.map((road) => {
        const line = roadLine(road.start, road.end);
        return (
          <g key={road.key} data-testid="board-road" data-piece={road.key}>
            <RoadShape start={line.start} end={line.end} color={road.color} />
          </g>
        );
      })}
      {buildings.map((building) => (
        <path
          key={building.key}
          d={buildingPath(building.type, vertexInSvg(board, building.vertex))}
          className={pieceStyles.building}
          fill={`var(--color-catan-${building.color})`}
          data-testid={`board-${building.type}`}
          data-piece={building.key}
        />
      ))}
    </>
  );
}

type TapLayerProps = {
  readonly board: BoardModel;
  readonly layout: BoardLayout;
  readonly buildings: readonly BoardBuilding[];
  readonly roads: readonly PlacedRoad[];
  readonly onPieceTap: (key: string) => void;
};

// Invisible buttons of 44 px over the pieces (design I2-H). They overlap on a phone; which piece
// a finger means follows from where it lands (pieceAt), a keyboard uses the button's own piece.
function TapLayer({
  board,
  layout,
  buildings,
  roads,
  onPieceTap,
}: TapLayerProps): React.JSX.Element {
  const layerRef = useRef<HTMLDivElement>(null);
  const { bounds } = layout;
  const targets: (TapTarget & { readonly label: string })[] = [
    ...roads.flatMap((road) =>
      road.label === undefined
        ? []
        : [
            {
              key: road.key,
              kind: 'road' as const,
              from: road.start,
              to: road.end,
              label: road.label,
            },
          ],
    ),
    ...buildings.flatMap((building) =>
      building.label === undefined
        ? []
        : [
            {
              key: building.key,
              kind: 'building' as const,
              at: vertexInSvg(board, building.vertex),
              label: building.label,
            },
          ],
    ),
  ];

  return (
    <div ref={layerRef} className={styles.tapLayer}>
      {targets.map((target) => {
        const anchor = tapAnchor(target);
        return (
          <PressableButton
            key={target.key}
            type="button"
            className={styles.tap}
            aria-label={target.label}
            style={{
              left: `${String(((anchor.x - bounds.x) / bounds.width) * 100)}%`,
              top: `${String(((anchor.y - bounds.y) / bounds.height) * 100)}%`,
            }}
            onClick={(event) => {
              const area = layerRef.current?.getBoundingClientRect();
              // A click without a pointer (keyboard, screen reader) has detail 0.
              if (event.detail === 0 || area === undefined || area.width === 0) {
                onPieceTap(target.key);
                return;
              }
              const scale = area.width / bounds.width;
              const point = {
                x: bounds.x + (event.clientX - area.left) / scale,
                y: bounds.y + (event.clientY - area.top) / scale,
              };
              onPieceTap(pieceAt(point, targets, TAP_AREA / 2 / scale)?.key ?? target.key);
            }}
          />
        );
      })}
    </div>
  );
}

type BoardSpotlightProps = {
  readonly board: BoardModel;
  readonly buildings: readonly BoardBuilding[];
  readonly roads: readonly BoardRoad[];
  readonly marked: PieceMarking;
};

/**
 * Only the marked pieces with their marks, in the board's coordinates (design I2-H, R7): laid
 * over the dark behind a question, exactly where the board shows them, so they stay bright.
 */
export function BoardSpotlight({
  board,
  buildings,
  roads,
  marked,
}: BoardSpotlightProps): React.JSX.Element {
  const layout = layoutBoard(board);
  const isMarked = (key: string): boolean => marked.main === key || marked.others.includes(key);
  return (
    <svg
      className={styles.board}
      viewBox={layout.viewBox}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      data-testid="board-spotlight"
    >
      <Pieces
        board={board}
        buildings={buildings.filter((building) => isMarked(building.key))}
        roads={placeRoads(board, roads).filter((road) => isMarked(road.key))}
        marked={marked}
      />
    </svg>
  );
}
