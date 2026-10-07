import { describe, expect, it } from 'vitest';
import { assert, InvariantError } from './assert';

describe('Architecture 4.6 assert', () => {
  it('lets a satisfied invariant pass', () => {
    expect(() => {
      assert(true, 'always satisfied');
    }).not.toThrow();
  });

  it('throws InvariantError with a description when the invariant is violated', () => {
    expect(() => {
      assert(false, 'a group has at most 12 members');
    }).toThrow(new InvariantError('Invariant violated: a group has at most 12 members'));
  });

  it('InvariantError is an Error with its own name', () => {
    const error = new InvariantError('x');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('InvariantError');
  });
});
