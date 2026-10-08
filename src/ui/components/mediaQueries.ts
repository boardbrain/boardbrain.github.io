import { useSyncExternalStore } from 'react';

// Same breakpoint as `@media (width >= 48rem)` in the CSS modules: tablet and PC.
const WIDE_SCREEN_QUERY = '(width >= 48rem)';
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

/**
 * True with a mouse or trackpad. Search fields that open with a list are focused only then, so
 * the on-screen keyboard of a phone or tablet does not pop up unasked.
 */
export const useHasFinePointer = createMediaHook(FINE_POINTER_QUERY);
