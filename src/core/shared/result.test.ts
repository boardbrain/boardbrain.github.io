import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { err, ok, type Result } from './result';

// Fixed seed: property tests are reproducible (Development Guidelines 8.2).
const PROPERTY_SEED = 20261006;

function describeOutcome(result: Result<number, 'too-small'>): string {
  return result.ok ? `value ${String(result.value)}` : `error ${result.error}`;
}

describe('ADR-025 result type', () => {
  it('ok() returns a successful outcome with the value', () => {
    const result = ok(42);

    expect(result).toEqual({ ok: true, value: 42 });
  });

  it('err() returns a failure with the error code', () => {
    const result = err('group-full');

    expect(result).toEqual({ ok: false, error: 'group-full' });
  });

  it('the caller distinguishes both cases via the ok field', () => {
    expect(describeOutcome(ok(3))).toBe('value 3');
    expect(describeOutcome(err('too-small'))).toBe('error too-small');
  });

  it('property: ok() keeps every value unchanged', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => Object.is(ok(value).value, value)),
      { seed: PROPERTY_SEED },
    );
  });
});
