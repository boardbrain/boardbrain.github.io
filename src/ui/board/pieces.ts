import type { BoardPoint } from '@/games/catan';

// Design I2-C, G1 and R1 (docs/design/i2-match-final-preview.html), measures in SVG units of
// the board: the size of a settlement and a city, the part of an edge a road covers.
const SETTLEMENT_SIZE = 3;
const CITY_SIZE = 3.15;
const ROAD_FROM = 0.34;
const ROAD_TO = 0.86;

/**
 * Kind of a piece: the two buildings (US-PL-04 AK-2) and the road.
 */
export type PieceKind = 'settlement' | 'city' | 'road';

function format(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/**
 * Outline of a building around its vertex: a house for a settlement, a house with a tower for
 * a city, so they differ by shape (US-PL-04 AK-2, G1).
 */
export function buildingPath(kind: 'settlement' | 'city', { x, y }: BoardPoint): string {
  if (kind === 'settlement') {
    const s = SETTLEMENT_SIZE;
    return `M${format(x - s)} ${format(y + s * 0.8)}V${format(y - s * 0.15)}L${format(x)} ${format(y - s)}L${format(x + s)} ${format(y - s * 0.15)}V${format(y + s * 0.8)}Z`;
  }
  const s = CITY_SIZE;
  const left = x - s * 1.25;
  const right = x + s * 1.25;
  const bottom = y + s * 0.8;
  return `M${format(left)} ${format(bottom)}V${format(y - s * 0.55)}L${format(left + s * 0.6)} ${format(y - s * 1.15)}L${format(left + s * 1.2)} ${format(y - s * 0.55)}V${format(y - s * 0.05)}H${format(right)}V${format(bottom)}Z`;
}

/**
 * The part of an edge a road covers, from its building outwards (R1): from 34 % to 86 % of the
 * way, so it starts beside the building.
 */
export function roadLine(from: BoardPoint, to: BoardPoint): { start: BoardPoint; end: BoardPoint } {
  const at = (share: number): BoardPoint => ({
    x: from.x + (to.x - from.x) * share,
    y: from.y + (to.y - from.y) * share,
  });
  return { start: at(ROAD_FROM), end: at(ROAD_TO) };
}
