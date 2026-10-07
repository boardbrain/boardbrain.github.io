import { describe, expect, it } from 'vitest';
import { isUuidV4 } from '@/core/model';
import { uuidGenerator } from './uuidGenerator';

describe('NFA-DH-05 identifier source', () => {
  it('creates UUID version 4 values', () => {
    expect(isUuidV4(uuidGenerator.newId())).toBe(true);
  });

  it('creates a different identifier on every call', () => {
    const ids = new Set(Array.from({ length: 100 }, () => uuidGenerator.newId()));

    expect(ids.size).toBe(100);
  });
});
