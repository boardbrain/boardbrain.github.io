/**
 * Returns the value or fails the test with the description, for list items and map entries
 * that a test knows to exist (no `!`, Development Guidelines 4.1).
 */
export function defined<T>(value: T | undefined, description: string): T {
  if (value === undefined) {
    throw new Error(`Expected ${description} to be defined`);
  }
  return value;
}
