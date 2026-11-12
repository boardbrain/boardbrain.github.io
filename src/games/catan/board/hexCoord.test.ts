import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { addHex, hexDistance, hexesWithin, hexKey } from './hexCoord';

const FC_SEED = 20261027;
const coord = fc.record({
  q: fc.integer({ min: -20, max: 20 }),
  r: fc.integer({ min: -20, max: 20 }),
});

describe('Architecture 5.2 axial hex coordinates', () => {
  it('builds a key from q and r', () => {
    expect(hexKey({ q: 1, r: -2 })).toBe('1,-2');
    expect(hexKey({ q: -0, r: 0 })).toBe('0,0');
  });

  it('adds two coordinates', () => {
    expect(addHex({ q: 1, r: -2 }, { q: -1, r: 1 })).toEqual({ q: 0, r: -1 });
  });

  it('measures the distance in steps, symmetric and zero for the same hex (property)', () => {
    fc.assert(
      fc.property(coord, coord, (a, b) => {
        const distance = hexDistance(a, b);
        return (
          distance === hexDistance(b, a) &&
          distance >= 0 &&
          (distance === 0) === (hexKey(a) === hexKey(b))
        );
      }),
      { seed: FC_SEED },
    );
  });

  it('measures one step to every neighbour', () => {
    const neighbours = [
      { q: 1, r: 0 },
      { q: 1, r: -1 },
      { q: 0, r: -1 },
      { q: -1, r: 0 },
      { q: -1, r: 1 },
      { q: 0, r: 1 },
    ];

    expect(neighbours.map((n) => hexDistance({ q: 0, r: 0 }, n))).toEqual([1, 1, 1, 1, 1, 1]);
    expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: -1 })).toBe(2);
  });

  it('FA-PL-07: lists the hexes within a radius row by row, left to right', () => {
    expect(hexesWithin(0)).toEqual([{ q: 0, r: 0 }]);
    expect(hexesWithin(1)).toEqual([
      { q: 0, r: -1 },
      { q: 1, r: -1 },
      { q: -1, r: 0 },
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: -1, r: 1 },
      { q: 0, r: 1 },
    ]);
  });

  it('contains exactly the hexes within the radius (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 6 }), (radius) => {
        const hexes = hexesWithin(radius);
        return (
          hexes.length === 3 * radius * radius + 3 * radius + 1 &&
          new Set(hexes.map(hexKey)).size === hexes.length &&
          hexes.every((hex) => hexDistance(hex, { q: 0, r: 0 }) <= radius)
        );
      }),
      { seed: FC_SEED },
    );
  });
});
