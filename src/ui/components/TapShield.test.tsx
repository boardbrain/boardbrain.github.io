import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TapShield } from './TapShield';

describe('TapShield after a page opened (PO 22.11.2026, double tap)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('covers the page at first and is gone after 500 ms', () => {
    render(<TapShield />);
    expect(screen.getByTestId('tap-shield')).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(screen.getByTestId('tap-shield')).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByTestId('tap-shield')).toBeNull();
  });
});
