import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { err, ok, type Result } from './result';

// Fester Startwert: Eigenschaftstests sind reproduzierbar (Entwicklungsrichtlinien 8.2).
const PROPERTY_SEED = 20261006;

function describeOutcome(result: Result<number, 'too-small'>): string {
  return result.ok ? `Wert ${String(result.value)}` : `Fehler ${result.error}`;
}

describe('ADR-025 Ergebnistyp', () => {
  it('ok() liefert ein erfolgreiches Ergebnis mit dem Wert', () => {
    const result = ok(42);

    expect(result).toEqual({ ok: true, value: 42 });
  });

  it('err() liefert einen Fehlschlag mit dem Fehlercode', () => {
    const result = err('group-full');

    expect(result).toEqual({ ok: false, error: 'group-full' });
  });

  it('der Aufrufer unterscheidet beide Fälle über das Feld ok', () => {
    expect(describeOutcome(ok(3))).toBe('Wert 3');
    expect(describeOutcome(err('too-small'))).toBe('Fehler too-small');
  });

  it('Eigenschaft: ok() bewahrt jeden Wert unverändert', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => Object.is(ok(value).value, value)),
      { seed: PROPERTY_SEED },
    );
  });
});
