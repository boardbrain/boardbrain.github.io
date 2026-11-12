import { describe, expect, it } from 'vitest';
import { formatBytes, formatDate, formatDateTime, formatNumber } from './format';

describe('formatDate', () => {
  it('formats a timestamp as a German date with two-digit day and month', () => {
    expect(formatDate('2026-08-04T12:00:00.000Z')).toBe('04.08.2026');
  });
});

describe('K-9 formatDateTime', () => {
  it('formats a timestamp as a German date with time', () => {
    expect(formatDateTime('2026-11-12T20:07:00.000Z')).toMatch(/^12\.11\.2026, \d{2}:07$/);
  });
});

describe('K-9 formatNumber', () => {
  it('uses German separators and at most one decimal', () => {
    expect(formatNumber(60000)).toBe('60.000');
    expect(formatNumber(2.625)).toBe('2,6');
  });
});

describe('K-9 formatBytes', () => {
  it('picks a decimal unit', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2_100_000)).toBe('2,1 MB');
    expect(formatBytes(9_300_000_000)).toBe('9,3 GB');
  });
});
