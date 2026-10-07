/**
 * Fehler für eine verletzte Invariante, also einen Programmierfehler (ADR-025).
 * Er wird geworfen und erst an den Grenzen aufgefangen: in Anwendungsdiensten,
 * Error Boundaries und der globalen Fehlerbehandlung.
 */
export class InvariantError extends Error {
  override readonly name = 'InvariantError';
}

/**
 * Prüft eine Invariante und wirft `InvariantError`, wenn sie verletzt ist (Architektur 4.6).
 * Nur für Bedingungen, die bei korrektem Code immer gelten; erwartbare Fehler werden
 * stattdessen als `Result` zurückgegeben.
 */
export function assert(isSatisfied: boolean, description: string): asserts isSatisfied {
  if (!isSatisfied) {
    throw new InvariantError(`Invariante verletzt: ${description}`);
  }
}
