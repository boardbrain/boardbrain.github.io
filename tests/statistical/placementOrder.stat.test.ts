import { drawPlacementOrder } from '@/core/draws';
import { CryptoRandomSource } from '@/infra/random/cryptoRandomSource';
import { describe, expect, it } from 'vitest';
import { chiSquareAgainstUniform, criticalValue } from '../support/chiSquare';

// NFA-ZF-02: 100,000 draws per check, chi-square against the uniform distribution, α = 0.001.
const DRAWS = 100_000;

const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));

describe('US-LS-03 Draw the placement order with the real random source', () => {
  it.each([2, 3, 4])('AK-4: all n! orders of %i persons are equally likely', (n) => {
    const persons = Array.from({ length: n }, (_, index) => index);
    const rng = new CryptoRandomSource();
    const counts = new Map<string, number>();

    for (let draw = 0; draw < DRAWS; draw++) {
      const key = drawPlacementOrder(persons, rng).join(',');
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    expect(counts.size).toBe(factorial(n));
    expect(chiSquareAgainstUniform([...counts.values()])).toBeLessThan(
      criticalValue(factorial(n) - 1),
    );
  });
});
