import { pick, type RandomSource } from '@/core/random';

/**
 * How to draw from a pool (FA-SR-03): how many items, and whether a drawn item goes back.
 */
export type PoolDrawOptions = {
  /** Number k of items to draw, at least 1. */
  readonly count: number;
  /** With replacement duplicates are possible; without, every item at most once. */
  readonly replacement: 'with' | 'without';
};

/**
 * Draws k items from a pool, in drawing order (Architecture 5.6). With replacement each draw is
 * uniform over the whole pool; without replacement each draw is uniform over the items not
 * drawn yet, in their order in the pool. Game-independent building block like `drawPerson`;
 * Catan uses it for the starting resources (FA-SR-*).
 * @throws {RangeError} if the count is not an integer of at least 1, if the pool is empty, or
 *   if it holds fewer than k items without replacement.
 */
export function drawFromPool<T>(
  pool: readonly T[],
  { count, replacement }: PoolDrawOptions,
  rng: RandomSource,
): T[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError(`count must be an integer of at least 1, got ${String(count)}`);
  }
  if (replacement === 'without' && count > pool.length) {
    throw new RangeError(
      `cannot draw ${String(count)} of ${String(pool.length)} items without replacement`,
    );
  }
  // Positions keep items apart that are equal, so only the drawn one leaves the pool.
  const available = [...pool.entries()];
  const drawn: T[] = [];
  for (let draw = 0; draw < count; draw++) {
    const entry = pick(available, rng);
    if (replacement === 'without') {
      available.splice(available.indexOf(entry), 1);
    }
    drawn.push(entry[1]);
  }
  return drawn;
}
