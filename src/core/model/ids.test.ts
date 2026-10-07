import { InvariantError } from '@/core/shared';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { isUuidV4, toGameId, toPersonId } from './ids';

const FC_SEED = 20261007;

describe('NFA-DH-05 identifiers', () => {
  it('accepts UUID version 4 in lowercase form', () => {
    expect(isUuidV4('c47a0000-0000-4000-8000-000000000001')).toBe(true);
  });

  it('accepts every UUID version 4 (property)', () => {
    fc.assert(
      fc.property(fc.uuid({ version: 4 }), (uuid) => isUuidV4(uuid)),
      { seed: FC_SEED },
    );
  });

  it.each([
    ['empty', ''],
    ['version 1', 'c47a0000-0000-1000-8000-000000000001'],
    ['wrong variant', 'c47a0000-0000-4000-c000-000000000001'],
    ['uppercase', 'C47A0000-0000-4000-8000-000000000001'],
    ['without dashes', 'c47a0000000040008000000000000001'],
    ['sequential number', '42'],
  ])('rejects %s', (_case, value) => {
    expect(isUuidV4(value)).toBe(false);
  });

  it('turns a UUID into a person id and a game id unchanged', () => {
    const uuid = 'c47a0000-0000-4000-8000-000000000001';

    expect(toPersonId(uuid)).toBe(uuid);
    expect(toGameId(uuid)).toBe(uuid);
  });

  it('throws an invariant error for a value that is not a UUID', () => {
    expect(() => toPersonId('42')).toThrow(InvariantError);
    expect(() => toGameId('42')).toThrow(InvariantError);
  });
});
