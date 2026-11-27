import { useEffect, useEffectEvent, useLayoutEffect, useRef, type RefObject } from 'react';
import { NavigationType } from 'react-router';

// How long a page that is still loading may take to grow tall enough to return to its place.
const RESTORE_TIMEOUT_MS = 1000;

/**
 * Every page starts at its top (PO 27.11.2026): the view area of the frame scrolls for all pages
 * alike, so without this a page opened from far down a list would open far down as well. Going
 * back returns to where the page was left, also when its content still loads. A change of the
 * address on the same page, such as a tab or a filter, keeps the place.
 */
export function usePageScroll(
  ref: RefObject<HTMLElement | null>,
  pathname: string,
  locationKey: string,
  navigationType: NavigationType,
): void {
  const places = useRef(new Map<string, number>());
  const currentKey = useRef(locationKey);

  // The scroll position of the view area (external system), remembered per entry of the history.
  useEffect(() => {
    const element = ref.current;
    if (element === null) {
      return undefined;
    }
    const remember = (): void => {
      places.current.set(currentKey.current, element.scrollTop);
    };
    element.addEventListener('scroll', remember, { passive: true });
    return () => {
      element.removeEventListener('scroll', remember);
    };
  }, [ref]);

  useLayoutEffect(() => {
    currentKey.current = locationKey;
  }, [locationKey]);

  const place = useEffectEvent((): (() => void) | undefined => {
    const element = ref.current;
    if (element === null) {
      return undefined;
    }
    const target =
      navigationType === NavigationType.Pop ? (places.current.get(currentKey.current) ?? 0) : 0;
    element.scrollTop = target;
    if (element.scrollTop >= target - 1) {
      return undefined;
    }
    // The page is still loading: try again each frame until it is tall enough, the person
    // scrolls themselves, or it takes too long.
    const start = performance.now();
    let frame = 0;
    const stop = (): void => {
      cancelAnimationFrame(frame);
      element.removeEventListener('pointerdown', stop);
      element.removeEventListener('wheel', stop);
    };
    const retry = (): void => {
      element.scrollTop = target;
      if (element.scrollTop >= target - 1 || performance.now() - start > RESTORE_TIMEOUT_MS) {
        stop();
        return;
      }
      frame = requestAnimationFrame(retry);
    };
    element.addEventListener('pointerdown', stop, { passive: true });
    element.addEventListener('wheel', stop, { passive: true });
    frame = requestAnimationFrame(retry);
    return stop;
  });

  // A new page, and only then: to the top, or back to its place (external system: the scroll
  // position).
  useLayoutEffect(() => place(), [pathname]);
}
