import type { RandomSource } from '@/core/random';

const UINT32_RANGE = 2 ** 32;

/**
 * Random source that returns a given sequence of words, to create specific cases in tests
 * (Architecture 14.2, NFA-ZF-03). Throws when the sequence is used up, so a test notices
 * when the code draws more often than expected. Never use in production code.
 */
export class ScriptedRandomSource implements RandomSource {
  private readonly words: readonly number[];
  private index = 0;

  constructor(words: readonly number[]) {
    const invalid = words.find(
      (word) => !Number.isInteger(word) || word < 0 || word >= UINT32_RANGE,
    );
    if (invalid !== undefined) {
      throw new RangeError(`Scripted word ${String(invalid)} is not an unsigned 32-bit integer`);
    }
    this.words = [...words];
  }

  /** Number of words drawn so far. */
  get consumed(): number {
    return this.index;
  }

  nextUint32(): number {
    const word = this.words[this.index];
    if (word === undefined) {
      throw new Error(`Scripted random source used up after ${String(this.index)} words`);
    }
    this.index += 1;
    return word;
  }
}
