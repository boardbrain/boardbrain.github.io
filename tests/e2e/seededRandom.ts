import type { Page } from '@playwright/test';

/**
 * Makes the randomness of the app repeatable (decision of the product owner in I2-C, variant
 * A): before the app loads, `crypto.getRandomValues` is replaced by a generator with a fixed
 * seed (Mulberry32), so every run draws the same steps. Only in end-to-end tests; the
 * production build stays unchanged, real randomness is checked in tests/statistical.
 * `crypto.randomUUID` keeps working as before.
 */
export async function useSeededRandom(page: Page, seed: number): Promise<void> {
  await page.addInitScript((start: number) => {
    let state = start >>> 0;
    const nextUint32 = (): number => {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return (value ^ (value >>> 14)) >>> 0;
    };
    const seeded = <T extends ArrayBufferView | null>(array: T): T => {
      if (array !== null) {
        const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
        for (let index = 0; index < bytes.length; index += 4) {
          const value = nextUint32();
          for (let byte = 0; byte < 4 && index + byte < bytes.length; byte++) {
            bytes[index + byte] = (value >>> (8 * byte)) & 0xff;
          }
        }
      }
      return array;
    };
    Object.defineProperty(crypto, 'getRandomValues', { value: seeded, configurable: true });
  }, seed);
}
