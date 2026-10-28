import { describe, expect, it } from 'vitest';
import {
  CARD_HEIGHT,
  cardPose,
  cardRotation,
  foldedIconTop,
  handState,
  isCompactHand,
  isHandFolded,
} from './cardHand';

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

describe('Design K-3 folded card hand', () => {
  it('is fanned out on a phone only on the start view', () => {
    expect(isHandFolded('/', true)).toBe(false);
    expect(
      ['/verwaltung', '/verwaltung/personen/abc', '/brett', '/diagnose'].map((path) =>
        isHandFolded(path, true),
      ),
    ).toEqual([true, true, true, true]);
  });

  it('stays fanned out on tablets and PCs', () => {
    expect(
      ['/', '/verwaltung', '/verwaltung/personen/abc'].map((path) => isHandFolded(path, false)),
    ).toEqual([false, false, false]);
  });

  it('opens by a long press only where it is folded', () => {
    expect(handState('/', true, true)).toBe('fanned');
    expect(handState('/verwaltung', false, true)).toBe('fanned');
    expect(handState('/verwaltung', true, false)).toBe('folded');
    expect(handState('/verwaltung', true, true)).toBe('open');
  });

  it('keeps the poses of design D-3 when fanned or opened', () => {
    expect(cardPose(0, 2, false, 'fanned')).toEqual({ rotate: -4.5, y: 16 });
    expect(cardPose(1, 2, true, 'open')).toEqual({ rotate: 4.5, y: 4 });
  });

  it('folds into a flat arc of 3° per card; the active card shows 30 px, the others 25 px', () => {
    const poses = [0, 1, 2, 3, 4].map((index) => cardPose(index, 5, index === 1, 'folded'));

    expect(poses.map(({ rotate }) => rotate)).toEqual([-6, -3, 0, 3, 6]);
    expect(poses.map(({ y }) => CARD_HEIGHT - y)).toEqual([25, 30, 25, 25, 25]);
  });

  it('centres the small symbol in the visible part, a little higher on turned cards', () => {
    expect(foldedIconTop(1, 3, true, 16)).toBe(7);
    expect(foldedIconTop(1, 3, false, 16)).toBe(4.5);
    expect(foldedIconTop(0, 5, false, 16)).toBeLessThan(4.5);
    expect(foldedIconTop(0, 5, false, 16)).toBeGreaterThanOrEqual(1);
  });

  it('never moves the small symbol above the card', () => {
    expect(foldedIconTop(0, 2, false, 40)).toBe(1);
  });
});
