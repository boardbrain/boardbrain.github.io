import { describe, expect, it } from 'vitest';
import { SeededRandomSource } from './seededRandomSource';

const draw = (rng: SeededRandomSource, count: number): number[] =>
  Array.from({ length: count }, () => rng.nextUint32());

describe('NFA-ZF-03 SeededRandomSource', () => {
  it('follows xoshiro128** for a known state', () => {
    // Worked by hand from the reference implementation for the state [1, 2, 3, 4].
    const rng = SeededRandomSource.fromState([1, 2, 3, 4]);

    expect(draw(rng, 3)).toEqual([11_520, 0, 5_927_040]);
  });

  it('returns the same sequence for the same seed', () => {
    expect(draw(new SeededRandomSource(42), 10)).toEqual(draw(new SeededRandomSource(42), 10));
  });

  it('returns different sequences for different seeds', () => {
    expect(draw(new SeededRandomSource(1), 10)).not.toEqual(draw(new SeededRandomSource(2), 10));
  });

  it('returns unsigned 32-bit integers', () => {
    for (const value of draw(new SeededRandomSource(7), 1000)) {
      expect(Number.isInteger(value) && value >= 0 && value < 2 ** 32).toBe(true);
    }
  });

  it('rejects an all-zero state', () => {
    expect(() => SeededRandomSource.fromState([0, 0, 0, 0])).toThrow(RangeError);
  });
});
