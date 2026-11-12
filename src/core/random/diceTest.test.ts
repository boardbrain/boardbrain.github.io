import { ScriptedRandomSource } from '@tests/support/scriptedRandomSource';
import { SeededRandomSource } from '@tests/support/seededRandomSource';
import { describe, expect, it } from 'vitest';
import {
  chiSquareAgainstUniform,
  DICE_TEST_CRITICAL_VALUE,
  DICE_TEST_ROLLS,
  DICE_TEST_SIDES,
  runDiceTest,
} from './diceTest';

const UINT32_RANGE = 2 ** 32;

/** Word that `uniformInt(6, …)` turns into the given side (0 to 5). */
function wordFor(side: number): number {
  return side;
}

describe('K-9 dice test', () => {
  it('counts every roll and uses the default number of rolls', () => {
    const result = runDiceTest(new SeededRandomSource(9));

    expect(result.rolls).toBe(DICE_TEST_ROLLS);
    expect(result.counts).toHaveLength(DICE_TEST_SIDES);
    expect(result.counts.reduce((sum, count) => sum + count, 0)).toBe(DICE_TEST_ROLLS);
  });

  it('finds an even spread inconspicuous', () => {
    const words = Array.from({ length: 600 }, (_, index) => wordFor(index % DICE_TEST_SIDES));

    const result = runDiceTest(new ScriptedRandomSource(words), words.length);

    expect(result.counts).toEqual([100, 100, 100, 100, 100, 100]);
    expect(result.chiSquare).toBe(0);
    expect(result.isInconspicuous).toBe(true);
  });

  it('flags a source that always rolls the same side', () => {
    const words = Array.from({ length: 600 }, () => wordFor(2));

    const result = runDiceTest(new ScriptedRandomSource(words), words.length);

    expect(result.counts).toEqual([0, 0, 600, 0, 0, 0]);
    expect(result.chiSquare).toBeGreaterThan(DICE_TEST_CRITICAL_VALUE);
    expect(result.isInconspicuous).toBe(false);
  });

  it('NFA-ZF-02: rejects words above the largest multiple of six instead of folding them', () => {
    // 2^32 mod 6 = 4: the four highest words would favour sides 0 to 3 and are drawn again.
    const rejected = UINT32_RANGE - 1;

    const result = runDiceTest(new ScriptedRandomSource([rejected, wordFor(5)]), 1);

    expect(result.counts).toEqual([0, 0, 0, 0, 0, 1]);
  });
});

describe('K-9 chi-square against the uniform distribution', () => {
  it('computes the statistic', () => {
    // Expected 10 each: (20 − 10)² / 10 + (0 − 10)² / 10 = 20.
    expect(chiSquareAgainstUniform([20, 0])).toBe(20);
  });

  it('rejects counts without observations', () => {
    expect(() => chiSquareAgainstUniform([])).toThrow(RangeError);
    expect(() => chiSquareAgainstUniform([0, 0])).toThrow(RangeError);
  });
});
