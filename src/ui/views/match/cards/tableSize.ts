import type { ElementSize } from '@/ui/components/useElementSize';

// Before the first measurement, and where nothing is laid out (component tests), the card table
// is assumed to have the size of a phone; the browser measures it at once.
const FALLBACK: ElementSize = { width: 356, height: 476 };

/**
 * The size of the card table for the layout (design I2-D): the measured size, or the size of a
 * phone before it was measured.
 */
export function tableSize(measured: ElementSize | null): ElementSize {
  return measured === null || measured.width === 0 ? FALLBACK : measured;
}
