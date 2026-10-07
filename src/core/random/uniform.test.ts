import { ScriptedRandomSource } from '@tests/support/scriptedRandomSource';
import { SeededRandomSource } from '@tests/support/seededRandomSource';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { pick, uniformInt, uniformIntFromWords } from './uniform';

const FC_SEED = 20261007;
const UINT32_MAX = 2 ** 32 - 1;

/** Offers the word x once; any further request is answered with 0 and counted. */
function offerOnce(n: number, x: number, bits: number): { result: number; isAccepted: boolean } {
  let calls = 0;
  const result = uniformIntFromWords(
    n,
    () => {
      calls += 1;
      return calls === 1 ? x : 0;
    },
    bits,
  );
  return { result, isAccepted: calls === 1 };
}

describe('NFA-ZF-02 unbiased conversion uniformIntFromWords', () => {
  const bits = 10;
  const range = 2 ** bits;

  it('maps the accepted input words onto every result equally often, for every n', () => {
    // Architecture 14.3: every one of the 1,024 words is offered exactly once per n.
    for (let n = 1; n <= range; n++) {
      const counts = new Array<number>(n).fill(0);
      for (let x = 0; x < range; x++) {
        const { result, isAccepted } = offerOnce(n, x, bits);
        if (isAccepted) {
          counts[result] = (counts[result] ?? 0) + 1;
        }
      }
      expect(new Set(counts).size, `n = ${String(n)}`).toBe(1);
    }
  });

  it('rejects exactly the words from the largest multiple of n upwards', () => {
    const mismatches: string[] = [];
    for (let n = 1; n <= range; n++) {
      const limit = range - (range % n);
      for (let x = 0; x < range; x++) {
        if (offerOnce(n, x, bits).isAccepted !== x < limit) {
          mismatches.push(`n = ${String(n)}, x = ${String(x)}`);
        }
      }
    }

    expect(mismatches).toEqual([]);
  });

  it('draws again until a word is accepted', () => {
    // n = 3 with 2 bits: range 4, limit 3, so the word 3 is rejected.
    const words = [3, 3, 2];
    let calls = 0;
    const result = uniformIntFromWords(
      3,
      () => {
        const word = words[calls] ?? 0;
        calls += 1;
        return word;
      },
      2,
    );

    expect(result).toBe(2);
    expect(calls).toBe(3);
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, range + 1])(
    'throws a RangeError for n = %s',
    (n) => {
      expect(() => uniformIntFromWords(n, () => 0, bits)).toThrow(RangeError);
    },
  );

  it('accepts n equal to the full range and then accepts every word', () => {
    expect(offerOnce(range, range - 1, bits)).toEqual({ result: range - 1, isAccepted: true });
  });
});

describe('NFA-ZF-02 uniformInt with 32-bit words', () => {
  it('rejects 2^32 − 1 for n = 3 because 2^32 is not a multiple of 3', () => {
    const rng = new ScriptedRandomSource([UINT32_MAX, 7]);

    const result = uniformInt(3, rng);

    expect(result).toBe(1);
    expect(rng.consumed).toBe(2);
  });

  it('accepts 2^32 − 2 for n = 3 as the largest word below the limit', () => {
    const rng = new ScriptedRandomSource([UINT32_MAX - 1]);

    expect(uniformInt(3, rng)).toBe((UINT32_MAX - 1) % 3);
    expect(rng.consumed).toBe(1);
  });

  it('returns 0 for n = 1 without rejecting any word', () => {
    const rng = new ScriptedRandomSource([UINT32_MAX]);

    expect(uniformInt(1, rng)).toBe(0);
  });

  it('accepts every word for n = 2^32', () => {
    const rng = new ScriptedRandomSource([UINT32_MAX]);

    expect(uniformInt(2 ** 32, rng)).toBe(UINT32_MAX);
  });

  it.each([0, 2 ** 32 + 1])('throws a RangeError for n = %s', (n) => {
    expect(() => uniformInt(n, new ScriptedRandomSource([]))).toThrow(RangeError);
  });

  it('always returns an integer from 0 to n − 1 (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 2 ** 32 }), fc.integer(), (n, seed) => {
        const result = uniformInt(n, new SeededRandomSource(seed));
        return Number.isInteger(result) && result >= 0 && result < n;
      }),
      { seed: FC_SEED },
    );
  });
});

describe('NFA-ZF-02 pick', () => {
  it('returns the item at the drawn index', () => {
    const items = ['a', 'b', 'c', 'd'];

    expect(pick(items, new ScriptedRandomSource([6]))).toBe('c');
  });

  it('throws a RangeError for an empty list', () => {
    expect(() => pick([], new ScriptedRandomSource([0]))).toThrow(RangeError);
  });

  it('always returns an item of the list (property)', () => {
    fc.assert(
      fc.property(fc.array(fc.string(), { minLength: 1 }), fc.integer(), (items, seed) =>
        items.includes(pick(items, new SeededRandomSource(seed))),
      ),
      { seed: FC_SEED },
    );
  });
});
