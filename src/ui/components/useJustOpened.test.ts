import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useJustOpened } from './useJustOpened';

describe('useJustOpened (PO 22.11.2026, double tap)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is true at first and false after 500 ms', () => {
    const { result } = renderHook(() => useJustOpened());
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(false);
  });
});
