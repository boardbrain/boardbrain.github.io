/**
 * Successful outcome of an operation that can fail in an expected way (ADR-025).
 */
export type Ok<T> = { readonly ok: true; readonly value: T };

/**
 * Expected failure with a typed error code in kebab-case, e.g. `'group-full'` (ADR-025).
 * The UI translates the code into a message via the language file.
 */
export type Err<E extends string> = { readonly ok: false; readonly error: E };

/**
 * Outcome of an operation that can fail in an expected way (ADR-025). Expected errors are
 * returned instead of thrown, so TypeScript forces the caller to handle both cases.
 */
export type Result<T, E extends string> = Ok<T> | Err<E>;

/**
 * Creates a successful outcome.
 */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

/**
 * Creates an expected failure with the given error code.
 */
export function err<E extends string>(error: E): Err<E> {
  return { ok: false, error };
}
