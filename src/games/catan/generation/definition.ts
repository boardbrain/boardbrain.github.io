import { drawOrderSpin, drawPerson, orderSpinCount, completeOrder } from '@/core/draws';
import {
  revealedStepIndex,
  withGameState,
  type DrawnStep,
  type Generation,
  type GenerationDefinition,
} from '@/core/generation';
import type { PersonId } from '@/core/model';
import type { RandomSource } from '@/core/random';
import { assert, err, ok, type Result } from '@/core/shared';
import { CATAN_BOARD, type VertexId } from '../board/board';
import { RetryOnDeadEnd, type BuildingPlanner } from '../placement/planner';
import { drawRoad } from '../placement/road';
import { catanPlacementRounds, type CatanBuildingType } from '../placement/rounds';
import { CATAN_STANDARD_RULES } from '../placement/rules';
import { placementSchedule } from '../placement/schedule';
import { drawCatanStartingResources } from '../startingResources';
import { enabledPersonDraws, type CatanPersonDraw, type CatanSetup } from './options';
import type { CatanBuildingStep, CatanOrderSpinStep, CatanStep } from './steps';

/**
 * State of the Catan module within a generation (Architecture 10.2).
 */
export type CatanGameState = {
  /**
   * Hidden plan: the buildings drawn ahead but not yet shown, in placement order (ADR-010,
   * Specification 3.2). `null` until the next building needs a new plan.
   */
  readonly hiddenPlan: readonly VertexId[] | null;
  /** The placement was skipped (US-PL-05). */
  readonly placementSkipped: boolean;
};

/**
 * State of the Catan module at the start of a generation.
 */
export const CATAN_INITIAL_GAME_STATE: CatanGameState = {
  hiddenPlan: null,
  placementSkipped: false,
};

/**
 * Generation of Catan with its setup, steps and module state.
 */
export type CatanGeneration = Generation<CatanStep, CatanGameState>;

/**
 * Generation definition of Catan (Architecture 5.5).
 */
export type CatanGenerationDefinition = GenerationDefinition<CatanSetup, CatanStep, CatanGameState>;

/**
 * Error code when the placement cannot be skipped (US-PL-05 AK-1): only at its beginning.
 */
export type PlacementNotSkippableError = 'placement-not-skippable';

// A place in the flow that a step fills; a step carries the same fields plus its result.
type Slot =
  | { readonly kind: 'person-draw'; readonly draw: CatanPersonDraw }
  | { readonly kind: 'order-spin'; readonly position: number }
  | {
      readonly kind: 'building';
      readonly index: number;
      readonly personId: PersonId;
      readonly type: CatanBuildingType;
    }
  | { readonly kind: 'road'; readonly index: number; readonly personId: PersonId }
  | { readonly kind: 'starting-resources'; readonly personId: PersonId };

function slotKey(slot: Slot): string {
  switch (slot.kind) {
    case 'person-draw':
      return `person-draw:${slot.draw}`;
    case 'order-spin':
      return `order-spin:${String(slot.position)}`;
    case 'building':
    case 'road':
      return `${slot.kind}:${String(slot.index)}`;
    case 'starting-resources':
      return `starting-resources:${slot.personId}`;
  }
}

function orderSpins(steps: readonly CatanStep[]): CatanOrderSpinStep[] {
  return steps
    .filter((step): step is CatanOrderSpinStep => step.kind === 'order-spin')
    .sort((a, b) => a.position - b.position);
}

function buildings(steps: readonly CatanStep[]): CatanBuildingStep[] {
  return steps
    .filter((step): step is CatanBuildingStep => step.kind === 'building')
    .sort((a, b) => a.index - b.index);
}

/**
 * The placement order once all n − 1 spins are drawn (US-LS-03 AK-2), otherwise `undefined`.
 */
export function catanPlacementOrder(
  setup: CatanSetup,
  steps: readonly CatanStep[],
): PersonId[] | undefined {
  const drawn = orderSpins(steps).map((step) => step.result);
  return drawn.length === orderSpinCount(setup.participants.length)
    ? completeOrder(setup.participants, drawn)
    : undefined;
}

// FA-AB-02, Specification 3.1: the flow of the phases 4 to 9. The placement and the starting
// resources follow the order, so they are known only once the order is complete.
function slotsOf(setup: CatanSetup, generation: CatanGeneration): Slot[] {
  const steps = generation.steps.map((record) => record.step);
  const slots: Slot[] = enabledPersonDraws(setup.options).map((draw) => ({
    kind: 'person-draw',
    draw,
  }));
  for (let position = 0; position < orderSpinCount(setup.participants.length); position++) {
    slots.push({ kind: 'order-spin', position });
  }
  const order = catanPlacementOrder(setup, steps);
  if (order === undefined) {
    return slots;
  }
  if (!generation.gameState.placementSkipped) {
    const schedule = placementSchedule(order, catanPlacementRounds(setup.options.edition));
    schedule.forEach(({ person, type }, index) => {
      slots.push({ kind: 'building', index, personId: person, type });
      slots.push({ kind: 'road', index, personId: person });
    });
  }
  // US-SR-01 AK-1: one step per person in placement order, after the placement.
  if (setup.options.startingResources !== null) {
    for (const personId of order) {
      slots.push({ kind: 'starting-resources', personId });
    }
  }
  return slots;
}

function placementTotal(setup: CatanSetup): number {
  return setup.participants.length * catanPlacementRounds(setup.options.edition).length;
}

/**
 * Creates the generation of Catan with an exchangeable strategy for dead ends (NFA-EW-08).
 */
export function createCatanGeneration(
  planner: BuildingPlanner = new RetryOnDeadEnd(),
): CatanGenerationDefinition {
  // Draws the result of a slot; only the building changes the module state.
  function drawSlot(
    slot: Slot,
    setup: CatanSetup,
    generation: CatanGeneration,
    rng: RandomSource,
  ): { step: CatanStep; gameState: CatanGameState } {
    const { gameState } = generation;
    const steps = generation.steps.map((record) => record.step);
    switch (slot.kind) {
      case 'person-draw':
        // US-LS-01 AK-3: independent draws, the same person can be drawn repeatedly.
        return { step: { ...slot, result: drawPerson(setup.participants, rng) }, gameState };
      case 'order-spin': {
        const drawn = orderSpins(steps).map((step) => step.result);
        const candidates = setup.participants.filter((person) => !drawn.includes(person));
        const result = drawOrderSpin(setup.participants, drawn, rng);
        return { step: { ...slot, candidates, result }, gameState };
      }
      case 'building': {
        // ADR-010, Specification 3.2: at the start of the placement or after a repeated
        // building, all remaining buildings are drawn hidden; they are shown one by one.
        const plan =
          gameState.hiddenPlan ??
          planner.plan(
            {
              board: CATAN_BOARD,
              rules: CATAN_STANDARD_RULES,
              fixed: buildings(steps).map((step) => step.result),
              total: placementTotal(setup),
            },
            rng,
          ).buildings;
        const [result, ...rest] = plan;
        assert(result !== undefined, 'the hidden plan contains the next building');
        return { step: { ...slot, result }, gameState: { ...gameState, hiddenPlan: rest } };
      }
      case 'road': {
        const building = buildings(steps).find((step) => step.index === slot.index);
        assert(building !== undefined, 'the building of the road is placed');
        return {
          step: { ...slot, result: drawRoad(CATAN_BOARD, building.result, rng) },
          gameState,
        };
      }
      case 'starting-resources': {
        const options = setup.options.startingResources;
        assert(options !== null, 'starting resources are switched on');
        return {
          step: { ...slot, result: drawCatanStartingResources(options, rng) },
          gameState,
        };
      }
    }
  }

  return {
    nextStep(setup, generation, rng): DrawnStep<CatanStep, CatanGameState> | null {
      const slots = slotsOf(setup, generation);
      const present = new Set(generation.steps.map((record) => slotKey(record.step)));
      const position = slots.findIndex((slot) => !present.has(slotKey(slot)));
      const slot = slots[position];
      if (slot === undefined) {
        return null;
      }
      // Steps that come later in the flow, or no longer have a place in it, stay behind.
      const rank = new Map(slots.map((other, index) => [slotKey(other), index]));
      const at = generation.steps.filter(
        (record) => (rank.get(slotKey(record.step)) ?? Infinity) < position,
      ).length;
      return { ...drawSlot(slot, setup, generation, rng), at };
    },

    isComplete(setup, generation) {
      const present = new Set(generation.steps.map((record) => slotKey(record.step)));
      return slotsOf(setup, generation).every((slot) => present.has(slotKey(slot)));
    },

    // Specification 3.1, table of dependencies; US-AB-03 AK-3 to AK-5.
    invalidatedBy(_setup, steps, index) {
      const repeated = steps[index];
      assert(repeated !== undefined, `step ${String(index)} exists`);
      const indices = (matches: (step: CatanStep) => boolean): number[] =>
        steps.flatMap((step, other) => (matches(step) ? [other] : []));
      switch (repeated.kind) {
        case 'order-spin':
          // The whole order is drawn again, and the whole placement is discarded.
          return indices(
            (step) =>
              step.kind === 'order-spin' || step.kind === 'building' || step.kind === 'road',
          );
        case 'building':
          // Road k and all later buildings and roads.
          return indices(
            (step) =>
              (step.kind === 'building' && step.index > repeated.index) ||
              (step.kind === 'road' && step.index >= repeated.index),
          );
        case 'person-draw':
        case 'road':
        case 'starting-resources':
          return [];
      }
    },

    gameStateAfterRepeat(_setup, generation, index) {
      const repeated = generation.steps[index]?.step;
      assert(repeated !== undefined, `step ${String(index)} exists`);
      switch (repeated.kind) {
        case 'building':
          return { ...generation.gameState, hiddenPlan: null };
        case 'order-spin':
          // Decision of the product owner (I2-B): a new order also resets a skipped placement,
          // so it starts again and can be skipped once more.
          return { hiddenPlan: null, placementSkipped: false };
        case 'person-draw':
        case 'road':
        case 'starting-resources':
          return generation.gameState;
      }
    },
  };
}

/**
 * The generation of Catan with the strategy of version 1 for dead ends, "draw again hidden"
 * (E-09, ADR-010).
 */
export const CATAN_GENERATION: CatanGenerationDefinition = createCatanGeneration();

/**
 * Whether the placement can be skipped now (US-PL-05 AK-1): the order is complete and
 * confirmed, and no building has been drawn yet.
 */
export function canSkipCatanPlacement(setup: CatanSetup, generation: CatanGeneration): boolean {
  const steps = generation.steps.map((record) => record.step);
  return (
    !generation.gameState.placementSkipped &&
    revealedStepIndex(generation) === undefined &&
    catanPlacementOrder(setup, steps) !== undefined &&
    buildings(steps).length === 0
  );
}

/**
 * Skips the placement (US-PL-05 AK-2): the flow continues with the starting resources, if they
 * are switched on, or the match is complete.
 */
export function skipCatanPlacement(
  setup: CatanSetup,
  generation: CatanGeneration,
  definition: CatanGenerationDefinition = CATAN_GENERATION,
): Result<CatanGeneration, PlacementNotSkippableError> {
  if (!canSkipCatanPlacement(setup, generation)) {
    return err('placement-not-skippable');
  }
  return ok(
    withGameState(definition, setup, generation, { hiddenPlan: null, placementSkipped: true }),
  );
}
