/**
 * Kritische Werte der Chi-Quadrat-Verteilung für α = 0,001 je Freiheitsgrad
 * (Architektur 14.4). Berechnet über die regularisierte unvollständige Gammafunktion und
 * mit Standardtabellen abgeglichen (z. B. 1 → 10,828; 5 → 20,515). Weitere Freiheitsgrade
 * kommen mit den statistischen Tests in Inkrement I1 hinzu.
 */
export const CHI_SQUARE_CRITICAL_ALPHA_0_001: Readonly<Record<number, number>> = {
  255: 330.5197,
};

/**
 * Liefert den kritischen Wert für α = 0,001; wirft, wenn er in der Tabelle fehlt.
 */
export function criticalValue(degreesOfFreedom: number): number {
  const value = CHI_SQUARE_CRITICAL_ALPHA_0_001[degreesOfFreedom];
  if (value === undefined) {
    throw new Error(`Kein kritischer Wert für ${String(degreesOfFreedom)} Freiheitsgrade`);
  }
  return value;
}

/**
 * Chi-Quadrat-Statistik der beobachteten Häufigkeiten gegen die Gleichverteilung.
 */
export function chiSquareAgainstUniform(counts: readonly number[]): number {
  const total = counts.reduce((sum, count) => sum + count, 0);
  const expected = total / counts.length;
  return counts.reduce((sum, count) => sum + (count - expected) ** 2 / expected, 0);
}
