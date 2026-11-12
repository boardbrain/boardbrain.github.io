import type { RandomSource } from '@/core/random';

type State = [number, number, number, number];

const rotateLeft = (value: number, shift: number): number =>
  ((value << shift) | (value >>> (32 - shift))) >>> 0;

/**
 * SplitMix32 step: spreads a seed over well-mixed 32-bit words for the initial state.
 */
function splitMix32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x9e3779b9) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
    return (z ^ (z >>> 15)) >>> 0;
  };
}

/**
 * Deterministic random source with a seed for reproducible tests (Architecture 14.2,
 * NFA-ZF-03): xoshiro128** by Blackman and Vigna. Never use in production code.
 */
export class SeededRandomSource implements RandomSource {
  private readonly state: State;

  constructor(seed: number) {
    const next = splitMix32(seed);
    this.state = [next(), next(), next(), next()];
  }

  /**
   * Source with an explicit internal state; only for comparing against reference values.
   */
  static fromState(state: Readonly<State>): SeededRandomSource {
    if (state.every((word) => word === 0)) {
      throw new RangeError('xoshiro128** needs a state that is not all zero');
    }
    const source = new SeededRandomSource(0);
    source.state.splice(0, 4, ...state.map((word) => word >>> 0));
    return source;
  }

  nextUint32(): number {
    const s = this.state;
    const result = Math.imul(rotateLeft(Math.imul(s[1], 5), 7), 9) >>> 0;
    const t = (s[1] << 9) >>> 0;
    s[2] = (s[2] ^ s[0]) >>> 0;
    s[3] = (s[3] ^ s[1]) >>> 0;
    s[1] = (s[1] ^ s[2]) >>> 0;
    s[0] = (s[0] ^ s[3]) >>> 0;
    s[2] = (s[2] ^ t) >>> 0;
    s[3] = rotateLeft(s[3], 11);
    return result;
  }
}
