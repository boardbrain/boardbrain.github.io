import { hexCorners, hexKey, vertexPoint, type Board, type BoardPoint } from '@/core/board';

// Measures in SVG units from design I1-D (docs/design/i1d-board-final-preview.html).
const SVG_PER_BOARD_UNIT = 10;
const TILE_SCALE = 0.92;
const HIGHLIGHT_SCALE = 0.87;
// The sea reaches this far beyond the outermost coast vertex.
const SEA_MARGIN = 14.4;
// Room around the sea for its shadow.
const SHADOW_ROOM = { x: 2, y: 2.8 };
const CORNER_COUNT = 6;
// Corners of the upper edge of a tile, from the lower left to the lower right: 4, 5, 0, 1.
const UPPER_EDGE = [4, 5, 0, 1];

/**
 * A tile with its SVG points, keyed by its coordinate.
 */
export type TileShape = { readonly key: string; readonly points: string };

/**
 * Everything the board SVG draws, computed from the board model (Architecture 5.2, 13.5).
 */
export type BoardLayout = {
  readonly viewBox: string;
  /** Flat-topped hexagon of the sea around the land. */
  readonly sea: string;
  /** One closed path per coastline, for shallow water and sand. */
  readonly coastlines: readonly string[];
  readonly tiles: readonly TileShape[];
  /** Light upper edge of each tile. */
  readonly highlights: readonly TileShape[];
};

function toSvg(point: BoardPoint): BoardPoint {
  return { x: point.x * SVG_PER_BOARD_UNIT, y: point.y * SVG_PER_BOARD_UNIT };
}

function formatPoint({ x, y }: BoardPoint): string {
  return `${x.toFixed(2)},${y.toFixed(2)}`;
}

function pointList(points: readonly BoardPoint[]): string {
  return points.map(formatPoint).join(' ');
}

/**
 * Lays out the board as SVG shapes with a fixed viewBox, so it scales without turning
 * (US-PL-01 AK-3, Architecture 13.5).
 */
export function layoutBoard(board: Board): BoardLayout {
  const coastPoints = board.coastlines.map((coast) =>
    coast.flatMap((id) => {
      const vertex = board.vertices.get(id);
      return vertex === undefined ? [] : [toSvg(vertexPoint(vertex))];
    }),
  );
  const seaRadius =
    Math.max(...coastPoints.flat().map(({ x, y }) => Math.hypot(x, y))) + SEA_MARGIN;
  const sea = Array.from({ length: CORNER_COUNT }, (_, index) => {
    const radians = (index * Math.PI) / 3;
    return { x: seaRadius * Math.cos(radians), y: seaRadius * Math.sin(radians) };
  });
  const halfWidth = Math.round(seaRadius + SHADOW_ROOM.x);
  const halfHeight = Math.round((seaRadius * Math.sqrt(3)) / 2 + SHADOW_ROOM.y);

  return {
    viewBox: `${String(-halfWidth)} ${String(-halfHeight)} ${String(2 * halfWidth)} ${String(2 * halfHeight)}`,
    sea: pointList(sea),
    coastlines: coastPoints.map((points) => `M${points.map(formatPoint).join('L')}Z`),
    tiles: board.hexes.map((hex) => ({
      key: hexKey(hex.coord),
      points: pointList(hexCorners(hex.coord, TILE_SCALE).map(toSvg)),
    })),
    highlights: board.hexes.map((hex) => {
      const corners = hexCorners(hex.coord, HIGHLIGHT_SCALE).map(toSvg);
      return {
        key: hexKey(hex.coord),
        points: pointList(UPPER_EDGE.flatMap((index) => corners[index] ?? [])),
      };
    }),
  };
}
