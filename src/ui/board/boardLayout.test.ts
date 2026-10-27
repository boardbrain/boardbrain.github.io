import { describe, expect, it } from 'vitest';
import { createBoard, STANDARD_BOARD } from '@/core/board';
import { layoutBoard } from './boardLayout';

type Point = { x: number; y: number };

function parsePoints(points: string): Point[] {
  return points.split(' ').map((pair) => {
    const [x = Number.NaN, y = Number.NaN] = pair.split(',').map(Number);
    return { x, y };
  });
}

function parseViewBox(viewBox: string): {
  minX: number;
  minY: number;
  width: number;
  height: number;
} {
  const [minX = 0, minY = 0, width = 0, height = 0] = viewBox.split(' ').map(Number);
  return { minX, minY, width, height };
}

describe('US-PL-01 board layout (Architecture 13.5, design I1-D)', () => {
  const layout = layoutBoard(STANDARD_BOARD);

  it('AK-3: uses the fixed viewBox of the design reference', () => {
    expect(layout.viewBox).toBe('-60 -53 120 106');
  });

  it('AK-1: draws 19 tiles with six corners each, the first corner is the top tip', () => {
    expect(layout.tiles).toHaveLength(19);
    for (const tile of layout.tiles) {
      const points = parsePoints(tile.points);
      const [top] = points;
      const ys = points.map((point) => point.y);

      expect(points).toHaveLength(6);
      expect(top?.y).toBe(Math.min(...ys));
    }
  });

  it('AK-1: tiles keep gaps: their corners lie 9.2 units from the tile centre', () => {
    const [first] = layout.tiles;
    const points = parsePoints(first?.points ?? '');
    const center = {
      x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
      y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
    };

    for (const point of points) {
      expect(Math.hypot(point.x - center.x, point.y - center.y)).toBeCloseTo(9.2, 1);
    }
  });

  it('AK-3: the whole board including the sea fits into the viewBox', () => {
    const box = parseViewBox(layout.viewBox);
    const all = [
      ...layout.tiles.flatMap((tile) => parsePoints(tile.points)),
      ...parsePoints(layout.sea),
    ];

    for (const point of all) {
      expect(point.x).toBeGreaterThanOrEqual(box.minX);
      expect(point.x).toBeLessThanOrEqual(box.minX + box.width);
      expect(point.y).toBeGreaterThanOrEqual(box.minY);
      expect(point.y).toBeLessThanOrEqual(box.minY + box.height);
    }
  });

  it('draws the sea as a flat-topped hexagon with radius 58', () => {
    const sea = parsePoints(layout.sea);

    expect(sea).toHaveLength(6);
    expect(sea[0]?.x).toBeCloseTo(58, 0);
    expect(sea[0]?.y).toBeCloseTo(0);
  });

  it('draws one closed coastline through the 30 coast vertices', () => {
    expect(layout.coastlines).toHaveLength(1);
    const [coast = ''] = layout.coastlines;

    expect(coast.startsWith('M')).toBe(true);
    expect(coast.endsWith('Z')).toBe(true);
    expect(coast.split('L')).toHaveLength(30);
  });

  it('draws the light upper edge of every tile with four points', () => {
    expect(layout.highlights).toHaveLength(19);
    expect(layout.highlights.every((edge) => parsePoints(edge.points).length === 4)).toBe(true);
  });

  it('NFA-EW-05: lays out other board shapes too', () => {
    const single = layoutBoard(createBoard([{ q: 0, r: 0 }]));

    expect(single.tiles).toHaveLength(1);
    expect(single.coastlines).toHaveLength(1);
  });
});
