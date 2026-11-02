import { orderSpinCount } from '@/core/draws';
import { catanPlacementRounds } from '../placement/rounds';
import type { CatanGeneration } from './definition';
import { enabledPersonDraws, type CatanSetup } from './options';
import type { CatanStep } from './steps';

/**
 * The phases of the flow as the progress shows them (Specification 3.1 phases 4 to 9): draws
 * of a person, placement order, placement and starting resources.
 */
export const CATAN_PHASES = ['draws', 'order', 'placement', 'resources'] as const;

/**
 * A phase of the flow (Architecture 4.5).
 */
export type CatanPhase = (typeof CATAN_PHASES)[number];

/**
 * Progress of one phase at a step.
 */
export type CatanPhaseProgress = {
  readonly phase: CatanPhase;
  /** Number of steps of the phase; for a switched off phase the number it would have. */
  readonly total: number;
  /** Steps of the phase up to and including the step shown. */
  readonly done: number;
  /** The step shown belongs to this phase. */
  readonly isCurrent: boolean;
  /** The placement is skipped or the starting resources are switched off. */
  readonly isOff: boolean;
};

/**
 * The phase a step belongs to.
 */
export function catanPhaseOf(step: CatanStep): CatanPhase {
  switch (step.kind) {
    case 'person-draw':
      return 'draws';
    case 'order-spin':
      return 'order';
    case 'building':
    case 'road':
      return 'placement';
    case 'starting-resources':
      return 'resources';
  }
}

/**
 * Progress in phases at step `stepIndex` (design I2-C, F2). Phases without steps that cannot
 * be switched on in the flow are left out: draws of a person when all are off, the order when
 * it is set by hand or there is none (FA-LS-07). A skipped placement and switched off starting
 * resources stay as switched off phases, so the progress keeps its shape.
 */
export function catanProgress(
  setup: CatanSetup,
  generation: CatanGeneration,
  stepIndex: number,
): CatanPhaseProgress[] {
  const personCount = setup.participants.length;
  const current = generation.steps[stepIndex]?.step;
  const isPlacementOff =
    setup.options.order.mode === 'none' || generation.gameState.placementSkipped;
  const phases: Record<CatanPhase, { total: number; isOff: boolean }> = {
    draws: { total: enabledPersonDraws(setup.options).length, isOff: false },
    order: {
      total: setup.options.order.mode === 'draw' ? orderSpinCount(personCount) : 0,
      isOff: false,
    },
    placement: {
      total: 2 * personCount * catanPlacementRounds(setup.options.edition).length,
      isOff: isPlacementOff,
    },
    resources: {
      total: setup.options.startingResources === null ? 0 : personCount,
      isOff: setup.options.startingResources === null,
    },
  };
  const shown = generation.steps.slice(0, stepIndex + 1).map((record) => record.step);
  return CATAN_PHASES.filter((phase) => phases[phase].total > 0 || phases[phase].isOff).map(
    (phase) => ({
      phase,
      ...phases[phase],
      done: phases[phase].isOff ? 0 : shown.filter((step) => catanPhaseOf(step) === phase).length,
      isCurrent: current !== undefined && catanPhaseOf(current) === phase,
    }),
  );
}
