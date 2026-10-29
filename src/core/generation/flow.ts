import type { RandomSource } from '@/core/random';
import { assert, err, ok, type Result } from '@/core/shared';
import type { Generation, GenerationDefinition, StepRecord } from './types';

/**
 * Error code when a step waits for confirmation and therefore nothing else may happen yet
 * (US-AB-02 AK-1).
 */
export type StepPendingError = 'step-pending';

/**
 * Error code when no step is missing any more.
 */
export type GenerationCompleteError = 'generation-complete';

/**
 * Error code when no step waits for confirmation.
 */
export type NoStepRevealedError = 'no-step-revealed';

/**
 * Starts a generation without steps (Specification 3.5, "Generierung starten").
 */
export function startGeneration<S, G>(gameState: G): Generation<S, G> {
  return { state: 'generation', steps: [], gameState };
}

/**
 * Index of the step that waits for confirmation, or `undefined`. There is at most one.
 */
export function revealedStepIndex<S, G>(generation: Generation<S, G>): number | undefined {
  const index = generation.steps.findIndex((record) => record.status === 'revealed');
  return index === -1 ? undefined : index;
}

/**
 * Sets the state of the game module and derives the state of the generation: `running` once
 * no step is missing and none waits for confirmation (Specification 3.5).
 */
export function withGameState<C, S, G>(
  definition: GenerationDefinition<C, S, G>,
  setup: C,
  generation: Generation<S, G>,
  gameState: G,
): Generation<S, G> {
  const changed = { ...generation, gameState };
  const isDone = revealedStepIndex(changed) === undefined && definition.isComplete(setup, changed);
  return { ...changed, state: isDone ? 'running' : 'generation' };
}

/**
 * Draws the next missing step and adds it as `revealed` (Architecture 10.1). The caller saves
 * the result before it is shown (ADR-014). Nothing is drawn while a step waits for
 * confirmation (US-AB-02 AK-1).
 */
export function drawNextStep<C, S, G>(
  definition: GenerationDefinition<C, S, G>,
  setup: C,
  generation: Generation<S, G>,
  rng: RandomSource,
): Result<Generation<S, G>, StepPendingError | GenerationCompleteError> {
  if (revealedStepIndex(generation) !== undefined) {
    return err('step-pending');
  }
  const drawn = definition.nextStep(setup, generation, rng);
  if (drawn === null) {
    return err('generation-complete');
  }
  assert(drawn.at >= 0 && drawn.at <= generation.steps.length, 'the step fits into the list');
  const record: StepRecord<S> = { step: drawn.step, status: 'revealed' };
  const steps = [...generation.steps];
  steps.splice(drawn.at, 0, record);
  return ok({ state: 'generation', steps, gameState: drawn.gameState });
}

/**
 * Confirms the step that waits for confirmation ("Weiter", US-AB-02 AK-1). Once the last step
 * is confirmed, the generation is `running` (Specification 3.5).
 */
export function confirmStep<C, S, G>(
  definition: GenerationDefinition<C, S, G>,
  setup: C,
  generation: Generation<S, G>,
): Result<Generation<S, G>, NoStepRevealedError> {
  const index = revealedStepIndex(generation);
  if (index === undefined) {
    return err('no-step-revealed');
  }
  const steps = generation.steps.map((record, recordIndex): StepRecord<S> =>
    recordIndex === index ? { ...record, status: 'confirmed' } : record,
  );
  return ok(withGameState(definition, setup, { ...generation, steps }, generation.gameState));
}

/**
 * Indices of the other steps a repetition of step `index` discards, in ascending order, for
 * the warning before repeating (US-AB-03 AK-2).
 * @throws {InvariantError} if there is no step with this index.
 */
export function stepsDiscardedBy<C, S, G>(
  definition: GenerationDefinition<C, S, G>,
  setup: C,
  generation: Generation<S, G>,
  index: number,
): number[] {
  assertStepIndex(generation, index);
  const steps = generation.steps.map((record) => record.step);
  return [...new Set(definition.invalidatedBy(setup, steps, index))]
    .filter((other) => other !== index)
    .sort((a, b) => a - b);
}

/**
 * Repeats step `index` (US-AB-03): discards it and the steps that depend on it (Specification
 * 3.1) and draws the step again as `revealed`. All other steps stay unchanged (AK-3); nothing
 * of the repetition is recorded (AK-7). Possible while the match is in generation or running
 * (AK-6). While another step waits for confirmation, it must be confirmed first.
 * @throws {InvariantError} if there is no step with this index.
 */
export function repeatStep<C, S, G>(
  definition: GenerationDefinition<C, S, G>,
  setup: C,
  generation: Generation<S, G>,
  index: number,
  rng: RandomSource,
): Result<Generation<S, G>, StepPendingError> {
  assertStepIndex(generation, index);
  const revealed = revealedStepIndex(generation);
  if (revealed !== undefined && revealed !== index) {
    return err('step-pending');
  }
  const discarded = new Set([index, ...stepsDiscardedBy(definition, setup, generation, index)]);
  const gameState = definition.gameStateAfterRepeat(setup, generation, index);
  const remaining: Generation<S, G> = {
    state: 'generation',
    steps: generation.steps.filter((_, recordIndex) => !discarded.has(recordIndex)),
    gameState,
  };
  const drawn = drawNextStep(definition, setup, remaining, rng);
  // The repeated step itself is missing now, so there is always a step to draw.
  assert(drawn.ok, 'a repeated step can be drawn again');
  return drawn;
}

function assertStepIndex<S, G>(generation: Generation<S, G>, index: number): void {
  assert(
    Number.isInteger(index) && index >= 0 && index < generation.steps.length,
    `step ${String(index)} exists`,
  );
}
