import { InvariantError } from '@/core/shared';
import { ScriptedRandomSource } from '@tests/support/scriptedRandomSource';
import { SeededRandomSource } from '@tests/support/seededRandomSource';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  completeOrder,
  drawOrderSpin,
  drawPlacementOrder,
  orderSpinCount,
  remainingForOrder,
  startingPerson,
} from './placementOrder';

const FC_SEED = 20261029;
const PERSONS = ['Anna', 'Ben', 'Clara', 'David'];

// All sequences of accepted words for n persons: word i lies in 0 … n − 1 − i.
function wordSequences(personCount: number): number[][] {
  let sequences: number[][] = [[]];
  for (let spin = 0; spin < personCount - 1; spin++) {
    sequences = sequences.flatMap((sequence) =>
      Array.from({ length: personCount - spin }, (_, word) => [...sequence, word]),
    );
  }
  return sequences;
}

describe('US-LS-03 Draw the placement order', () => {
  it('AK-2: needs n − 1 spins for n persons', () => {
    expect([1, 2, 3, 4, 12].map(orderSpinCount)).toEqual([0, 1, 2, 3, 11]);
  });

  it('AK-2: throws a RangeError for no persons or a broken count', () => {
    expect(() => orderSpinCount(0)).toThrow(RangeError);
    expect(() => orderSpinCount(2.5)).toThrow(RangeError);
    expect(() => drawPlacementOrder([], new ScriptedRandomSource([]))).toThrow(RangeError);
  });

  it('AK-2: draws each spin from the remaining persons; the last place follows', () => {
    // Words 3, 0, 1: David from all four, Anna from Anna, Ben, Clara, Clara from Ben, Clara.
    const rng = new ScriptedRandomSource([3, 0, 1]);

    expect(drawPlacementOrder(PERSONS, rng)).toEqual(['David', 'Anna', 'Clara', 'Ben']);
    expect(rng.consumed).toBe(3);
  });

  it('AK-2: the candidates of a spin are the persons not drawn yet, in their order', () => {
    expect(remainingForOrder(PERSONS, [])).toEqual(PERSONS);
    expect(remainingForOrder(PERSONS, ['Clara', 'Anna'])).toEqual(['Ben', 'David']);
  });

  it('AK-2: single spins add up to the same order as the whole draw', () => {
    const rng = new ScriptedRandomSource([1, 2, 0]);
    const first = drawOrderSpin(PERSONS, [], rng);
    const second = drawOrderSpin(PERSONS, [first], rng);
    const third = drawOrderSpin(PERSONS, [first, second], rng);

    expect(completeOrder(PERSONS, [first, second, third])).toEqual(
      drawPlacementOrder(PERSONS, new ScriptedRandomSource([1, 2, 0])),
    );
  });

  it('AK-2: a single person needs no spin', () => {
    expect(drawPlacementOrder(['Anna'], new ScriptedRandomSource([]))).toEqual(['Anna']);
  });

  it('AK-2: refuses a spin after the last one and an incomplete order', () => {
    expect(() => drawOrderSpin(['A', 'B'], ['A'], new ScriptedRandomSource([0]))).toThrow(
      InvariantError,
    );
    expect(() => completeOrder(PERSONS, ['Anna'])).toThrow(InvariantError);
    expect(() => completeOrder(['A', 'B'], ['C'])).toThrow(InvariantError);
  });

  it('refuses persons that occur twice', () => {
    expect(() => drawPlacementOrder(['A', 'A'], new ScriptedRandomSource([0]))).toThrow(
      InvariantError,
    );
  });

  it('AK-3: the person on place 1 is the starting person', () => {
    const order = drawPlacementOrder(PERSONS, new ScriptedRandomSource([2, 0, 0]));

    expect(startingPerson(order)).toBe('Clara');
    expect(() => startingPerson([])).toThrow(InvariantError);
  });

  it.each([2, 3, 4])(
    'AK-4: maps the accepted words one to one onto all n! orders for n = %i (exhaustive)',
    (personCount) => {
      // NFA-ZF-02: each spin is uniform (proven in core/random/uniform.test.ts); every order
      // comes from exactly one word sequence, so all n! orders are equally likely.
      const persons = PERSONS.slice(0, personCount);
      const orders = wordSequences(personCount).map((words) =>
        drawPlacementOrder(persons, new ScriptedRandomSource(words)).join(','),
      );
      const factorial = [1, 2, 3, 4].slice(0, personCount).reduce((a, b) => a * b, 1);

      expect(orders).toHaveLength(factorial);
      expect(new Set(orders).size).toBe(factorial);
    },
  );

  it('AK-4: every drawn order is a permutation of the persons (property)', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.string(), { minLength: 1, maxLength: 12 }),
        fc.integer(),
        (persons, seed) => {
          const order = drawPlacementOrder(persons, new SeededRandomSource(seed));
          return (
            order.length === persons.length &&
            [...order].sort().join() === [...persons].sort().join()
          );
        },
      ),
      { seed: FC_SEED },
    );
  });
});
