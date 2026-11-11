import { SeededRandomSource } from '@tests/support/seededRandomSource';
import { describe, expect, it } from 'vitest';
import { drawLayout, orderLayout, resourcesLayout } from './cardLayout';
import {
  labelTarget,
  orderKey,
  placeTarget,
  planDraw,
  planOrder,
  planResources,
  poseOn,
  STAGE_MS,
  WHO_AFTER,
  WHO_BEFORE,
  type StagePlan,
  type StageStep,
} from './stagePlan';

const PHONE = { width: 356, height: 476 };
const PERSONS = ['anna', 'ben', 'clara', 'david'];

function drawPlan(result: string, seed = 3): StagePlan {
  const layout = drawLayout(PHONE.width, PHONE.height);
  return planDraw({
    persons: PERSONS,
    result,
    rowBefore: layout.row(PERSONS.length),
    rowAfter: layout.row(PERSONS.length - 1),
    slot: layout.slot,
    rng: new SeededRandomSource(seed),
  });
}

// Where every card ends and what it shows then.
function endOf(plan: StagePlan): Map<string, { x: number; y: number; front: string }> {
  const ends = new Map<string, { x: number; y: number; front: string }>();
  for (const card of plan.cards) {
    const moves = plan.steps.filter(
      (step): step is Extract<StageStep, { kind: 'move' }> =>
        step.kind === 'move' && step.card === card.id,
    );
    const last = moves.sort((a, b) => a.at + a.ms - (b.at + b.ms)).at(-1);
    const flips = plan.steps.filter(
      (step): step is Extract<StageStep, { kind: 'flip' }> =>
        step.kind === 'flip' && step.card === card.id,
    );
    const lastFlip = flips.sort((a, b) => a.at - b.at).at(-1);
    const pose = last?.to ?? card.start;
    ends.set(card.id, {
      x: Math.round(pose.x),
      y: Math.round(pose.y),
      front: lastFlip === undefined || lastFlip.toFaceDown ? '' : lastFlip.front,
    });
  }
  return ends;
}

describe('US-IN-01 AK-2 Draw a person with cards (design I2-E)', () => {
  it('the card on the place shows the person drawn; the others lie in the row in their order', () => {
    const layout = drawLayout(PHONE.width, PHONE.height);
    const ends = [...endOf(drawPlan('clara')).values()];
    const slot = poseOn(layout.slot, layout.slot.w, layout.slot.h);

    expect(
      ends.filter((end) => end.x === Math.round(slot.x) && end.y === Math.round(slot.y)),
    ).toEqual([{ x: Math.round(slot.x), y: Math.round(slot.y), front: 'clara' }]);
    const row = layout.row(3).map((box) => [Math.round(box.x), Math.round(box.y)]);
    const inRow = ends
      .filter((end) => end.front !== 'clara')
      .sort((a, b) => a.x - b.x)
      .map((end) => [end.x, end.y, end.front]);
    expect(inRow).toEqual(row.map(([x, y], index) => [x, y, ['anna', 'ben', 'david'][index]]));
  });

  it('PO: the movement reveals nothing, it is the same for every result', () => {
    // Only which front shows when a card turns face up depends on the result.
    const movements = (result: string): StageStep[] =>
      drawPlan(result).steps.map((step) => (step.kind === 'flip' ? { ...step, front: '' } : step));

    for (const result of PERSONS.slice(1)) {
      expect(movements(result)).toEqual(movements('anna'));
    }
  });

  it('turns all cards face down one after another and mixes three times, left and right alternately', () => {
    const plan = drawPlan('ben');
    const downs = plan.steps.filter((step) => step.kind === 'flip' && step.toFaceDown);
    expect(downs.map((step) => [step.at, step.ms])).toEqual([
      [0, 360],
      [70, 360],
      [140, 360],
      [210, 360],
    ]);
    const mixesOut = plan.steps.filter(
      (step) => step.kind === 'move' && step.ms === STAGE_MS.mixOut && step.to.rotate !== 0,
    );
    expect(mixesOut.map((step) => (step.kind === 'move' ? step.to.rotate : 0))).toEqual([
      -9, 9, -9,
    ]);
  });

  it('flies onto the place in an arc, then "Wer?" gives way to the name', () => {
    const plan = drawPlan('ben');
    const fly = plan.steps.find((step) => step.kind === 'move' && step.ms === STAGE_MS.fly);
    expect(fly).toMatchObject({ lift: -30, z: 50 });
    const fades = plan.steps.filter(
      (step): step is Extract<StageStep, { kind: 'fade' }> => step.kind === 'fade',
    );
    expect(fades.map((step) => step.target)).toEqual([placeTarget(0), WHO_BEFORE, WHO_AFTER]);
    const whoAfter = fades[2];
    expect(whoAfter).toMatchObject({ ms: 300, from: 0, to: 1, rise: 6 });
    expect(plan.duration).toBeGreaterThan((fly?.at ?? 0) + STAGE_MS.fly);
  });

  it('the others turn face up only after the name is shown, so they give nothing away early', () => {
    const plan = drawPlan('david');
    const whoIn = plan.steps.find((step) => step.kind === 'fade' && step.target === WHO_AFTER);
    const ups = plan.steps.filter((step) => step.kind === 'flip' && !step.toFaceDown);
    const first = Math.min(...ups.map((step) => step.at));
    const drawnUp = ups.find((step) => step.at === first);
    const othersUp = ups.filter((step) => step !== drawnUp);

    expect(othersUp).toHaveLength(3);
    expect(Math.min(...othersUp.map((step) => step.at))).toBeGreaterThanOrEqual(
      (whoIn?.at ?? 0) + (whoIn?.ms ?? 0),
    );
  });
});

function orderPlan(
  mode: 'deal' | 'turn' | 'regather',
  placed: string[],
  result: string,
  last: string | null = null,
): StagePlan {
  const layout = orderLayout(PHONE.width, PHONE.height, PERSONS.length);
  return planOrder({
    persons: PERSONS,
    placed,
    result,
    last,
    slots: layout.slots,
    row: layout.row(PERSONS.length),
    mode,
    rng: new SeededRandomSource(5),
  });
}

const moves = (plan: StagePlan): Extract<StageStep, { kind: 'move' }>[] =>
  plan.steps.filter((step): step is Extract<StageStep, { kind: 'move' }> => step.kind === 'move');

describe('US-IN-01 AK-3 Order with cards (design I2-E)', () => {
  it('the first "Losen" deals every card face down onto the places and turns place 1 over', () => {
    const plan = orderPlan('deal', [], 'clara');
    const layout = orderLayout(PHONE.width, PHONE.height, PERSONS.length);
    const deals = moves(plan).filter((step) => step.ms === STAGE_MS.deal);

    expect(deals.map((step) => Math.round(step.to.x))).toEqual(
      layout.slots.map((slot) => Math.round(slot.x)),
    );
    const ups = plan.steps.filter((step) => step.kind === 'flip' && !step.toFaceDown);
    expect(ups).toMatchObject([{ front: orderKey('clara', 0) }]);
    expect(plan.steps.filter((step) => step.kind === 'raise')).toMatchObject([{ isUp: true }]);
  });

  it('a further "Losen" only turns the next place over; the card before sinks', () => {
    const plan = orderPlan('turn', ['clara'], 'ben');

    expect(moves(plan)).toEqual([]);
    expect(plan.steps.filter((step) => step.kind === 'raise')).toMatchObject([
      { card: 'card-0', isUp: false },
      { card: 'card-1', isUp: true },
    ]);
    expect(plan.steps.filter((step) => step.kind === 'flip')).toMatchObject([
      { card: 'card-1', toFaceDown: false, front: orderKey('ben', 1) },
    ]);
  });

  it('FA-LS-02: the last place follows by itself, then the order lies level', () => {
    const plan = orderPlan('turn', ['clara', 'ben'], 'anna', 'david');
    const flips = plan.steps.filter((step) => step.kind === 'flip');

    expect(flips).toMatchObject([
      { card: 'card-2', front: orderKey('anna', 2) },
      { card: 'card-3', front: orderKey('david', 3) },
    ]);
    expect((flips[1]?.at ?? 0) - ((flips[0]?.at ?? 0) + STAGE_MS.flipUp)).toBe(STAGE_MS.lastDelay);
    expect(plan.steps.filter((step) => step.kind === 'raise').at(-1)).toMatchObject({
      card: 'card-2',
      isUp: false,
    });
  });

  it('E1: after repeating from place 2 the face-down cards are collected, mixed and dealt again', () => {
    const plan = orderPlan('regather', ['clara'], 'david');
    const collected = moves(plan).filter((step) => step.ms === STAGE_MS.collect);
    const dealt = moves(plan).filter((step) => step.ms === STAGE_MS.deal);

    expect(collected.map((step) => step.card)).toEqual(['card-1', 'card-2', 'card-3']);
    expect(dealt).toHaveLength(3);
    expect(moves(plan).some((step) => step.card === 'card-0')).toBe(false);
  });

  it('PO: the movement of the order is the same for every person drawn', () => {
    const movements = (result: string): StageStep[] =>
      orderPlan('deal', [], result).steps.map((step) =>
        step.kind === 'flip' ? { ...step, front: '' } : step,
      );

    expect(movements('ben')).toEqual(movements('anna'));
  });
});

function resourcesPlan(isFirst: boolean, isWithReplacement: boolean, stackBefore = 5): StagePlan {
  const layout = resourcesLayout(PHONE.width, PHONE.height, 3);
  return planResources({
    kinds: isFirst ? ['wood', 'brick', 'wool', 'grain', 'ore'] : null,
    kindBoxes: layout.kinds,
    stack: layout.stack,
    stackBefore,
    slots: layout.slots,
    isWithReplacement,
    rng: new SeededRandomSource(9),
  });
}

describe('US-SR-01 Starting resources with cards (design I2-E)', () => {
  it('before the first person the five kinds turn face down and gather into the stack', () => {
    const plan = resourcesPlan(true, false);

    expect(plan.steps.filter((step) => step.kind === 'flip' && step.toFaceDown)).toHaveLength(5);
    expect(plan.cards).toHaveLength(5);
  });

  it('deals one card onto each place, face down, and shows "Antippen" below it', () => {
    const layout = resourcesLayout(PHONE.width, PHONE.height, 3);
    const plan = resourcesPlan(true, false);
    const deals = moves(plan).filter((step) => step.ms === STAGE_MS.dealResource);

    expect(deals).toHaveLength(3);
    expect(deals.map((step) => step.to.scale)).toEqual(
      layout.slots.map((slot) => slot.w / (layout.kinds[0]?.w ?? 1)),
    );
    expect(plan.steps.filter((step) => step.kind === 'flip' && !step.toFaceDown)).toEqual([]);
    expect(
      plan.steps.filter((step) => step.kind === 'fade' && step.target === labelTarget(2)),
    ).toHaveLength(1);
  });

  it('FA-SR-02: with replacement a card flies back onto the stack after each card dealt', () => {
    const plan = resourcesPlan(false, true);

    expect(plan.cards).toHaveLength(5 + 3);
    expect(moves(plan).filter((step) => step.ms === STAGE_MS.putBack)).toHaveLength(3);
  });

  it('FA-SR-03: without replacement the cards of the person before go back onto the stack first', () => {
    const plan = resourcesPlan(false, false, 2);
    const putBacks = moves(plan).filter((step) => step.ms === STAGE_MS.putBack);
    const firstDeal = moves(plan).find((step) => step.ms === STAGE_MS.dealResource);

    expect(putBacks).toHaveLength(3);
    expect(Math.max(...putBacks.map((step) => step.at + step.ms))).toBeLessThanOrEqual(
      firstDeal?.at ?? 0,
    );
  });
});
