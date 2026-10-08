import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useHasFinePointer, useIsWideScreen } from './mediaQueries';

const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');

// Media queries whose results the test changes, like turning a tablet or plugging in a mouse.
function fakeMatchMedia(): { setMatching: (query: string, isMatching: boolean) => void } {
  const matching = new Set<string>();
  const listeners = new Set<() => void>();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      get matches() {
        return matching.has(query);
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
    setMatching: (query, isMatching) => {
      if (isMatching) {
        matching.add(query);
      } else {
        matching.delete(query);
      }
      listeners.forEach((listener) => {
        listener();
      });
    },
  };
}

describe('media query hooks', () => {
  afterEach(() => {
    if (originalMatchMedia !== undefined) {
      Object.defineProperty(window, 'matchMedia', originalMatchMedia);
    }
  });

  it('useIsWideScreen follows the width breakpoint', () => {
    const media = fakeMatchMedia();
    const { result } = renderHook(() => useIsWideScreen());
    expect(result.current).toBe(false);

    act(() => {
      media.setMatching('(width >= 48rem)', true);
    });

    expect(result.current).toBe(true);
  });

  it('useHasFinePointer is true only with a mouse or trackpad', () => {
    const media = fakeMatchMedia();
    const { result } = renderHook(() => useHasFinePointer());
    expect(result.current).toBe(false);

    act(() => {
      media.setMatching('(pointer: fine)', true);
    });

    expect(result.current).toBe(true);
  });
});
