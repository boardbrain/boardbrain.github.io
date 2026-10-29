import {
  confirmStep,
  drawNextStep,
  repeatStep,
  startGeneration,
  stepsDiscardedBy,
} from '@/core/generation';
import { InvariantError } from '@/core/shared';
import {
  aCatanSetup,
  CATAN_TEST_PERSONS,
  runCatanGeneration,
} from '@tests/support/catanGeneration';
import { defined } from '@tests/support/defined';
import { SeededRandomSource } from '@tests/support/seededRandomSource';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { CATAN_BOARD } from '../board/board';
import { RetryOnDeadEnd, type BuildingPlanner, type PlanInput } from '../placement/planner';
import {
  CATAN_GENERATION,
  CATAN_INITIAL_GAME_STATE,
  canSkipCatanPlacement,
  createCatanGeneration,
  skipCatanPlacement,
  type CatanGeneration,
} from './definition';
import type { CatanSetup } from './options';
import type { CatanStep } from './steps';

const FC_SEED = 20261029;
const clara = defined(CATAN_TEST_PERSONS[2], 'Clara');
const ALL_ON = {
  edition: 'cities-and-knights',
  startingResources: { count: 2, replacement: 'with' },
} as const;

function kinds(generation: CatanGeneration): string[] {
  return generation.steps.map(({ step }) =>
    step.kind === 'person-draw' ? `person-draw:${step.draw}` : step.kind,
  );
}

function stepsOf(generation: CatanGeneration): CatanStep[] {
  return generation.steps.map((record) => record.step);
}

function indexOf(generation: CatanGeneration, matches: (step: CatanStep) => boolean): number {
  const index = generation.steps.findIndex((record) => matches(record.step));
  expect(index).not.toBe(-1);
  return index;
}

function repeat(
  setup: CatanSetup,
  generation: CatanGeneration,
  index: number,
  seed: number,
): CatanGeneration {
  const repeated = repeatStep(
    CATAN_GENERATION,
    setup,
    generation,
    index,
    new SeededRandomSource(seed),
  );
  if (!repeated.ok) throw new Error(repeated.error);
  return repeated.value;
}

// The steps that are not discarded keep their result and position among each other.
function unchangedExcept(
  before: CatanGeneration,
  after: CatanGeneration,
  discarded: readonly number[],
): void {
  const kept = stepsOf(before).filter((_, index) => !discarded.includes(index));
  expect(stepsOf(after).filter((step) => kept.includes(step))).toEqual(kept);
}

function complete(setup: CatanSetup, seed: number): CatanGeneration {
  return runCatanGeneration(setup, new SeededRandomSource(seed));
}

describe('Specification 3.1 flow of the Catan generation', () => {
  it('example: 4 persons, Cities & Knights, all options on: 26 steps', () => {
    const generation = complete(aCatanSetup(4, ALL_ON), 1);

    expect(generation.steps).toHaveLength(26);
    expect(generation.state).toBe('running');
    expect(kinds(generation)).toEqual([
      'person-draw:landscapes',
      'person-draw:harbors',
      'person-draw:numbers',
      ...Array<string>(3).fill('order-spin'),
      ...Array.from({ length: 8 }, () => ['building', 'road']).flat(),
      ...Array<string>(4).fill('starting-resources'),
    ]);
  });

  it('counts n − 1 spins, 2n buildings and roads and the optional steps (property)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }),
        fc.constantFrom('base', 'cities-and-knights'),
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        fc.integer(),
        (personCount, edition, hasLandscapes, hasHarbors, hasNumbers, hasResources, seed) => {
          const setup = aCatanSetup(personCount, {
            edition,
            personDraws: { landscapes: hasLandscapes, harbors: hasHarbors, numbers: hasNumbers },
            startingResources: hasResources ? { count: 3, replacement: 'without' } : null,
          });
          const draws = [hasLandscapes, hasHarbors, hasNumbers].filter(Boolean).length;
          const expected =
            draws + (personCount - 1) + 4 * personCount + (hasResources ? personCount : 0);
          return complete(setup, seed).steps.length === expected;
        },
      ),
      { seed: FC_SEED, numRuns: 200 },
    );
  });

  it('starts every step as revealed and waits for confirmation (US-AB-02 AK-1)', () => {
    const setup = aCatanSetup(2);
    const drawn = drawNextStep(
      CATAN_GENERATION,
      setup,
      startGeneration(CATAN_INITIAL_GAME_STATE),
      new SeededRandomSource(3),
    );

    expect(drawn.ok && drawn.value.steps.map((record) => record.status)).toEqual(['revealed']);
  });
});

describe('US-LS-02 Draw who lays out landscapes, harbours and number tokens', () => {
  it('AK-1: LS-01, LS-03 and LS-04 come first, in this order, as one step each', () => {
    const generation = complete(aCatanSetup(3), 5);

    expect(kinds(generation).slice(0, 4)).toEqual([
      'person-draw:landscapes',
      'person-draw:harbors',
      'person-draw:numbers',
      'order-spin',
    ]);
  });

  it('AK-3: a switched off draw is skipped', () => {
    const setup = aCatanSetup(3, {
      personDraws: { landscapes: false, harbors: true, numbers: false },
    });

    expect(kinds(complete(setup, 5)).slice(0, 2)).toEqual(['person-draw:harbors', 'order-spin']);
  });

  it('US-LS-01 AK-3: draws one of the participants each time', () => {
    const setup = aCatanSetup(3);
    const draws = stepsOf(complete(setup, 8)).filter((step) => step.kind === 'person-draw');

    expect(draws.every((step) => setup.participants.includes(step.result))).toBe(true);
  });
});

describe('US-LS-03 Draw the placement order', () => {
  it('AK-1, AK-2: n − 1 spins after LS-04, each from the persons not yet drawn', () => {
    const setup = aCatanSetup(4);
    const spins = stepsOf(complete(setup, 13)).flatMap((step) =>
      step.kind === 'order-spin' ? [step] : [],
    );

    expect(spins.map((spin) => spin.position)).toEqual([0, 1, 2]);
    expect(spins.map((spin) => spin.candidates.length)).toEqual([4, 3, 2]);
    spins.forEach((spin, position) => {
      expect(spin.candidates).toContain(spin.result);
      expect(spins.slice(0, position).map((earlier) => earlier.result)).not.toContain(spin.result);
    });
  });
});

describe('US-PL-02 and US-PL-03 Placement as steps', () => {
  it('AK-1, AK-2: buildings follow the snake order; Cities & Knights: settlement, then city', () => {
    const setup = aCatanSetup(3, { edition: 'cities-and-knights' });
    const steps = stepsOf(complete(setup, 21));
    const order = steps.flatMap((step) => (step.kind === 'order-spin' ? [step.result] : []));
    const last = defined(
      setup.participants.find((person) => !order.includes(person)),
      'last',
    );
    const forward = [...order, last];
    const buildings = steps.flatMap((step) => (step.kind === 'building' ? [step] : []));

    expect(buildings.map((step) => step.personId)).toEqual([...forward, ...[...forward].reverse()]);
    expect(buildings.map((step) => step.type)).toEqual([
      ...Array<string>(3).fill('settlement'),
      ...Array<string>(3).fill('city'),
    ]);
  });

  it('US-PL-03 AK-1: each road is a step of its own at its building', () => {
    const steps = stepsOf(complete(aCatanSetup(4), 34));

    const pairs = steps.flatMap((step, index) => {
      const road = steps[index + 1];
      return step.kind === 'building' ? [{ building: step, road }] : [];
    });

    expect(pairs).toHaveLength(8);
    for (const { building, road } of pairs) {
      expect(road).toMatchObject({ kind: 'road', index: building.index });
      const edges = CATAN_BOARD.vertices.get(building.result)?.edges ?? [];
      expect(edges.some((edge) => road?.kind === 'road' && road.result === edge)).toBe(true);
    }
  });

  it('ADR-010: draws all buildings hidden at the first building and shows them one by one', () => {
    const setup = aCatanSetup(4);
    const beforePlacement = runCatanGeneration(setup, new SeededRandomSource(2), undefined, 6);
    const first = runCatanGeneration(setup, new SeededRandomSource(4), beforePlacement, 1);
    const plan = first.gameState.hiddenPlan ?? [];

    expect(plan).toHaveLength(7);
    const second = runCatanGeneration(setup, new SeededRandomSource(5), first, 2);
    expect(stepsOf(second).at(-1)).toMatchObject({ kind: 'building', index: 1, result: plan[0] });
    expect(second.gameState.hiddenPlan).toEqual(plan.slice(1));
  });

  it('US-PL-02 AK-4: uses the strategy for dead ends with the buildings already shown', () => {
    const inputs: PlanInput[] = [];
    const recording: BuildingPlanner = {
      plan: (input, rng) => {
        inputs.push(input);
        return new RetryOnDeadEnd().plan(input, rng);
      },
    };
    const definition = createCatanGeneration(recording);
    const setup = aCatanSetup(2);
    const generation = runCatanGeneration(
      setup,
      new SeededRandomSource(9),
      undefined,
      Infinity,
      definition,
    );
    const third = indexOf(generation, (step) => step.kind === 'building' && step.index === 2);

    const repeated = repeatStep(definition, setup, generation, third, new SeededRandomSource(1));

    expect(repeated.ok).toBe(true);
    expect(inputs.map((input) => [input.fixed.length, input.total])).toEqual([
      [0, 4],
      [2, 4],
    ]);
  });
});

describe('US-SR-01 Draw starting resources', () => {
  it('AK-1: one step per person in placement order, after the placement', () => {
    const setup = aCatanSetup(3, { startingResources: { count: 2, replacement: 'with' } });
    const steps = stepsOf(complete(setup, 17));
    const firstBuildings = steps.flatMap((step) =>
      step.kind === 'building' && step.index < 3 ? [step.personId] : [],
    );

    expect(steps.slice(-3).map((step) => step.kind)).toEqual(Array(3).fill('starting-resources'));
    expect(
      steps.slice(-3).map((step) => step.kind === 'starting-resources' && step.personId),
    ).toEqual(firstBuildings);
  });

  it('AK-2: every person receives exactly k resources', () => {
    const setup = aCatanSetup(2, { startingResources: { count: 5, replacement: 'without' } });
    const resources = stepsOf(complete(setup, 23)).flatMap((step) =>
      step.kind === 'starting-resources' ? [step.result] : [],
    );

    expect(resources.map((list) => new Set(list).size)).toEqual([5, 5]);
  });
});

describe('US-PL-05 Skip the placement', () => {
  const setup = aCatanSetup(3, { startingResources: { count: 1, replacement: 'with' } });
  const atPlacement = runCatanGeneration(setup, new SeededRandomSource(31), undefined, 5);

  it('AK-1: is possible at the beginning of the placement only', () => {
    expect(kinds(atPlacement).at(-1)).toBe('order-spin');
    expect(canSkipCatanPlacement(setup, atPlacement)).toBe(true);

    const beforeOrder = runCatanGeneration(setup, new SeededRandomSource(31), undefined, 4);
    expect(canSkipCatanPlacement(setup, beforeOrder)).toBe(false);
    const withBuilding = runCatanGeneration(setup, new SeededRandomSource(1), atPlacement, 1);
    expect(skipCatanPlacement(setup, withBuilding)).toEqual({
      ok: false,
      error: 'placement-not-skippable',
    });
  });

  it('AK-1: is not possible while the last spin waits for confirmation', () => {
    const fourSteps = runCatanGeneration(setup, new SeededRandomSource(31), undefined, 4);
    const drawn = drawNextStep(CATAN_GENERATION, setup, fourSteps, new SeededRandomSource(31));

    expect(drawn.ok && canSkipCatanPlacement(setup, drawn.value)).toBe(false);
  });

  it('AK-2, US-SR-01 AK-1: continues with the starting resources after LS-02', () => {
    const skipped = skipCatanPlacement(setup, atPlacement);
    if (!skipped.ok) throw new Error(skipped.error);

    const finished = runCatanGeneration(setup, new SeededRandomSource(2), skipped.value);

    expect(kinds(finished).slice(5)).toEqual(Array(3).fill('starting-resources'));
    expect(finished.state).toBe('running');
    expect(canSkipCatanPlacement(setup, finished)).toBe(false);
  });

  it('AK-2: without starting resources the match is complete at once', () => {
    const plain = aCatanSetup(2);
    const skipped = skipCatanPlacement(
      plain,
      runCatanGeneration(plain, new SeededRandomSource(3), undefined, 4),
    );

    expect(skipped.ok && skipped.value.state).toBe('running');
  });

  it('decision I2-B: a new order resets the skipped placement, which starts again', () => {
    const skipped = skipCatanPlacement(setup, atPlacement);
    if (!skipped.ok) throw new Error(skipped.error);
    const spin = indexOf(skipped.value, (step) => step.kind === 'order-spin');

    const repeated = confirmed(repeat(setup, skipped.value, spin, 4), setup);
    const reordered = runCatanGeneration(setup, new SeededRandomSource(5), repeated, 1);

    expect(reordered.gameState.placementSkipped).toBe(false);
    expect(canSkipCatanPlacement(setup, reordered)).toBe(true);
    const placed = runCatanGeneration(setup, new SeededRandomSource(6), reordered);
    expect(stepsOf(placed).filter((step) => step.kind === 'building')).toHaveLength(6);
  });
});

describe('Specification 3.1 table of dependencies (US-AB-03)', () => {
  const setup = aCatanSetup(4, ALL_ON);
  const generation = complete(setup, 77);

  it.each(['landscapes', 'harbors', 'numbers'] as const)(
    'AK-3: repeating %s discards nothing and keeps all other steps',
    (draw) => {
      const index = indexOf(
        generation,
        (step) => step.kind === 'person-draw' && step.draw === draw,
      );

      expect(stepsDiscardedBy(CATAN_GENERATION, setup, generation, index)).toEqual([]);
      const repeated = repeat(setup, generation, index, 3);
      expect(repeated.steps).toHaveLength(26);
      unchangedExcept(generation, repeated, [index]);
      expect(repeated.steps[index]?.status).toBe('revealed');
    },
  );

  it('AK-5: repeating a spin draws the whole order again and discards the whole placement', () => {
    const index = indexOf(generation, (step) => step.kind === 'order-spin' && step.position === 1);
    const discarded = stepsDiscardedBy(CATAN_GENERATION, setup, generation, index);

    expect(discarded.map((other) => generation.steps[other]?.step.kind)).toEqual([
      'order-spin',
      'order-spin',
      ...Array.from({ length: 8 }, () => ['building', 'road']).flat(),
    ]);
    const repeated = repeat(setup, generation, index, 3);
    expect(kinds(repeated)).toEqual([
      'person-draw:landscapes',
      'person-draw:harbors',
      'person-draw:numbers',
      'order-spin',
      ...Array<string>(4).fill('starting-resources'),
    ]);
    expect(repeated.steps[3]).toMatchObject({ step: { position: 0 }, status: 'revealed' });
    unchangedExcept(generation, repeated, [index, ...discarded]);
    expect(repeated.gameState.hiddenPlan).toBeNull();
  });

  it('AK-5: after a new order the placement is run through again before the kept resources', () => {
    const index = indexOf(generation, (step) => step.kind === 'order-spin');
    const finished = runCatanGeneration(
      setup,
      new SeededRandomSource(8),
      confirmed(repeat(setup, generation, index, 3)),
    );

    expect(kinds(finished)).toEqual(kinds(generation));
    expect(stepsOf(finished).slice(-4)).toEqual(stepsOf(generation).slice(-4));
  });

  it('AK-4: repeating building k discards road k and all later buildings and roads', () => {
    const index = indexOf(generation, (step) => step.kind === 'building' && step.index === 5);
    const discarded = stepsDiscardedBy(CATAN_GENERATION, setup, generation, index);

    expect(discarded.map((other) => stepsOf(generation)[other])).toEqual(
      stepsOf(generation).filter(
        (step) =>
          (step.kind === 'road' && step.index >= 5) || (step.kind === 'building' && step.index > 5),
      ),
    );
    const repeated = repeat(setup, generation, index, 3);
    unchangedExcept(generation, repeated, [index, ...discarded]);
    expect(stepsOf(repeated).at(-5)).toMatchObject({ kind: 'building', index: 5 });

    const finished = runCatanGeneration(setup, new SeededRandomSource(4), confirmed(repeated));
    expect(kinds(finished)).toEqual(kinds(generation));
    expect(stepsOf(finished).slice(0, index)).toEqual(stepsOf(generation).slice(0, index));
  });

  it('AK-3: repeating road k discards nothing and keeps all other steps', () => {
    const index = indexOf(generation, (step) => step.kind === 'road' && step.index === 2);

    expect(stepsDiscardedBy(CATAN_GENERATION, setup, generation, index)).toEqual([]);
    const repeated = repeat(setup, generation, index, 3);
    unchangedExcept(generation, repeated, [index]);
    expect(repeated.steps[index]).toMatchObject({ step: { kind: 'road', index: 2 } });
  });

  it('AK-3: repeating the starting resources of a person discards nothing', () => {
    const index = indexOf(
      generation,
      (step) => step.kind === 'starting-resources' && step.personId === clara,
    );

    expect(stepsDiscardedBy(CATAN_GENERATION, setup, generation, index)).toEqual([]);
    const repeated = repeat(setup, generation, index, 3);
    unchangedExcept(generation, repeated, [index]);
    expect(repeated.steps[index]).toMatchObject({ step: { personId: clara } });
  });

  it('throws for a step that does not exist', () => {
    expect(() => CATAN_GENERATION.invalidatedBy(setup, [], 0)).toThrow(InvariantError);
    expect(() => CATAN_GENERATION.gameStateAfterRepeat(setup, generation, 99)).toThrow(
      InvariantError,
    );
  });
});

function confirmed(
  generation: CatanGeneration,
  setup: CatanSetup = aCatanSetup(4, ALL_ON),
): CatanGeneration {
  const result = confirmStep(CATAN_GENERATION, setup, generation);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}
