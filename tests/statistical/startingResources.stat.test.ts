import type { PoolDrawOptions } from '@/core/draws';
import { CATAN_RESOURCES, drawCatanStartingResources } from '@/games/catan';
import { CryptoRandomSource } from '@/infra/random/cryptoRandomSource';
import { describe, expect, it } from 'vitest';
import { chiSquareAgainstUniform, criticalValue } from '../support/chiSquare';

// NFA-ZF-02: 100,000 draws per check, chi-square against the uniform distribution, α = 0.001.
const DRAWS = 100_000;

// Counts how often each ordered result occurs.
function countResults(options: PoolDrawOptions): Map<string, number> {
  const rng = new CryptoRandomSource();
  const counts = new Map<string, number>();
  for (let draw = 0; draw < DRAWS; draw++) {
    const key = drawCatanStartingResources(options, rng).join(',');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

describe('US-SR-01 Draw starting resources with the real random source', () => {
  it('AK-3: with replacement a single draw is uniform over the five resources', () => {
    const counts = countResults({ count: 1, replacement: 'with' });

    expect(counts.size).toBe(CATAN_RESOURCES.length);
    expect(chiSquareAgainstUniform([...counts.values()])).toBeLessThan(criticalValue(4));
  });

  it('AK-3: with replacement all 25 ordered pairs at k = 2 are equally likely, duplicates included', () => {
    const counts = countResults({ count: 2, replacement: 'with' });

    expect(counts.size).toBe(25);
    expect(chiSquareAgainstUniform([...counts.values()])).toBeLessThan(criticalValue(24));
  });

  it('AK-4: without replacement all 20 ordered pairs at k = 2 are equally likely', () => {
    const counts = countResults({ count: 2, replacement: 'without' });

    expect(counts.size).toBe(20);
    expect(chiSquareAgainstUniform([...counts.values()])).toBeLessThan(criticalValue(19));
  });

  it('AK-4: without replacement each draw is uniform over the remaining resources (k = 5)', () => {
    // Every draw uniform over the remaining resources means all 120 orders are equally likely.
    const counts = countResults({ count: 5, replacement: 'without' });

    expect(counts.size).toBe(120);
    expect(chiSquareAgainstUniform([...counts.values()])).toBeLessThan(criticalValue(119));
  });
});
