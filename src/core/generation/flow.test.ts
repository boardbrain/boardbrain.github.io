import { InvariantError } from '@/core/shared';
import { ScriptedRandomSource } from '@tests/support/scriptedRandomSource';
import { describe, expect, it } from 'vitest';
import { uniformInt } from '@/core/random';
import {
  confirmStep,
  drawNextStep,
  markStaged,
  repeatStep,
  revealedStepIndex,
  startGeneration,
  stepsDiscardedBy,
  unstagedStepIndex,
  withGameState,
} from './flow';
import type { Generation, GenerationDefinition } from './types';

// A minimal flow without any game: `slots` steps in a row, each draws a number below 10.
// Repeating slot 0 discards all later slots; the game state counts the repetitions of slot 0.
type Setup = { readonly slots: number };
type Step = { readonly slot: number; readonly value: number };
type FlowGeneration = Generation<Step, number>;

const definition: GenerationDefinition<Setup, Step, number> = {
  nextStep: (setup, generation, rng) => {
    const present = generation.steps.map((record) => record.step.slot);
    for (let slot = 0; slot < setup.slots; slot++) {
      if (!present.includes(slot)) {
        const at = present.filter((other) => other < slot).length;
        return { step: { slot, value: uniformInt(10, rng) }, at, gameState: generation.gameState };
      }
    }
    return null;
  },
  isComplete: (setup, generation) => generation.steps.length === setup.slots,
  invalidatedBy: (_setup, steps, index) =>
    steps[index]?.slot === 0
      ? steps.flatMap((step, other) => (step.slot > 0 ? [other] : []))
      : [index],
  gameStateAfterRepeat: (_setup, generation, index) =>
    generation.steps[index]?.step.slot === 0 ? generation.gameState + 1 : generation.gameState,
};

const setup: Setup = { slots: 3 };

// Runs the flow with the given values, confirming every step.
function runConfirmed(words: readonly number[]): FlowGeneration {
  const rng = new ScriptedRandomSource(words);
  let generation: FlowGeneration = startGeneration(0);
  while (rng.consumed < words.length) {
    const drawn = drawNextStep(definition, setup, generation, rng);
    if (!drawn.ok) throw new Error(drawn.error);
    const confirmed = confirmStep(definition, setup, drawn.value);
    if (!confirmed.ok) throw new Error(confirmed.error);
    generation = confirmed.value;
  }
  return generation;
}

function values(generation: FlowGeneration): number[] {
  return generation.steps.map((record) => record.step.value);
}

describe('Architecture 5.5 flow control of a generation', () => {
  it('starts without steps in the state generation', () => {
    expect(startGeneration(7)).toEqual({ state: 'generation', steps: [], gameState: 7 });
  });

  it('ADR-014: draws the next step as revealed, so it can be saved before it is shown', () => {
    const drawn = drawNextStep(
      definition,
      setup,
      startGeneration(0),
      new ScriptedRandomSource([4]),
    );

    expect(drawn).toEqual({
      ok: true,
      value: {
        state: 'generation',
        steps: [{ step: { slot: 0, value: 4 }, status: 'revealed', isStaged: false }],
        gameState: 0,
      },
    });
  });

  it('US-AB-02 AK-1: draws nothing while a step waits for confirmation', () => {
    const rng = new ScriptedRandomSource([4]);
    const drawn = drawNextStep(definition, setup, startGeneration(0), rng);
    if (!drawn.ok) throw new Error(drawn.error);

    expect(drawNextStep(definition, setup, drawn.value, rng)).toEqual({
      ok: false,
      error: 'step-pending',
    });
    expect(revealedStepIndex(drawn.value)).toBe(0);
  });

  it('Specification 3.5: is running once the last step is confirmed', () => {
    const generation = runConfirmed([1, 2, 3]);

    expect(generation.state).toBe('running');
    expect(values(generation)).toEqual([1, 2, 3]);
    expect(revealedStepIndex(generation)).toBeUndefined();
    expect(drawNextStep(definition, setup, generation, new ScriptedRandomSource([]))).toEqual({
      ok: false,
      error: 'generation-complete',
    });
  });

  it('stays in generation while the last step waits for confirmation', () => {
    const generation = runConfirmed([1, 2]);
    const drawn = drawNextStep(definition, setup, generation, new ScriptedRandomSource([3]));

    expect(drawn.ok && drawn.value.state).toBe('generation');
  });

  it('US-AB-02 AK-1: confirming without a revealed step is rejected', () => {
    expect(confirmStep(definition, setup, startGeneration(0))).toEqual({
      ok: false,
      error: 'no-step-revealed',
    });
  });

  it('derives the state when the game state changes', () => {
    const generation = runConfirmed([1, 2]);

    expect(withGameState(definition, { slots: 2 }, generation, 5)).toEqual({
      ...generation,
      state: 'running',
      gameState: 5,
    });
    expect(withGameState(definition, setup, generation, 5).state).toBe('generation');
  });
});

describe('Architecture 10.2 steps in the order of the flow', () => {
  it('puts the steps in order after drawing, where the game module asks for it', () => {
    const reversed: GenerationDefinition<Setup, Step, number> = {
      ...definition,
      arrangeSteps: (_setup, generation) =>
        [...generation.steps].sort((a, b) => b.step.slot - a.step.slot),
    };
    const start = startGeneration<Step, number>(0);
    const first = drawNextStep(reversed, { slots: 3 }, start, new ScriptedRandomSource([1]));
    if (!first.ok) throw new Error(first.error);
    const confirmedFirst = confirmStep(reversed, { slots: 3 }, first.value);
    if (!confirmedFirst.ok) throw new Error(confirmedFirst.error);
    const second = drawNextStep(
      reversed,
      { slots: 3 },
      confirmedFirst.value,
      new ScriptedRandomSource([2]),
    );
    if (!second.ok) throw new Error(second.error);

    expect(second.value.steps.map((record) => record.step.slot)).toEqual([1, 0]);
  });
});

describe('US-AB-03 Repeat a step (flow control)', () => {
  it('AK-1, AK-3: discards the step, keeps all other steps, and draws it again in place', () => {
    const generation = runConfirmed([1, 2, 3]);

    const repeated = repeatStep(definition, setup, generation, 1);
    if (!repeated.ok) throw new Error(repeated.error);

    // E-35: the repeated step is shown without a result first, so nothing is drawn yet.
    expect(repeated.value).toEqual({
      state: 'generation',
      steps: [
        { step: { slot: 0, value: 1 }, status: 'confirmed', isStaged: false },
        { step: { slot: 2, value: 3 }, status: 'confirmed', isStaged: false },
      ],
      gameState: 0,
    });
    const drawn = drawNextStep(definition, setup, repeated.value, new ScriptedRandomSource([9]));
    expect(drawn.ok && values(drawn.value)).toEqual([1, 9, 3]);
  });

  it('AK-6: a running generation can be repeated and is running again after confirming', () => {
    const repeated = repeatStep(definition, setup, runConfirmed([1, 2, 3]), 2);
    if (!repeated.ok) throw new Error(repeated.error);
    expect(repeated.value.state).toBe('generation');

    const drawn = drawNextStep(definition, setup, repeated.value, new ScriptedRandomSource([0]));
    if (!drawn.ok) throw new Error(drawn.error);
    const confirmed = confirmStep(definition, setup, drawn.value);

    expect(confirmed.ok && confirmed.value.state).toBe('running');
  });

  it('AK-2, AK-4: discards the dependent steps, which are then drawn again one by one', () => {
    const generation = runConfirmed([1, 2, 3]);
    expect(stepsDiscardedBy(definition, setup, generation, 0)).toEqual([1, 2]);

    const repeated = repeatStep(definition, setup, generation, 0);
    if (!repeated.ok) throw new Error(repeated.error);

    expect(repeated.value.steps).toEqual([]);
    expect(repeated.value.gameState).toBe(1);
    const rng = new ScriptedRandomSource([7, 8]);
    const first = drawNextStep(definition, setup, repeated.value, rng);
    if (!first.ok) throw new Error(first.error);
    const confirmed = confirmStep(definition, setup, first.value);
    if (!confirmed.ok) throw new Error(confirmed.error);
    const next = drawNextStep(definition, setup, confirmed.value, rng);
    expect(next.ok && values(next.value)).toEqual([7, 8]);
  });

  it('AK-2: the warning lists only other steps, once and in ascending order', () => {
    const generation = runConfirmed([1, 2, 3]);

    expect(stepsDiscardedBy(definition, setup, generation, 1)).toEqual([]);
  });

  it('AK-1: repeats the step that waits for confirmation', () => {
    const drawn = drawNextStep(definition, setup, runConfirmed([1]), new ScriptedRandomSource([2]));
    if (!drawn.ok) throw new Error(drawn.error);

    const repeated = repeatStep(definition, setup, drawn.value, 1);

    expect(repeated.ok && values(repeated.value)).toEqual([1]);
    expect(repeated.ok && revealedStepIndex(repeated.value)).toBeUndefined();
  });

  it('rejects repeating another step while a step waits for confirmation', () => {
    const drawn = drawNextStep(definition, setup, runConfirmed([1]), new ScriptedRandomSource([2]));
    if (!drawn.ok) throw new Error(drawn.error);

    expect(repeatStep(definition, setup, drawn.value, 0)).toEqual({
      ok: false,
      error: 'step-pending',
    });
  });

  it('throws for a step that does not exist', () => {
    const generation = runConfirmed([1]);

    expect(() => repeatStep(definition, setup, generation, 1)).toThrow(InvariantError);
    expect(() => stepsDiscardedBy(definition, setup, generation, -1)).toThrow(InvariantError);
  });
});

describe('FA-AB-07 animation played once', () => {
  it('a step drawn anew is not staged yet', () => {
    const drawn = drawNextStep(
      definition,
      setup,
      startGeneration(0),
      new ScriptedRandomSource([4]),
    );
    if (!drawn.ok) throw new Error(drawn.error);

    expect(unstagedStepIndex(drawn.value)).toBe(0);
  });

  it('marks only this step staged; it stays staged when confirmed', () => {
    const drawn = drawNextStep(definition, setup, runConfirmed([1]), new ScriptedRandomSource([2]));
    if (!drawn.ok) throw new Error(drawn.error);
    const staged = markStaged(drawn.value, 1);
    if (!staged.ok) throw new Error(staged.error);

    expect(staged.value.steps.map((record) => record.isStaged)).toEqual([false, true]);
    expect(staged.value.steps[1]?.status).toBe('revealed');
    const confirmed = confirmStep(definition, setup, staged.value);
    expect(confirmed.ok && confirmed.value.steps[1]?.isStaged).toBe(true);
  });

  it('a step staged already stays unchanged', () => {
    const staged = markStaged(runConfirmed([1]), 0);
    if (!staged.ok) throw new Error(staged.error);

    expect(markStaged(staged.value, 0)).toEqual({ ok: true, value: staged.value });
  });

  it('reports a step that no longer exists, e.g. after a repetition', () => {
    const generation = runConfirmed([1]);

    expect(markStaged(generation, 3)).toEqual({ ok: false, error: 'no-such-step' });
    expect(markStaged(generation, 0.5)).toEqual({ ok: false, error: 'no-such-step' });
  });

  it('a step drawn again after a repetition plays its animation again', () => {
    const generation = runConfirmed([1, 2]);
    const staged = markStaged(generation, 0);
    if (!staged.ok) throw new Error(staged.error);
    const repeated = repeatStep(definition, setup, staged.value, 0);
    if (!repeated.ok) throw new Error(repeated.error);
    const drawn = drawNextStep(definition, setup, repeated.value, new ScriptedRandomSource([7]));
    if (!drawn.ok) throw new Error(drawn.error);

    expect(drawn.value.steps.find((record) => record.step.slot === 0)?.isStaged).toBe(false);
  });
});
