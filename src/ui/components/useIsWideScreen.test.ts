import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useIsWideScreen } from './useIsWideScreen';

const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');

// A media query whose result the test changes, like turning a tablet.
function fakeMatchMedia(isInitiallyWide: boolean): { setWide: (isWide: boolean) => void } {
  let isWideNow = isInitiallyWide;
  const listeners = new Set<() => void>();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({
      get matches() {
        return isWideNow;
      },
      addEventListener: (_type: string, listener: () => void) => {
        listeners.add(listener);
      },
      removeEventListener: (_type: string, listener: () => void) => {
        listeners.delete(listener);
      },
    }),
  });
  return {
    setWide: (isWide) => {
      isWideNow = isWide;
      listeners.forEach((listener) => {
        listener();
      });
    },
  };
}

describe('useIsWideScreen', () => {
  afterEach(() => {
    if (originalMatchMedia !== undefined) {
      Object.defineProperty(window, 'matchMedia', originalMatchMedia);
    }
  });

  it('follows the media query when the screen size changes', () => {
    const media = fakeMatchMedia(false);
    const { result } = renderHook(() => useIsWideScreen());
    expect(result.current).toBe(false);

    act(() => {
      media.setWide(true);
    });

    expect(result.current).toBe(true);
  });
});
