import { useSyncExternalStore } from 'react';

// Same breakpoint as `@media (width >= 48rem)` in the CSS modules: tablet and PC.
const WIDE_SCREEN_QUERY = '(width >= 48rem)';
// Phones are at most about 450 px wide in portrait, tablets at least 600 px, also small ones
// like the iPad mini or the Galaxy Tab in portrait (compact window class below 600 px).
const TABLET_WIDTH_QUERY = '(width >= 37.5rem)';
// A mouse or trackpad; phones and tablets used by touch have a coarse pointer.
const FINE_POINTER_QUERY = '(pointer: fine)';

function createMediaHook(query: string): () => boolean {
  function subscribe(onChange: () => void): () => void {
    const list = window.matchMedia(query);
    list.addEventListener('change', onChange);
    return () => {
      list.removeEventListener('change', onChange);
    };
  }
  function matches(): boolean {
    return window.matchMedia(query).matches;
  }
  return () => useSyncExternalStore(subscribe, matches);
}

/**
 * True on tablets and PCs, false on phones. Only for differences CSS cannot make, such as a
 * longer button text on wide screens.
 */
export const useIsWideScreen = createMediaHook(WIDE_SCREEN_QUERY);

const useHasTabletWidth = createMediaHook(TABLET_WIDTH_QUERY);

/**
 * True on phones, false on tablets (also small ones in portrait) and PCs. Only phones fold the
 * card hand (design K-3).
 */
export function useIsPhone(): boolean {
  return !useHasTabletWidth();
}

/**
 * True with a mouse or trackpad. Search fields that open with a list are focused only then, so
 * the on-screen keyboard of a phone or tablet does not pop up unasked.
 */
export const useHasFinePointer = createMediaHook(FINE_POINTER_QUERY);
