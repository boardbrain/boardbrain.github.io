import { InvariantError } from '@/core/shared';
import type { RandomSource } from './randomSource';

const UINT32_BITS = 32;

/**
 * Unbiased integer from 0 to n − 1, drawn from words of the given bit width (NFA-ZF-02).
 *
 * Word-width independent version of `uniformInt`. Words at or above the largest multiple of n
 * are rejected and drawn again instead of reducing them modulo n, which would favour small
 * results. The small bit width allows the exhaustive proof in the tests (Architecture 14.3).
 * @throws {RangeError} if n is not an integer from 1 to 2^bits.
 */
export function uniformIntFromWords(n: number, nextWord: () => number, bits: number): number {
  const range = 2 ** bits;
  if (!Number.isInteger(n) || n < 1 || n > range) {
    throw new RangeError(`n must be an integer from 1 to ${String(range)}, got ${String(n)}`);
  }
  // NFA-ZF-02: largest multiple of n that is at most range; words from here on are rejected.
  const limit = range - (range % n);
  let word = nextWord();
  while (word >= limit) {
    word = nextWord();
  }
  return word % n;
}

/**
 * Unbiased integer from 0 to n − 1 (NFA-ZF-02).
 * @throws {RangeError} if n is not an integer from 1 to 2^32.
 */
export function uniformInt(n: number, rng: RandomSource): number {
  return uniformIntFromWords(n, () => rng.nextUint32(), UINT32_BITS);
}

/**
 * Picks one item of the list, each with probability 1/length (NFA-ZF-02).
 * @throws {RangeError} if the list is empty.
 */
export function pick<T>(items: readonly T[], rng: RandomSource): T {
  const index = uniformInt(items.length, rng);
  // Looking the item up by position keeps undefined a valid item without a non-null assertion.
  for (const [position, item] of items.entries()) {
    if (position === index) {
      return item;
    }
  }
  throw new InvariantError('picked index lies within the list');
}
