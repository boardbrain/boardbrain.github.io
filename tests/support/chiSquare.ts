/**
 * Critical values of the chi-square distribution for α = 0.001 per degree of freedom
 * (Architecture 14.4). Computed via the regularised incomplete gamma function and checked
 * against standard tables (e.g. 1 → 10.828; 5 → 20.515). Degrees of freedom are added as the
 * statistical tests need them.
 */
export const CHI_SQUARE_CRITICAL_ALPHA_0_001: Readonly<Record<number, number>> = {
  1: 10.8276,
  2: 13.8155,
  3: 16.2662,
  4: 18.4668,
  5: 20.515,
  6: 22.4577,
  7: 24.3219,
  8: 26.1245,
  9: 27.8772,
  10: 29.5883,
  11: 31.2641,
  15: 37.6973,
  255: 330.5197,
};

/**
 * Returns the critical value for α = 0.001; throws if it is missing from the table.
 */
export function criticalValue(degreesOfFreedom: number): number {
  const value = CHI_SQUARE_CRITICAL_ALPHA_0_001[degreesOfFreedom];
  if (value === undefined) {
    throw new Error(`No critical value for ${String(degreesOfFreedom)} degrees of freedom`);
  }
  return value;
}

/**
 * Chi-square statistic of the observed counts against the uniform distribution.
 */
export function chiSquareAgainstUniform(counts: readonly number[]): number {
  const total = counts.reduce((sum, count) => sum + count, 0);
  const expected = total / counts.length;
  return counts.reduce((sum, count) => sum + (count - expected) ** 2 / expected, 0);
}
