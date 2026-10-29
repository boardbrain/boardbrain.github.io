import { confirmStep, drawNextStep, startGeneration } from '@/core/generation';
import { CATAN_COLOR_KEYS, toPersonId, type PersonId } from '@/core/model';
import type { RandomSource } from '@/core/random';
import {
  CATAN_DEFAULT_OPTIONS,
  CATAN_GENERATION,
  CATAN_INITIAL_GAME_STATE,
  type CatanGeneration,
  type CatanGenerationDefinition,
  type CatanOptions,
  type CatanSetup,
} from '@/games/catan';
import { defined } from './defined';

/**
 * Person ids …a1 to …a4 for Catan tests; …a1 and …a2 are the members of `aGroup()`.
 */
export const CATAN_TEST_PERSONS: readonly PersonId[] = [1, 2, 3, 4].map((number) =>
  toPersonId(`00000000-0000-4000-8000-0000000000a${String(number)}`),
);

/**
 * Setup of a Catan match with the first `personCount` test persons, each with the Catan colour
 * at the same position (red, blue, white, orange).
 */
export function aCatanSetup(personCount: number, options: Partial<CatanOptions> = {}): CatanSetup {
  const participants = CATAN_TEST_PERSONS.slice(0, personCount);
  return {
    participants,
    options: { ...CATAN_DEFAULT_OPTIONS, ...options },
    colors: participants.map((personId, index) => ({
      personId,
      catanColor: defined(CATAN_COLOR_KEYS[index], 'a Catan colour'),
    })),
  };
}

/**
 * Draws and confirms steps until the generation is complete or `maxSteps` steps were drawn.
 */
export function runCatanGeneration(
  setup: CatanSetup,
  rng: RandomSource,
  generation: CatanGeneration = startGeneration(CATAN_INITIAL_GAME_STATE),
  maxSteps = Infinity,
  definition: CatanGenerationDefinition = CATAN_GENERATION,
): CatanGeneration {
  let current = generation;
  for (let count = 0; count < maxSteps; count++) {
    const drawn = drawNextStep(definition, setup, current, rng);
    if (!drawn.ok) {
      return current;
    }
    const confirmed = confirmStep(definition, setup, drawn.value);
    if (!confirmed.ok) {
      throw new Error(confirmed.error);
    }
    current = confirmed.value;
  }
  return current;
}
