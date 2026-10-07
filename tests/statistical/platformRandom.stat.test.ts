import { describe, expect, it } from 'vitest';
import { chiSquareAgainstUniform, criticalValue } from '../support/chiSquare';

// NFA-ZF-02: 100.000 Ziehungen je Prüfung, Chi-Quadrat gegen Gleichverteilung, α = 0,001.
const DRAWS = 100_000;
const BYTE_VALUES = 256;

describe('NFA-ZF-01 Zufallsgenerator der Plattform', () => {
  it('crypto.getRandomValues liefert alle 256 Byte-Werte gleich häufig', () => {
    // Echter Zufall ist nur in dieser Suite erlaubt (Entwicklungsrichtlinien 8.2).
    const bytes = new Uint8Array(DRAWS);
    for (let offset = 0; offset < DRAWS; offset += 65_536) {
      crypto.getRandomValues(bytes.subarray(offset, Math.min(offset + 65_536, DRAWS)));
    }
    const counts = new Array<number>(BYTE_VALUES).fill(0);
    for (const byte of bytes) {
      counts[byte] = (counts[byte] ?? 0) + 1;
    }

    const statistic = chiSquareAgainstUniform(counts);

    expect(statistic).toBeLessThan(criticalValue(BYTE_VALUES - 1));
  });
});
