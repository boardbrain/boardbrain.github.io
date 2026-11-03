import { aCatanSetup, CATAN_TEST_PERSONS } from '@tests/support/catanGeneration';
import { aSessionAfter } from '@tests/support/sessionFakes';
import { describe, expect, it } from 'vitest';
import { canOfferSkip, forwardAction, orderOrSeats, shownStepIndex } from './matchFlow';

// Base game with four persons: 3 draws, 3 spins of the order, 16 placement steps.
const BASE = aCatanSetup(4);
const ALL_STEPS = 22;
const REVERSED = [...CATAN_TEST_PERSONS].reverse();

describe('Design I2-C step shown in the flow', () => {
  it('shows nothing before the first step', () => {
    expect(shownStepIndex(aSessionAfter(BASE, 0))).toBeNull();
  });

  it('shows the step waiting for confirmation', () => {
    expect(shownStepIndex(aSessionAfter(BASE, 4, true))).toBe(4);
  });

  it('shows the newest step when none is waiting', () => {
    expect(shownStepIndex(aSessionAfter(BASE, 4))).toBe(3);
  });
});

describe('US-AB-02 forward button', () => {
  it('AK-1: draws the next step while steps are missing', () => {
    expect(forwardAction(aSessionAfter(BASE, 4, true))).toBe('draw');
  });

  it('AK-1: leads to the overview after the last step', () => {
    expect(forwardAction(aSessionAfter(BASE, ALL_STEPS - 1, true))).toBe('overview');
    expect(forwardAction(aSessionAfter(BASE, ALL_STEPS))).toBe('overview');
  });
});

describe('US-PL-05 skip the placement', () => {
  it('AK-1: is offered on the last spin of the order', () => {
    expect(canOfferSkip(aSessionAfter(BASE, 5, true))).toBe(true);
  });

  it('AK-1: is not offered before the order stands or after the first building', () => {
    expect(canOfferSkip(aSessionAfter(BASE, 4, true))).toBe(false);
    expect(canOfferSkip(aSessionAfter(BASE, 6, true))).toBe(false);
  });

  it('FA-LS-07: is not offered with an order set by hand', () => {
    const manual = aCatanSetup(4, { order: { mode: 'manual', order: REVERSED } });

    expect(canOfferSkip(aSessionAfter(manual, 3, true))).toBe(false);
  });
});

describe('FA-LS-07 order or seats', () => {
  it('uses the seats of the table while the order is open', () => {
    expect(orderOrSeats(aSessionAfter(BASE, 4))).toEqual(CATAN_TEST_PERSONS);
  });

  it('uses the drawn order once it stands', () => {
    const order = orderOrSeats(aSessionAfter(BASE, 6));

    expect([...order].sort()).toEqual([...CATAN_TEST_PERSONS].sort());
    expect(order).not.toEqual(orderOrSeats(aSessionAfter(BASE, 4)));
  });

  it('uses an order set by hand', () => {
    const manual = aCatanSetup(4, { order: { mode: 'manual', order: REVERSED } });

    expect(orderOrSeats(aSessionAfter(manual, 0))).toEqual(REVERSED);
  });

  it('uses the seats of the table without placement', () => {
    const none = aCatanSetup(4, { order: { mode: 'none' } });

    expect(orderOrSeats(aSessionAfter(none, 3))).toEqual(CATAN_TEST_PERSONS);
  });
});
