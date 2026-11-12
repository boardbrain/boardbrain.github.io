import type { BoardPoint } from '@/games/catan';
import { roadLine } from './pieces';

/**
 * A piece on the board as a target for a tap (US-AB-03 AK-8, design I2-H): a building at its
 * vertex, a road along its edge from the building outwards; points in SVG units of the board.
 */
export type TapTarget =
  | { readonly key: string; readonly kind: 'building'; readonly at: BoardPoint }
  | {
      readonly key: string;
      readonly kind: 'road';
      readonly from: BoardPoint;
      readonly to: BoardPoint;
    };

// Design I2-H: around a vertex the building wins up to 4.5 units, a little more than the
// building itself (a settlement is 3 units wide to each side, a city 3.9).
const CORNER_ZONE = 4.5;
// Further out a building counts from its outline, not from its vertex, so a road beside it is not
// preferred only because its middle lies closer.
const BUILDING_REACH = 1.5;
// The tap area of a road lies around the middle of its drawn part (34 % to 86 % of the edge).
const ROAD_MIDDLE = 0.6;

/**
 * The point a tap area is centred on: the vertex of a building, the middle of the drawn part of
 * a road.
 */
export function tapAnchor(target: TapTarget): BoardPoint {
  if (target.kind === 'building') {
    return target.at;
  }
  return {
    x: target.from.x + (target.to.x - target.from.x) * ROAD_MIDDLE,
    y: target.from.y + (target.to.y - target.from.y) * ROAD_MIDDLE,
  };
}

function distance(a: BoardPoint, b: BoardPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Distance from a point to the drawn part of a road.
function distanceToRoad(point: BoardPoint, from: BoardPoint, to: BoardPoint): number {
  const { start, end } = roadLine(from, to);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const share = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)),
  );
  return distance(point, { x: start.x + share * dx, y: start.y + share * dy });
}

/**
 * The piece a tap at `point` means (US-AB-03 AK-8, design I2-H), among the pieces whose square
 * tap area (half its side `halfArea`, in SVG units) contains the point: near a vertex the
 * building, further out the nearest piece by its drawn shape. `null` beside every piece.
 */
export function pieceAt(
  point: BoardPoint,
  targets: readonly TapTarget[],
  halfArea: number,
): TapTarget | null {
  const near = targets.filter((target) => {
    const anchor = tapAnchor(target);
    return Math.abs(point.x - anchor.x) <= halfArea && Math.abs(point.y - anchor.y) <= halfArea;
  });
  const corner = near.find(
    (target) => target.kind === 'building' && distance(point, target.at) <= CORNER_ZONE,
  );
  if (corner !== undefined) {
    return corner;
  }
  let best: { target: TapTarget; score: number } | null = null;
  for (const target of near) {
    const score =
      target.kind === 'building'
        ? distance(point, target.at) - BUILDING_REACH
        : distanceToRoad(point, target.from, target.to);
    if (best === null || score < best.score) {
      best = { target, score };
    }
  }
  return best?.target ?? null;
}
