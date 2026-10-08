import { useSyncExternalStore } from 'react';

// Same breakpoint as `@media (width >= 48rem)` in the CSS modules: tablet and PC.
const WIDE_SCREEN_QUERY = '(width >= 48rem)';

function subscribe(onChange: () => void): () => void {
  const list = window.matchMedia(WIDE_SCREEN_QUERY);
  list.addEventListener('change', onChange);
  return () => {
    list.removeEventListener('change', onChange);
  };
}

function isWide(): boolean {
  return window.matchMedia(WIDE_SCREEN_QUERY).matches;
}

/**
 * True on tablets and PCs, false on phones. Only for differences CSS cannot make, such as a
 * longer button text on wide screens.
 */
export function useIsWideScreen(): boolean {
  return useSyncExternalStore(subscribe, isWide);
}
