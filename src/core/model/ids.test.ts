import { InvariantError } from '@/core/shared';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  isUuidV4,
  parseGameId,
  parseGroupId,
  parsePersonId,
  toGameId,
  toGroupId,
  toPersonId,
} from './ids';

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

  it('turns a UUID into a group id unchanged', () => {
    const uuid = 'c47a0000-0000-4000-8000-000000000001';

    expect(toGroupId(uuid)).toBe(uuid);
  });

  it('throws an invariant error for a value that is not a group UUID', () => {
    expect(() => toGroupId('42')).toThrow(InvariantError);
  });

  it('throws an invariant error for a value that is not a UUID', () => {
    expect(() => toPersonId('42')).toThrow(InvariantError);
    expect(() => toGameId('42')).toThrow(InvariantError);
  });
});

describe('US-VW-05 identifiers from an address', () => {
  const uuid = 'c47a0000-0000-4000-8000-000000000001';

  it('AK-2: reads a person id from a valid UUID', () => {
    expect(parsePersonId(uuid)).toEqual({ ok: true, value: uuid });
  });

  it('AK-3: reads a group id from a valid UUID', () => {
    expect(parseGroupId(uuid)).toEqual({ ok: true, value: uuid });
  });

  it('US-VW-07: reads a game id from a valid UUID', () => {
    expect(parseGameId(uuid)).toEqual({ ok: true, value: uuid });
  });

  it.each([
    ['mistyped', 'c47a0000'],
    ['empty', ''],
    ['uppercase', uuid.toUpperCase()],
  ])('returns an expected error for a %s value instead of throwing', (_case, value) => {
    expect(parsePersonId(value)).toEqual({ ok: false, error: 'id-invalid' });
    expect(parseGroupId(value)).toEqual({ ok: false, error: 'id-invalid' });
    expect(parseGameId(value)).toEqual({ ok: false, error: 'id-invalid' });
  });
});
