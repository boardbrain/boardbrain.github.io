import { describe, expect, it } from 'vitest';
import { formatDate } from './format';

describe('formatDate', () => {
  it('formats a timestamp as a German date with two-digit day and month', () => {
    expect(formatDate('2026-08-04T12:00:00.000Z')).toBe('04.08.2026');
  });
});
