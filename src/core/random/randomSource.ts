/**
 * The single source of randomness (NFA-ZF-03). Production code has exactly one
 * implementation backed by the cryptographically secure generator of the platform
 * (NFA-ZF-01); deterministic sources exist only in `tests/support`.
 */
export type RandomSource = {
  /** Uniformly distributed integer from 0 to 2^32 − 1. */
  nextUint32(): number;
};
