import { describe, expect, it } from 'vitest';
import { formatDate, formatQuotedList } from './format';

describe('formatDate', () => {
  it('formats a timestamp as a German date with two-digit day and month', () => {
    expect(formatDate('2026-08-04T12:00:00.000Z')).toBe('04.08.2026');
  });
});

describe('formatQuotedList', () => {
  it.each([
    [[], ''],
    [['Freitagsrunde'], '„Freitagsrunde“'],
    [['A', 'B'], '„A“ und „B“'],
    [['A', 'B', 'C'], '„A“, „B“ und „C“'],
  ])('quotes %j as %j', (names, expected) => {
    expect(formatQuotedList(names)).toBe(expected);
  });
});
