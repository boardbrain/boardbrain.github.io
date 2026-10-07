/**
 * Erfolgreiches Ergebnis eines Ablaufs mit erwartbarem Fehlschlag (ADR-025).
 */
export type Ok<T> = { readonly ok: true; readonly value: T };

/**
 * Erwartbarer Fehlschlag mit typisiertem Fehlercode in kebab-case, z. B. `'group-full'`
 * (ADR-025). Die Oberfläche übersetzt den Code über die Sprachdatei in eine Meldung.
 */
export type Err<E extends string> = { readonly ok: false; readonly error: E };

/**
 * Ergebnis eines Ablaufs, der erwartbar fehlschlagen kann (ADR-025). Erwartbare Fehler
 * werden nicht geworfen, sondern zurückgegeben, damit TypeScript den Aufrufer zwingt,
 * beide Fälle zu behandeln.
 */
export type Result<T, E extends string> = Ok<T> | Err<E>;

/**
 * Erzeugt ein erfolgreiches Ergebnis.
 */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

/**
 * Erzeugt einen erwartbaren Fehlschlag mit dem angegebenen Fehlercode.
 */
export function err<E extends string>(error: E): Err<E> {
  return { ok: false, error };
}
