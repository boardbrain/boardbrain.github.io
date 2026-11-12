import type { RandomSource } from './randomSource';
import { uniformInt } from './uniform';

/** Sides of the die in the dice test. */
export const DICE_TEST_SIDES = 6;

/** Rolls of one dice test; enough that a real bias of about 2 % would stand out. */
export const DICE_TEST_ROLLS = 60_000;

/**
 * Critical value of the chi-square distribution for 5 degrees of freedom at α = 0.001, the same
 * level as the statistical suite (Architecture 14.4). A fair source exceeds it in one test out
 * of a thousand.
 */
export const DICE_TEST_CRITICAL_VALUE = 20.515;

/**
 * Result of a dice test (K-9): how often each side came up and whether the spread stays within
 * what chance explains.
 */
export type DiceTestResult = {
  /** Count per side, index 0 is a one. */
  readonly counts: readonly number[];
  readonly rolls: number;
  /** Chi-square statistic against the uniform distribution. */
  readonly chiSquare: number;
  /** The statistic stays below the critical value. */
  readonly isInconspicuous: boolean;
};

/**
 * Chi-square statistic of observed counts against the uniform distribution.
 * @throws {RangeError} if there are no counts or no observations.
 */
export function chiSquareAgainstUniform(counts: readonly number[]): number {
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (counts.length === 0 || total === 0) {
    throw new RangeError('chi-square needs at least one observation');
  }
  const expected = total / counts.length;
  return counts.reduce((sum, count) => sum + (count - expected) ** 2 / expected, 0);
}

/**
 * K-9: rolls a six-sided die with the random source of the app and checks the spread with a
 * chi-square test (NFA-ZF-02). Shows on the diagnostics page that the source of this device
 * behaves fairly; it decides nothing in a match.
 */
export function runDiceTest(rng: RandomSource, rolls: number = DICE_TEST_ROLLS): DiceTestResult {
  const counts = Array.from({ length: DICE_TEST_SIDES }, () => 0);
  for (let roll = 0; roll < rolls; roll += 1) {
    const side = uniformInt(DICE_TEST_SIDES, rng);
    counts[side] = (counts[side] ?? 0) + 1;
  }
  const chiSquare = chiSquareAgainstUniform(counts);
  return { counts, rolls, chiSquare, isInconspicuous: chiSquare < DICE_TEST_CRITICAL_VALUE };
}
