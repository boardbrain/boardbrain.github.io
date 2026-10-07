/**
 * Error for a violated invariant, i.e. a programming error (ADR-025). It is thrown and only
 * caught at the boundaries: application services, error boundaries and the global handler.
 */
export class InvariantError extends Error {
  override readonly name = 'InvariantError';
}

/**
 * Checks an invariant and throws `InvariantError` if it is violated (Architecture 4.6).
 * Only for conditions that always hold in correct code; expected errors are returned as
 * `Result` instead.
 */
export function assert(isSatisfied: boolean, description: string): asserts isSatisfied {
  if (!isSatisfied) {
    throw new InvariantError(`Invariant violated: ${description}`);
  }
}
