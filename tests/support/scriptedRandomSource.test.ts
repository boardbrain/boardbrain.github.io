import { describe, expect, it } from 'vitest';
import { ScriptedRandomSource } from './scriptedRandomSource';

describe('NFA-ZF-03 ScriptedRandomSource', () => {
  it('returns the given words in order and counts them', () => {
    const rng = new ScriptedRandomSource([5, 0, 2 ** 32 - 1]);

    expect([rng.nextUint32(), rng.nextUint32(), rng.nextUint32()]).toEqual([5, 0, 2 ** 32 - 1]);
    expect(rng.consumed).toBe(3);
  });

  it('throws when the words are used up', () => {
    const rng = new ScriptedRandomSource([1]);
    rng.nextUint32();

    expect(() => rng.nextUint32()).toThrow('used up after 1 words');
  });

  it.each([-1, 1.5, 2 ** 32, Number.NaN])('rejects the word %s', (word) => {
    expect(() => new ScriptedRandomSource([word])).toThrow(RangeError);
  });
});
