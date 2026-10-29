import type { RandomSource } from '@/core/random';

/**
 * Status of a step (Architecture 5.5, 10.1): `revealed` means drawn and saved, its animation
 * may run and the app waits for "Weiter"; `confirmed` means "Weiter" was tapped.
 */
export type StepStatus = 'revealed' | 'confirmed';

/**
 * A step with its status. The step itself, i.e. its kind and result, is defined by the game
 * module (ADR-028); the flow control knows nothing about it.
 */
export type StepRecord<S> = {
  readonly step: S;
  readonly status: StepStatus;
};

/**
 * State of a generation (Specification 3.5): `generation` while steps are still open or one is
 * waiting for confirmation, `running` once every step is confirmed.
 */
export type GenerationState = 'generation' | 'running';

/**
 * Progress of a generation (Architecture 5.5, 10.2): the steps in the order of the flow and the
 * state of the game module, e.g. the hidden plan of the buildings (ADR-010).
 */
export type Generation<S, G> = {
  readonly state: GenerationState;
  readonly steps: readonly StepRecord<S>[];
  readonly gameState: G;
};

/**
 * A newly drawn step: where it belongs in the list of steps and the state of the game module
 * after drawing it.
 */
export type DrawnStep<S, G> = {
  readonly step: S;
  /** Index in the list of steps where the step is inserted, so the list follows the flow. */
  readonly at: number;
  readonly gameState: G;
};

/**
 * The generation of a game (Architecture 5.5). `C` is the setup of a match (participants and
 * options), `S` a step, `G` the state of the game module. The flow control calls these
 * functions and knows no detail of the game (NFA-EW-01).
 */
export type GenerationDefinition<C, S, G> = {
  /**
   * Determines the first step of the flow that is missing and draws its result, or returns
   * `null` if no step is missing. Discarded steps are missing as well, so after a repetition
   * the flow is run through again step by step (Specification 3.1).
   */
  readonly nextStep: (
    setup: C,
    generation: Generation<S, G>,
    rng: RandomSource,
  ) => DrawnStep<S, G> | null;
  /** Whether no step is missing; draws nothing. */
  readonly isComplete: (setup: C, generation: Generation<S, G>) => boolean;
  /**
   * Indices of the other steps discarded when step `index` is repeated (table in
   * Specification 3.1, US-AB-03 AK-2).
   */
  readonly invalidatedBy: (setup: C, steps: readonly S[], index: number) => readonly number[];
  /** State of the game module after step `index` and its dependent steps were discarded. */
  readonly gameStateAfterRepeat: (setup: C, generation: Generation<S, G>, index: number) => G;
};
