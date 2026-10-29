import { pick, type RandomSource } from '@/core/random';
import { assert } from '@/core/shared';

/**
 * Number of wheel spins for the placement order of n persons (US-LS-03 AK-2): n − 1, the last
 * place follows automatically.
 * @throws {RangeError} if n is not an integer of at least 1.
 */
export function orderSpinCount(personCount: number): number {
  if (!Number.isInteger(personCount) || personCount < 1) {
    throw new RangeError(
      `person count must be an integer of at least 1, got ${String(personCount)}`,
    );
  }
  return personCount - 1;
}

/**
 * Persons not yet placed in the order, in their original order; the candidates of the next
 * spin.
 */
export function remainingForOrder<P>(persons: readonly P[], drawn: readonly P[]): P[] {
  return persons.filter((person) => !drawn.includes(person));
}

/**
 * One spin of the placement order (FA-LS-02, US-LS-03 AK-2): draws the next place from the
 * persons not yet drawn, each with the same probability. Each spin is a step of its own
 * (Specification 3.1).
 * @throws {InvariantError} if persons repeat or all spins are done.
 */
export function drawOrderSpin<P>(persons: readonly P[], drawn: readonly P[], rng: RandomSource): P {
  assertDistinct(persons);
  assert(drawn.length < orderSpinCount(persons.length), 'a spin of the order is still open');
  return pick(remainingForOrder(persons, drawn), rng);
}

/**
 * Completes the order after all n − 1 spins with the last remaining person (US-LS-03 AK-2).
 * @throws {InvariantError} if not exactly n − 1 distinct persons were drawn.
 */
export function completeOrder<P>(persons: readonly P[], drawn: readonly P[]): P[] {
  assertDistinct(persons);
  const remaining = remainingForOrder(persons, drawn);
  assert(
    drawn.length === orderSpinCount(persons.length) && remaining.length === 1,
    'all spins of the order are done',
  );
  return [...drawn, ...remaining];
}

/**
 * Draws the whole placement order in n − 1 spins (FA-LS-02, US-LS-03): every one of the n!
 * orders is equally likely (AK-4), because each spin is uniform over the remaining persons.
 * @throws {RangeError} if the list is empty.
 * @throws {InvariantError} if persons repeat.
 */
export function drawPlacementOrder<P>(persons: readonly P[], rng: RandomSource): P[] {
  const drawn: P[] = [];
  for (let spin = 0; spin < orderSpinCount(persons.length); spin++) {
    drawn.push(drawOrderSpin(persons, drawn, rng));
  }
  return completeOrder(persons, drawn);
}

/**
 * The person on place 1 places first and also starts the game (FA-LS-02, US-LS-03 AK-3).
 * @throws {InvariantError} if the order is empty.
 */
export function startingPerson<P>(order: readonly P[]): P {
  const [first] = order;
  assert(first !== undefined, 'the order has a first place');
  return first;
}

function assertDistinct(persons: readonly unknown[]): void {
  assert(new Set(persons).size === persons.length, 'every person occurs only once');
}
