import { describe, expect, it } from 'vitest';
import { STANDARD_BOARD } from './board';
import { hexCenter, hexCorners, vertexPoint } from './geometry';
import { hexKey } from './hexCoord';

const SQRT3 = Math.sqrt(3);

describe('US-PL-01 board geometry (FA-PL-07, Architecture 13.5)', () => {
  it('places the centre hex at the origin and the rows 1.5 units apart', () => {
    expect(hexCenter({ q: 0, r: 0 })).toEqual({ x: 0, y: 0 });
    expect(hexCenter({ q: 0, r: 1 })).toEqual({ x: SQRT3 / 2, y: 1.5 });
    expect(hexCenter({ q: 1, r: 0 }).x).toBeCloseTo(SQRT3);
  });

  it('AK-1: hexes point up: the first corner is the top tip, the hex is higher than wide', () => {
    const corners = hexCorners({ q: 0, r: 0 });
    const xs = corners.map((corner) => corner.x);
    const ys = corners.map((corner) => corner.y);

    expect(corners[0]?.x).toBeCloseTo(0);
    expect(corners[0]?.y).toBeCloseTo(-1);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(2);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(SQRT3);
  });

  it('shrinks a hex around its centre with scale', () => {
    const [top] = hexCorners({ q: 1, r: 1 }, 0.5);
    const center = hexCenter({ q: 1, r: 1 });

    expect(top?.x).toBeCloseTo(center.x);
    expect(top?.y).toBeCloseTo(center.y - 0.5);
  });

  it('AK-1: the outline is straight at the top and bottom and pointed at the left and right', () => {
    const points = STANDARD_BOARD.hexes.flatMap((hex) => hexCorners(hex.coord));
    const top = Math.min(...points.map((point) => point.y));
    const left = Math.min(...points.map((point) => point.x));

    // The top row consists of three tips at the same height; on the far left a single hex.
    expect(points.filter((point) => Math.abs(point.y - top) < 1e-9)).toHaveLength(3);
    expect(
      STANDARD_BOARD.hexes.filter(
        (hex) => Math.abs(hexCenter(hex.coord).x - (left + SQRT3 / 2)) < 1e-9,
      ),
    ).toHaveLength(1);
  });

  it('places every vertex on a corner of each of its land hexes', () => {
    const landKeys = new Set(STANDARD_BOARD.hexes.map((hex) => hexKey(hex.coord)));
    for (const vertex of STANDARD_BOARD.vertices.values()) {
      const point = vertexPoint(vertex);
      for (const hex of vertex.hexes.filter((coord) => landKeys.has(hexKey(coord)))) {
        const distances = hexCorners(hex).map((corner) =>
          Math.hypot(corner.x - point.x, corner.y - point.y),
        );

        expect(Math.min(...distances)).toBeCloseTo(0);
      }
    }
  });
});
