import { afterEach, describe, expect, it, vi } from 'vitest';
import { CryptoRandomSource } from './cryptoRandomSource';

/**
 * Replaces the platform generator with a counter, so the test needs no real randomness
 * (Development Guidelines 8.2): the k-th call fills the buffer with k·1000, k·1000 + 1, …
 */
function stubGetRandomValues(): { calls: () => number } {
  let calls = 0;
  vi.spyOn(crypto, 'getRandomValues').mockImplementation(
    <T extends ArrayBufferView | null>(array: T): T => {
      calls += 1;
      if (array instanceof Uint32Array) {
        array.forEach((_, index) => {
          array[index] = calls * 1000 + index;
        });
      }
      return array;
    },
  );
  return { calls: () => calls };
}

describe('NFA-ZF-01 CryptoRandomSource', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the values of the platform generator in order', () => {
    stubGetRandomValues();
    const rng = new CryptoRandomSource();

    expect([rng.nextUint32(), rng.nextUint32(), rng.nextUint32()]).toEqual([1000, 1001, 1002]);
  });

  it('fetches 256 values at once and refills only when they are used up', () => {
    const stub = stubGetRandomValues();
    const rng = new CryptoRandomSource();

    const values = Array.from({ length: 257 }, () => rng.nextUint32());

    expect(stub.calls()).toBe(2);
    expect(values[255]).toBe(1255);
    expect(values[256]).toBe(2000);
  });

  it('does not call the platform generator before the first value is requested', () => {
    const stub = stubGetRandomValues();

    new CryptoRandomSource();

    expect(stub.calls()).toBe(0);
  });
});
