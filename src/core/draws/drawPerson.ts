import { pick, type RandomSource } from '@/core/random';

/**
 * Draws one person, each with probability 1/n (US-LS-01, FA-LS-05, FA-LS-06).
 *
 * Game-independent building block: it accepts any kind of person and knows nothing about
 * Catan. It keeps no state, so draws are independent and the same person can be drawn
 * repeatedly; the list itself is not changed.
 * @throws {RangeError} if the list is empty.
 */
export function drawPerson<P>(persons: readonly P[], rng: RandomSource): P {
  return pick(persons, rng);
}
