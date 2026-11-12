/**
 * Public interface of the module `core/random`: random source `RandomSource`, unbiased integers, picking from lists and the dice test of the diagnostics (NFA-ZF-01 to -03, K-9).
 *
 * Other modules import only through this file (Architecture 4.3).
 */
export type { RandomSource } from './randomSource';
export { pick, uniformInt } from './uniform';
export {
  chiSquareAgainstUniform,
  DICE_TEST_CRITICAL_VALUE,
  DICE_TEST_ROLLS,
  DICE_TEST_SIDES,
  runDiceTest,
  type DiceTestResult,
} from './diceTest';
