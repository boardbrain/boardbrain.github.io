import { describe, expect, it } from 'vitest';
import { pieceAt, tapAnchor, type TapTarget } from './pieceHit';

// A settlement at (0, 0) with its road to (10, 0), and the road of another settlement at (0, 20)
// towards (0, 10). A road is drawn from 34 % to 86 % of its edge.
const building: TapTarget = { key: 'building-0', kind: 'building', at: { x: 0, y: 0 } };
const road: TapTarget = { key: 'road-0', kind: 'road', from: { x: 0, y: 0 }, to: { x: 10, y: 0 } };
const otherRoad: TapTarget = {
  key: 'road-1',
  kind: 'road',
  from: { x: 0, y: 20 },
  to: { x: 0, y: 10 },
};
const targets = [road, otherRoad, building];
// 22 px of a 44 px tap area at about 3.4 px per unit on a phone.
const HALF = 6.5;

describe('US-AB-03 AK-8 tapping a piece on the board (design I2-H)', () => {
  it('a building is tapped at its vertex, a road at the middle of its drawn part', () => {
    expect(tapAnchor(building)).toEqual({ x: 0, y: 0 });
    expect(tapAnchor(road)).toEqual({ x: 6, y: 0 });
  });

  it('near a vertex the building wins, also on its road', () => {
    expect(pieceAt({ x: 0, y: 0 }, targets, HALF)?.key).toBe('building-0');
    expect(pieceAt({ x: 4, y: 0.5 }, targets, HALF)?.key).toBe('building-0');
    expect(pieceAt({ x: -3, y: -3 }, targets, HALF)?.key).toBe('building-0');
  });

  it('further out the road wins', () => {
    expect(pieceAt({ x: 5, y: 0 }, targets, HALF)?.key).toBe('road-0');
    expect(pieceAt({ x: 8, y: 2 }, targets, HALF)?.key).toBe('road-0');
  });

  it('between two roads the nearer one by its drawn part wins', () => {
    expect(pieceAt({ x: 1, y: 13 }, targets, HALF)?.key).toBe('road-1');
    expect(pieceAt({ x: 6, y: 3 }, targets, HALF)?.key).toBe('road-0');
  });

  it('beyond the building outline a nearer road wins over the building', () => {
    const lone: TapTarget = {
      key: 'road-2',
      kind: 'road',
      from: { x: 0, y: 0 },
      to: { x: 0, y: -10 },
    };
    expect(pieceAt({ x: 0, y: -6 }, [building, lone], HALF)?.key).toBe('road-2');
    expect(pieceAt({ x: -5, y: 0 }, [building, lone], HALF)?.key).toBe('building-0');
  });

  it('a tap outside every tap area means no piece', () => {
    expect(pieceAt({ x: 30, y: 30 }, targets, HALF)).toBeNull();
    expect(pieceAt({ x: 0, y: 0 }, [], HALF)).toBeNull();
  });
});
