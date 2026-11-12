import type { Vertex } from './board';
import type { HexCoord } from './hexCoord';

/**
 * Point in board units: the distance from a hex centre to its corners is 1, x grows to the
 * right and y downwards like in SVG (Architecture 13.5).
 */
export type BoardPoint = { readonly x: number; readonly y: number };

const SQRT3 = Math.sqrt(3);
const CORNER_COUNT = 6;
const DEGREES_PER_CORNER = 60;
const TOP_TIP_DEGREES = -90;

/**
 * Centre of a hex with its tip pointing up (FA-PL-07).
 */
export function hexCenter({ q, r }: HexCoord): BoardPoint {
  return { x: SQRT3 * (q + r / 2), y: 1.5 * r };
}

/**
 * The six corners of a hex clockwise from the top tip; `scale` shrinks the hex around its
 * centre, e.g. for gaps between the tiles.
 */
export function hexCorners(coord: HexCoord, scale = 1): BoardPoint[] {
  const center = hexCenter(coord);
  return Array.from({ length: CORNER_COUNT }, (_, index) => {
    const radians = ((DEGREES_PER_CORNER * index + TOP_TIP_DEGREES) * Math.PI) / 180;
    return { x: center.x + scale * Math.cos(radians), y: center.y + scale * Math.sin(radians) };
  });
}

/**
 * Position of a vertex: the centre of its three hexes, which is exactly their shared corner.
 */
export function vertexPoint(vertex: Vertex): BoardPoint {
  const centers = vertex.hexes.map(hexCenter);
  return {
    x: centers.reduce((sum, point) => sum + point.x, 0) / centers.length,
    y: centers.reduce((sum, point) => sum + point.y, 0) / centers.length,
  };
}
