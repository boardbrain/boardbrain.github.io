import { drawPerson } from '@/core/draws';
import { CryptoRandomSource } from '@/infra/random/cryptoRandomSource';
import { describe, expect, it } from 'vitest';
import { chiSquareAgainstUniform, criticalValue } from '../support/chiSquare';

// NFA-ZF-02: 100,000 draws per check, chi-square against the uniform distribution, α = 0.001.
const DRAWS = 100_000;
const PERSON_COUNTS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const personsOf = (n: number): number[] => Array.from({ length: n }, (_, index) => index);

describe('US-LS-01 Draw a person with the real random source', () => {
  it.each(PERSON_COUNTS)('AK-1: draws each of %i persons with probability 1/n', (n) => {
    const persons = personsOf(n);
    const rng = new CryptoRandomSource();
    const counts = new Array<number>(n).fill(0);

    for (let draw = 0; draw < DRAWS; draw++) {
      const person = drawPerson(persons, rng);
      counts[person] = (counts[person] ?? 0) + 1;
    }

    expect(chiSquareAgainstUniform(counts)).toBeLessThan(criticalValue(n - 1));
  });

  it('AK-3: two consecutive draws are independent, including repeats (n = 4)', () => {
    // FA-LS-06: all 16 ordered pairs, the 4 repeats included, are equally likely.
    const n = 4;
    const persons = personsOf(n);
    const rng = new CryptoRandomSource();
    const counts = new Array<number>(n * n).fill(0);

    for (let draw = 0; draw < DRAWS; draw++) {
      const pair = drawPerson(persons, rng) * n + drawPerson(persons, rng);
      counts[pair] = (counts[pair] ?? 0) + 1;
    }

    expect(chiSquareAgainstUniform(counts)).toBeLessThan(criticalValue(n * n - 1));
  });
});
