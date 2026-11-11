import { describe, expect, it } from 'vitest';
import { dialogPlace } from './dialogPlace';

const PHONE = { width: 390, height: 800 };
const WIDE = { width: 1180, height: 760 };
const DIALOG = { width: 358, height: 230 };

describe('US-AB-03 AK-8 the question about a piece gives way to it (design I2-H, R7)', () => {
  it('stands at the bottom on a phone when nothing is covered there', () => {
    expect(dialogPlace(PHONE, DIALOG, [{ x: 200, y: 300 }])).toBe('bottom');
  });

  it('moves to the top when it would cover more marked pieces at the bottom', () => {
    expect(
      dialogPlace(PHONE, DIALOG, [
        { x: 200, y: 650 },
        { x: 150, y: 100 },
        { x: 180, y: 700 },
      ]),
    ).toBe('top');
  });

  it('keeps the bottom on a tie, e.g. on a small phone without free room', () => {
    expect(
      dialogPlace(PHONE, DIALOG, [
        { x: 200, y: 650 },
        { x: 150, y: 100 },
      ]),
    ).toBe('bottom');
    expect(dialogPlace(PHONE, DIALOG, [])).toBe('bottom');
  });

  it('stands beside the board on a wide screen, where it covers less', () => {
    expect(dialogPlace(WIDE, DIALOG, [{ x: 600, y: 380 }])).toBe('left');
    expect(dialogPlace(WIDE, DIALOG, [{ x: 100, y: 380 }])).toBe('right');
  });

  it('a tablet in portrait counts as narrow', () => {
    expect(dialogPlace({ width: 780, height: 1020 }, DIALOG, [{ x: 390, y: 300 }])).toBe('bottom');
  });
});
