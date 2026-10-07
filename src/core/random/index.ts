/**
 * Public interface of the module `core/random`: random source `RandomSource`, unbiased integers and picking from lists (NFA-ZF-01 to -03).
 *
 * Other modules import only through this file (Architecture 4.3).
 */
export type { RandomSource } from './randomSource';
export { pick, uniformInt } from './uniform';
