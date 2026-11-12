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
 * Error code when there is no step with this index any more, e.g. after a repetition.
 */
export type NoSuchStepError = 'no-such-step';

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
  // FA-AB-07: its animation has not played yet.
  const record: StepRecord<S> = { step: drawn.step, status: 'revealed', isStaged: false };
  const steps = [...generation.steps];
  steps.splice(drawn.at, 0, record);
  const next: Generation<S, G> = { state: 'generation', steps, gameState: drawn.gameState };
  return ok(
    definition.arrangeSteps === undefined
      ? next
      : { ...next, steps: definition.arrangeSteps(setup, next) },
  );
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
 * Index of a step whose animation has not played yet (FA-AB-07), or `undefined`. Only the step
 * drawn last can be one.
 */
export function unstagedStepIndex<S, G>(generation: Generation<S, G>): number | undefined {
  const index = generation.steps.findIndex((record) => !record.isStaged);
  return index === -1 ? undefined : index;
}

/**
 * Notes that the animation of step `index` has played or was skipped (FA-AB-07, US-IN-04): it
 * does not play again, also not after a restart. Nothing else changes; a step staged already
 * stays so. `no-such-step` if the step no longer exists.
 */
export function markStaged<S, G>(
  generation: Generation<S, G>,
  index: number,
): Result<Generation<S, G>, NoSuchStepError> {
  const record = generation.steps[index];
  if (!Number.isInteger(index) || record === undefined) {
    return err('no-such-step');
  }
  if (record.isStaged) {
    return ok(generation);
  }
  const steps = generation.steps.map((other, otherIndex): StepRecord<S> =>
    otherIndex === index ? { ...other, isStaged: true } : other,
  );
  return ok({ ...generation, steps });
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
 * 3.1). The repeated step is then the first missing one; it is shown without a result and drawn
 * again with "Losen" (US-AB-03 AK-1, US-AB-02 AK-3, E-35). All other steps stay unchanged
 * (AK-3); nothing of the repetition is recorded (AK-7). Possible while the match is in
 * generation or running (AK-6). While another step waits for confirmation, it must be confirmed
 * first.
 * @throws {InvariantError} if there is no step with this index.
 */
export function repeatStep<C, S, G>(
  definition: GenerationDefinition<C, S, G>,
  setup: C,
  generation: Generation<S, G>,
  index: number,
): Result<Generation<S, G>, StepPendingError> {
  assertStepIndex(generation, index);
  const revealed = revealedStepIndex(generation);
  if (revealed !== undefined && revealed !== index) {
    return err('step-pending');
  }
  const discarded = new Set([index, ...stepsDiscardedBy(definition, setup, generation, index)]);
  const remaining: Generation<S, G> = {
    ...generation,
    steps: generation.steps.filter((_, recordIndex) => !discarded.has(recordIndex)),
  };
  // The repeated step is missing now, so the generation is never complete afterwards.
  return ok(
    withGameState(
      definition,
      setup,
      remaining,
      definition.gameStateAfterRepeat(setup, generation, index),
    ),
  );
}

function assertStepIndex<S, G>(generation: Generation<S, G>, index: number): void {
  assert(
    Number.isInteger(index) && index >= 0 && index < generation.steps.length,
    `step ${String(index)} exists`,
  );
}
