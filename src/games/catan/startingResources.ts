import { drawFromPool, type PoolDrawOptions } from '@/core/draws';
import type { RandomSource } from '@/core/random';

/**
 * The five resources of Catan (FA-SR-02): lumber, brick, wool, grain and ore.
 */
export const CATAN_RESOURCES = ['lumber', 'brick', 'wool', 'grain', 'ore'] as const;

/**
 * A resource of Catan (FA-SR-02).
 */
export type CatanResource = (typeof CATAN_RESOURCES)[number];

/**
 * Smallest, largest and default number of starting resources per person (FA-SR-01, FA-SR-02).
 */
export const CATAN_STARTING_RESOURCES_COUNT = { min: 1, max: 5, default: 2 } as const;

/**
 * Draws the starting resources of one person (US-SR-01 AK-2 to AK-4), in drawing order: with
 * replacement each draw is uniform over all five resources, without replacement over the
 * resources this person has not received yet (FA-SR-03, Architecture 5.6).
 * @throws {RangeError} if the count is not an integer from 1 to 5.
 */
export function drawCatanStartingResources(
  options: PoolDrawOptions,
  rng: RandomSource,
): CatanResource[] {
  const { count } = options;
  if (
    !Number.isInteger(count) ||
    count < CATAN_STARTING_RESOURCES_COUNT.min ||
    count > CATAN_STARTING_RESOURCES_COUNT.max
  ) {
    throw new RangeError(`count must be an integer from 1 to 5, got ${String(count)}`);
  }
  return drawFromPool(CATAN_RESOURCES, options, rng);
}
