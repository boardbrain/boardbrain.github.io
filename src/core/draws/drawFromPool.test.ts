import { ScriptedRandomSource } from '@tests/support/scriptedRandomSource';
import { SeededRandomSource } from '@tests/support/seededRandomSource';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { drawFromPool } from './drawFromPool';

const FC_SEED = 20261029;

// Game-independent building block; the starting resources of Catan and their acceptance
// criteria are tested in games/catan (ADR-028).
describe('Architecture 5.6 Draw from a pool', () => {
  it('draws exactly k items of the pool and leaves the pool unchanged (property)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.anything(), { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 1, max: 10 }),
        fc.constantFrom('with' as const, 'without' as const),
        fc.integer(),
        (pool, wanted, replacement, seed) => {
          const count = replacement === 'with' ? wanted : Math.min(wanted, pool.length);
          const copy = [...pool];
          const drawn = drawFromPool(pool, { count, replacement }, new SeededRandomSource(seed));
          return (
            drawn.length === count &&
            drawn.every((item) => pool.includes(item)) &&
            pool.every((item, index) => Object.is(item, copy[index]))
          );
        },
      ),
      { seed: FC_SEED },
    );
  });

  it('with replacement maps the words 0 … n − 1 onto all n items in every draw', () => {
    const pool = ['a', 'b', 'c'];
    const second = pool.map(
      (_, word) =>
        drawFromPool(
          pool,
          { count: 2, replacement: 'with' },
          new ScriptedRandomSource([0, word]),
        )[1],
    );

    expect(second).toEqual(pool);
  });

  it('with replacement allows duplicates and uses one word per draw', () => {
    const rng = new ScriptedRandomSource([1, 1, 1]);

    expect(drawFromPool(['a', 'b'], { count: 3, replacement: 'with' }, rng)).toEqual([
      'b',
      'b',
      'b',
    ]);
    expect(rng.consumed).toBe(3);
  });

  it('without replacement draws from the items not drawn yet, in their order in the pool', () => {
    // After c, the words 0, 1 and 2 select a, b and d.
    const second = [0, 1, 2].map(
      (word) =>
        drawFromPool(
          ['a', 'b', 'c', 'd'],
          { count: 2, replacement: 'without' },
          new ScriptedRandomSource([2, word]),
        )[1],
    );

    expect(second).toEqual(['a', 'b', 'd']);
  });

  it('without replacement removes only the drawn one of two equal items', () => {
    const drawn = drawFromPool(
      ['x', 'x', 'y'],
      { count: 3, replacement: 'without' },
      new ScriptedRandomSource([0, 0, 0]),
    );

    expect(drawn).toEqual(['x', 'x', 'y']);
  });

  it('throws a RangeError for a broken count, too few items or an empty pool', () => {
    const rng = new SeededRandomSource(1);

    expect(() => drawFromPool(['a'], { count: 0, replacement: 'with' }, rng)).toThrow(RangeError);
    expect(() => drawFromPool(['a'], { count: 1.5, replacement: 'with' }, rng)).toThrow(RangeError);
    expect(() => drawFromPool(['a', 'b'], { count: 3, replacement: 'without' }, rng)).toThrow(
      RangeError,
    );
    expect(() => drawFromPool([], { count: 1, replacement: 'with' }, rng)).toThrow(RangeError);
  });
});
