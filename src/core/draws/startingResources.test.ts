import { ScriptedRandomSource } from '@tests/support/scriptedRandomSource';
import { SeededRandomSource } from '@tests/support/seededRandomSource';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { drawStartingResources, RESOURCES, STARTING_RESOURCES_COUNT } from './startingResources';

const FC_SEED = 20261029;

describe('US-SR-01 Draw starting resources', () => {
  it('FA-SR-02: knows the five resources and allows 1 to 5 per person, 2 by default', () => {
    expect(RESOURCES).toEqual(['lumber', 'brick', 'wool', 'grain', 'ore']);
    expect(STARTING_RESOURCES_COUNT).toEqual({ min: 1, max: 5, default: 2 });
  });

  it('AK-2: gives exactly k resources of the five (property)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.constantFrom('with' as const, 'without' as const),
        fc.integer(),
        (count, replacement, seed) => {
          const resources = drawStartingResources(
            { count, replacement },
            new SeededRandomSource(seed),
          );
          return (
            resources.length === count &&
            resources.every((resource) => RESOURCES.includes(resource))
          );
        },
      ),
      { seed: FC_SEED },
    );
  });

  it('AK-2: throws a RangeError for a count outside 1 to 5', () => {
    const rng = new SeededRandomSource(1);

    for (const count of [0, 6, 2.5]) {
      expect(() => drawStartingResources({ count, replacement: 'with' }, rng)).toThrow(RangeError);
    }
  });

  it('AK-3: with replacement maps the words 0 … 4 onto all five resources in every draw', () => {
    const second = RESOURCES.map(
      (_, word) =>
        drawStartingResources(
          { count: 2, replacement: 'with' },
          new ScriptedRandomSource([0, word]),
        )[1],
    );

    expect(second).toEqual([...RESOURCES]);
  });

  it('AK-3: with replacement duplicates are possible', () => {
    const rng = new ScriptedRandomSource([4, 4, 4]);

    expect(drawStartingResources({ count: 3, replacement: 'with' }, rng)).toEqual([
      'ore',
      'ore',
      'ore',
    ]);
    expect(rng.consumed).toBe(3);
  });

  it('AK-4: without replacement each draw picks from the resources not drawn yet', () => {
    // After wool, the words 0 … 3 select lumber, brick, grain and ore.
    const second = [0, 1, 2, 3].map(
      (word) =>
        drawStartingResources(
          { count: 2, replacement: 'without' },
          new ScriptedRandomSource([2, word]),
        )[1],
    );

    expect(second).toEqual(['lumber', 'brick', 'grain', 'ore']);
  });

  it('AK-4: without replacement never repeats a resource (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), fc.integer(), (count, seed) => {
        const resources = drawStartingResources(
          { count, replacement: 'without' },
          new SeededRandomSource(seed),
        );
        return new Set(resources).size === count;
      }),
      { seed: FC_SEED },
    );
  });

  it('AK-4: without replacement and k = 5 every person receives each resource once', () => {
    const rng = new ScriptedRandomSource([0, 0, 0, 0, 0]);

    expect(drawStartingResources({ count: 5, replacement: 'without' }, rng)).toEqual([
      ...RESOURCES,
    ]);
  });
});
