import { describe, expect, it } from 'vitest';
import { cardRotation, isCompactHand } from './cardHand';

describe('Design D-3 card hand', () => {
  it('fans two cards symmetrically by 9° per card', () => {
    expect([0, 1].map((index) => cardRotation(index, 2))).toEqual([-4.5, 4.5]);
  });

  it('keeps the middle card upright with an odd count', () => {
    expect([0, 1, 2, 3, 4].map((index) => cardRotation(index, 5))).toEqual([-18, -9, 0, 9, 18]);
  });

  it('gets narrower and flatter from six cards, so later areas still fit on a phone', () => {
    expect(isCompactHand(5)).toBe(false);
    expect(isCompactHand(6)).toBe(true);
    expect([0, 5].map((index) => cardRotation(index, 6))).toEqual([-15, 15]);
  });
});
