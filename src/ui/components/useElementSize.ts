import { useEffect, useState, type RefObject } from 'react';

/**
 * Size of an element in CSS pixels.
 */
export type ElementSize = { readonly width: number; readonly height: number };

/**
 * The size of the element in `ref`, updated whenever it changes (ResizeObserver, an external
 * system); `null` until it was measured. For layouts that place their parts in pixels, such as
 * the card table of a match (design I2-D).
 */
export function useElementSize(ref: RefObject<HTMLElement | null>): ElementSize | null {
  const [size, setSize] = useState<ElementSize | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (element === null) {
      return undefined;
    }
    const measure = (): void => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      setSize((before) =>
        before !== null && before.width === width && before.height === height
          ? before
          : { width, height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [ref]);
  return size;
}
