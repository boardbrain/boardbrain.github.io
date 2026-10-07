import type { RandomSource } from '@/core/random';
import { assert } from '@/core/shared';

const BUFFER_SIZE = 256;

/**
 * The only production implementation of `RandomSource` (NFA-ZF-01, ADR-009): uses the
 * cryptographically secure generator of the platform and fetches values in batches.
 */
export class CryptoRandomSource implements RandomSource {
  private readonly buffer = new Uint32Array(BUFFER_SIZE);
  private index = BUFFER_SIZE;

  nextUint32(): number {
    if (this.index >= BUFFER_SIZE) {
      crypto.getRandomValues(this.buffer);
      this.index = 0;
    }
    const value = this.buffer[this.index];
    assert(value !== undefined, 'buffer index lies within the buffer');
    this.index += 1;
    return value;
  }
}
