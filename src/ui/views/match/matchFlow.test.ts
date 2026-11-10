import { aCatanSetup, CATAN_TEST_PERSONS } from '@tests/support/catanGeneration';
import { aSessionAfter } from '@tests/support/sessionFakes';
import { describe, expect, it } from 'vitest';
import type { StoredSession } from '@/app/ports';
import { repeatStep } from '@/core/generation';
import { CATAN_GENERATION, openCatanResources } from '@/games/catan';
import {
  areResourcesOpen,
  canOfferSkip,
  currentPage,
  followingSlot,
  forwardAction,
  isKeptView,
  isLookBack,
  isSameView,
  lookBackTarget,
  nextPage,
  orderOrSeats,
  pageAt,
  previousPage,
  progressIndex,
  sessionUpTo,
  shownRange,
  type FlowPage,
} from './matchFlow';

// Base game with four persons: 3 draws, 3 spins of the order, 16 placement steps.
const BASE = aCatanSetup(4);
const ALL_STEPS = 22;
const REVERSED = [...CATAN_TEST_PERSONS].reverse();
const WITH_RESOURCES = aCatanSetup(2, { startingResources: { count: 2, replacement: 'with' } });

const step = (index: number): FlowPage => ({ kind: 'step', index });

function repeated(session: StoredSession, index: number): StoredSession {
  const result = repeatStep(CATAN_GENERATION, session.setup, session.generation, index);
  if (!result.ok) throw new Error(result.error);
  return { ...session, generation: result.value };
}

// Eight confirmed steps, the second one repeated and drawn again: it waits for confirmation.
function aSessionAfterRepeat(): StoredSession {
  const before = aSessionAfter(BASE, 8);
  const again = repeated(before, 1);
  const record = before.generation.steps[1];
  if (record === undefined) throw new Error('step 1');
  const steps = [...again.generation.steps];
  steps.splice(1, 0, { ...record, status: 'revealed' });
  return { ...again, generation: { ...again.generation, steps } };
}

describe('US-AB-02 AK-3 pages of the flow', () => {
  it('E-35: starts with the first step without a result', () => {
    expect(currentPage(aSessionAfter(BASE, 0))).toEqual({
      kind: 'pending',
      slot: { kind: 'person-draw', draw: 'landscapes' },
      at: 0,
    });
  });

  it('shows the step waiting for confirmation', () => {
    expect(currentPage(aSessionAfter(BASE, 4, true))).toEqual(step(4));
  });

  it('E-35: after "Weiter" the next step waits without a result', () => {
    expect(currentPage(aSessionAfter(BASE, 4))).toMatchObject({
      kind: 'pending',
      slot: { kind: 'order-spin', position: 1 },
      at: 4,
    });
  });

  it('has no page once the match is running', () => {
    expect(currentPage(aSessionAfter(BASE, ALL_STEPS))).toBeNull();
  });
});

describe('US-AB-04 AK-3, AK-4 look back', () => {
  const session = aSessionAfter(BASE, 6, true);

  it('PO 10.11.: the order and the placement are looked back at as a whole', () => {
    // The third building waits for confirmation; the first two pieces belong to its page.
    const placing = aSessionAfter(BASE, 10, true);
    expect(shownRange(placing, 4)).toEqual({ start: 3, end: 5 });
    expect(pageAt(placing, 4)).toEqual(step(3));
    expect(pageAt(placing, 7)).toEqual(step(10));
    expect(previousPage(placing, step(10))).toEqual(step(3));
    expect(nextPage(placing, step(3))).toEqual(step(10));
    expect(progressIndex(placing, step(3))).toBe(5);
    // Before drawing the next piece, the pieces drawn so far belong to that page too.
    const waiting = aSessionAfter(BASE, 9);
    const next = currentPage(waiting);
    expect(next?.kind).toBe('pending');
    expect(next && previousPage(waiting, next)).toEqual(step(3));
    expect(pageAt(waiting, 7)).toEqual(next);
    expect(nextPage(waiting, step(3))).toEqual(next);
  });

  it('AK-3: an earlier step is shown with the note "Rückblick"', () => {
    expect(pageAt(session, 2)).toEqual(step(2));
    expect(isLookBack(session, step(2))).toBe(true);
    expect(isLookBack(session, step(6))).toBe(false);
  });

  it('shows the current page for the current step and for addresses that do not fit', () => {
    for (const lookBack of [null, 6, 7, -1, 1.5]) {
      expect(pageAt(session, lookBack)).toEqual(step(6));
    }
  });

  it('AK-3: "Zurück" goes one view back; the first view has none', () => {
    // From the first piece back to the whole order (steps 3 to 5), shown at its first spin.
    expect(previousPage(session, step(6))).toEqual(step(3));
    expect(previousPage(session, step(3))).toEqual(step(2));
    expect(previousPage(session, step(0))).toBeNull();
    const third = aSessionAfter(BASE, 3);
    const pending = currentPage(third);
    expect(pending && previousPage(third, pending)).toEqual(step(2));
    const empty = aSessionAfter(BASE, 0);
    const first = currentPage(empty);
    expect(first && previousPage(empty, first)).toBeNull();
  });

  it('AK-4: "Blättern" goes one view forward, at the end to the current page', () => {
    expect(forwardAction(session, step(2))).toBe('browse');
    expect(nextPage(session, step(2))).toEqual(step(3));
    expect(nextPage(session, step(3))).toEqual(step(6));
    const pending = aSessionAfter(BASE, 3);
    const page = currentPage(pending);
    expect(forwardAction(pending, step(2))).toBe('browse');
    expect(nextPage(pending, step(2))).toEqual(page);
    expect(page && nextPage(pending, page)).toBeNull();
  });

  it('AK-4: after repeating an earlier step, the later steps are browsed up to the newest', () => {
    const again = repeated(aSessionAfter(BASE, 8), 1);
    const page = currentPage(again);
    expect(page).toMatchObject({
      kind: 'pending',
      slot: { kind: 'person-draw', draw: 'harbors' },
      at: 1,
    });
    // Steps after the repeated one wait until it is drawn again.
    expect(pageAt(again, 4)).toEqual(page);
    expect(pageAt(again, 0)).toEqual(step(0));

    const drawn = aSessionAfterRepeat();
    expect(forwardAction(drawn, step(1))).toBe('browse');
    expect(isLookBack(drawn, step(1))).toBe(false);
    expect(isLookBack(drawn, step(4))).toBe(true);
    expect(isLookBack(drawn, step(7))).toBe(false);
    expect(nextPage(drawn, step(1))).toEqual(step(2));
    expect(nextPage(drawn, step(0))).toEqual(currentPage(drawn));
    expect(forwardAction(drawn, step(7))).toBe('draw');
  });

  it('PO 10.11.: kept views after a repetition are shown and passed as a whole', () => {
    // Steps 3 to 5 are the order, 6 and 7 the first pieces; step 1 was drawn again.
    const drawn = aSessionAfterRepeat();
    expect(shownRange(drawn, 4)).toEqual({ start: 3, end: 5 });
    expect(shownRange(drawn, 6)).toEqual({ start: 6, end: 7 });
    expect(shownRange(drawn, 2)).toEqual({ start: 2, end: 2 });
    expect(nextPage(drawn, step(2))).toEqual(step(3));
    expect(nextPage(drawn, step(3))).toEqual(step(6));
    expect(previousPage(drawn, step(6))).toEqual(step(3));
    expect(previousPage(drawn, step(3))).toEqual(step(2));
    expect(pageAt(drawn, 7)).toEqual(step(6));
    expect(isKeptView(drawn, step(6))).toBe(true);
    expect(isKeptView(drawn, step(1))).toBe(false);
    // The rest of the placement is missing: the board goes on with "Losen".
    expect(forwardAction(drawn, step(6))).toBe('draw');
    // Before the repeated step a look back works step by step as before.
    expect(shownRange(drawn, 0)).toEqual({ start: 0, end: 0 });
  });

  it('PO 10.11.: a repetition from the overview leads on to the overview, not back', () => {
    const before = aSessionAfter(BASE, ALL_STEPS);
    const again = repeated(before, 7);
    const record = before.generation.steps[7];
    if (record === undefined) throw new Error('step 7');
    const steps = [...again.generation.steps];
    steps.splice(7, 0, { ...record, status: 'revealed' });
    const drawn = { ...again, generation: { ...again.generation, steps } };

    // Road 0 drawn again: the whole board is shown, the kept pieces are not browsed one by one.
    expect(shownRange(drawn, 7)).toEqual({ start: 6, end: ALL_STEPS - 1 });
    expect(forwardAction(drawn, step(7))).toBe('overview');
    expect(lookBackTarget(drawn, step(5))).toBe('current');
    const harbours = aSessionAfter(BASE, ALL_STEPS);
    const harboursAgain = repeated(harbours, 1);
    const harboursSteps = [...harboursAgain.generation.steps];
    const harboursRecord = harbours.generation.steps[1];
    if (harboursRecord === undefined) throw new Error('step 1');
    harboursSteps.splice(1, 0, { ...harboursRecord, status: 'revealed' });
    const harboursDrawn = {
      ...harboursAgain,
      generation: { ...harboursAgain.generation, steps: harboursSteps },
    };
    expect(lookBackTarget(harboursDrawn, step(3))).toBe('overview');
    expect(lookBackTarget(aSessionAfterRepeat(), step(6))).toBe('current');
  });

  it('PO 10.11.: the kept pieces after a road drawn again belong to its page', () => {
    const before = aSessionAfter(BASE, ALL_STEPS);
    const again = repeated(before, 7);
    const record = before.generation.steps[7];
    if (record === undefined) throw new Error('step 7');
    const steps = [...again.generation.steps];
    steps.splice(7, 0, { ...record, status: 'revealed' });
    const drawn = { ...again, generation: { ...again.generation, steps } };

    // "Zurück" from a later page does not show the same board a second time.
    expect(shownRange(drawn, 12)).toEqual({ start: 6, end: ALL_STEPS - 1 });
    expect(pageAt(drawn, 12)).toEqual(step(7));
    expect(previousPage(drawn, step(7))).toEqual(step(3));
  });

  it('PO 10.11.: the progress counts every step a page shows', () => {
    const drawn = aSessionAfterRepeat();
    // The whole order after drawing again a draw of a person: 3/3, not 1/3.
    expect(progressIndex(drawn, step(3))).toBe(5);
    expect(progressIndex(drawn, step(6))).toBe(7);
    expect(progressIndex(drawn, step(0))).toBe(0);

    // A road drawn again from the overview: before "Losen" the board shows the kept pieces too.
    const before = aSessionAfter(BASE, ALL_STEPS);
    const again = repeated(before, 7);
    const pending = currentPage(again);
    expect(pending?.kind).toBe('pending');
    expect(pending && progressIndex(again, pending)).toBe(ALL_STEPS - 2);
    expect(
      progressIndex(aSessionAfter(BASE, 3), {
        kind: 'pending',
        slot: { kind: 'order-spin', position: 0 },
        at: 3,
      }),
    ).toBe(2);
  });
});

describe('US-AB-02 AK-1 forward button', () => {
  it('E-35: draws on a page without a result', () => {
    const session = aSessionAfter(BASE, 3);
    const page = currentPage(session);
    expect(page && forwardAction(session, page)).toBe('draw');
  });

  it('E-35: draws the next step of the same view, otherwise leads to the next view', () => {
    // A draw of a person has a view of its own; the spins of the order share one.
    expect(forwardAction(aSessionAfter(BASE, 0, true), step(0))).toBe('next');
    expect(forwardAction(aSessionAfter(BASE, 3, true), step(3))).toBe('draw');
    expect(forwardAction(aSessionAfter(BASE, 5, true), step(5))).toBe('next');
    expect(forwardAction(aSessionAfter(BASE, 6, true), step(6))).toBe('draw');
  });

  it('AK-1: leads to the overview after the last step', () => {
    expect(forwardAction(aSessionAfter(BASE, ALL_STEPS - 1, true), step(ALL_STEPS - 1))).toBe(
      'overview',
    );
  });

  it('US-SR-01 AK-6: turns over the starting resources first, then goes on', () => {
    const drawn = aSessionAfter(WITH_RESOURCES, 12, true);
    const record = drawn.generation.steps[12]?.step;
    if (record?.kind !== 'starting-resources') throw new Error('resources');
    expect(areResourcesOpen(drawn, 12)).toBe(false);
    expect(forwardAction(drawn, step(12))).toBe('turn-all');

    const half = {
      ...drawn,
      generation: openCatanResources(drawn.generation, record.personId, [1]),
    };
    expect(forwardAction(half, step(12))).toBe('turn-all');
    const open = {
      ...drawn,
      generation: openCatanResources(drawn.generation, record.personId, [0, 1]),
    };
    expect(areResourcesOpen(open, 12)).toBe(true);
    expect(forwardAction(open, step(12))).toBe('next');
    expect(areResourcesOpen(open, 0)).toBe(true);
  });
});

// Two persons with starting resources, all 14 steps confirmed; the order (step 3) repeated and
// drawn again, then `drawn` more steps of the placement drawn again, the last one waiting.
function aSessionAfterRepeatedOrder(drawn: number): StoredSession {
  const before = aSessionAfter(WITH_RESOURCES, 14);
  const again = repeated(before, 3);
  const steps = [...again.generation.steps];
  for (let index = 3; index <= 3 + drawn; index++) {
    const record = before.generation.steps[index];
    if (record === undefined) throw new Error(`step ${String(index)}`);
    steps.splice(index, 0, { ...record, status: index === 3 + drawn ? 'revealed' : 'confirmed' });
  }
  return { ...again, generation: { ...again.generation, steps } };
}

describe('US-AB-03 AK-6 repeating the order before drawn starting resources', () => {
  it('PO 10.11.: the new order leads to the placement, not into the starting resources', () => {
    const session = aSessionAfterRepeatedOrder(0);
    expect(session.generation.steps[4]?.step.kind).toBe('starting-resources');
    expect(forwardAction(session, step(3))).toBe('next');
    expect(followingSlot(session, 3)).toMatchObject({ kind: 'building', index: 0 });
  });

  it('PO 10.11.: each piece drawn again announces and draws the next piece', () => {
    const session = aSessionAfterRepeatedOrder(1);
    expect(session.generation.steps[5]?.step.kind).toBe('starting-resources');
    expect(forwardAction(session, step(4))).toBe('draw');
    expect(followingSlot(session, 4)).toMatchObject({ kind: 'road', index: 0 });
  });

  it('after the last piece the starting resources drawn already are browsed', () => {
    const session = aSessionAfterRepeatedOrder(8);
    expect(session.generation.steps[12]?.step.kind).toBe('starting-resources');
    expect(forwardAction(session, step(11))).toBe('browse');
    expect(nextPage(session, step(11))).toEqual(step(12));
  });
});

describe('E-35 views of the flow', () => {
  it('shares a view between the spins and between the pieces only', () => {
    expect(isSameView('order-spin', 'order-spin')).toBe(true);
    expect(isSameView('building', 'road')).toBe(true);
    expect(isSameView('road', 'building')).toBe(true);
    expect(isSameView('person-draw', 'person-draw')).toBe(false);
    expect(isSameView('starting-resources', 'starting-resources')).toBe(false);
    expect(isSameView('order-spin', 'building')).toBe(false);
  });

  it('N1: the band of the placement announces the following piece', () => {
    const session = aSessionAfter(BASE, 8, true);
    expect(followingSlot(session, 8)).toMatchObject({ kind: 'road', index: 1 });
    expect(followingSlot(session, 7)).toMatchObject({ kind: 'building', index: 1 });
    expect(followingSlot(session, 6)).toMatchObject({ kind: 'road', index: 0 });
    expect(followingSlot(aSessionAfter(BASE, ALL_STEPS - 1, true), ALL_STEPS - 1)).toBeNull();
  });

  it('look back: shows the match as it was right after the step', () => {
    const session = aSessionAfter(BASE, 8, true);
    expect(sessionUpTo(session, 2).generation.steps).toEqual(session.generation.steps.slice(0, 3));
  });
});

describe('US-PL-05 skip the placement', () => {
  it('AK-1: is offered on the empty board before the first building', () => {
    const session = aSessionAfter(BASE, 6);
    const page = currentPage(session);
    expect(page && canOfferSkip(session, page)).toBe(true);
  });

  it('is not offered on the last spin or once a building is placed', () => {
    expect(canOfferSkip(aSessionAfter(BASE, 5, true), step(5))).toBe(false);
    const placed = aSessionAfter(BASE, 7);
    const page = currentPage(placed);
    expect(page && canOfferSkip(placed, page)).toBe(false);
  });

  it('FA-LS-07: is not offered for an order set by hand', () => {
    const manual = aCatanSetup(4, { order: { mode: 'manual', order: REVERSED } });
    const session = aSessionAfter(manual, 3);
    const page = currentPage(session);
    expect(page && canOfferSkip(session, page)).toBe(false);
  });
});

describe('US-SR-01 AK-1 order of the starting resources', () => {
  it('follows the drawn order, before it the seats', () => {
    const setup = aCatanSetup(4, { startingResources: { count: 1, replacement: 'with' } });
    expect(orderOrSeats(aSessionAfter(setup, 2))).toEqual(CATAN_TEST_PERSONS);
    expect(orderOrSeats(aSessionAfter(setup, 6))).toHaveLength(4);
  });

  it('FA-LS-07: follows an order set by hand', () => {
    const manual = aCatanSetup(4, { order: { mode: 'manual', order: REVERSED } });
    expect(orderOrSeats(aSessionAfter(manual, 0))).toEqual(REVERSED);
  });
});
