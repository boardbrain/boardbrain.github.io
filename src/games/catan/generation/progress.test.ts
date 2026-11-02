import { aCatanSetup, runCatanGeneration } from '@tests/support/catanGeneration';
import { SeededRandomSource } from '@tests/support/seededRandomSource';
import { describe, expect, it } from 'vitest';
import { skipCatanPlacement } from './definition';
import { catanPhaseOf, catanProgress } from './progress';

function summaryOf(progress: ReturnType<typeof catanProgress>): string[] {
  return progress.map(
    ({ phase, total, done, isCurrent, isOff }) =>
      `${phase} ${String(done)}/${String(total)}${isCurrent ? ' now' : ''}${isOff ? ' off' : ''}`,
  );
}

describe('Design I2-C F2 Progress in phases', () => {
  const setup = aCatanSetup(4, {
    edition: 'cities-and-knights',
    startingResources: { count: 2, replacement: 'with' },
  });
  const generation = runCatanGeneration(setup, new SeededRandomSource(8));

  it('counts the steps of each phase up to the step shown', () => {
    expect(summaryOf(catanProgress(setup, generation, 0))).toEqual([
      'draws 1/3 now',
      'order 0/3',
      'placement 0/16',
      'resources 0/4',
    ]);
    expect(summaryOf(catanProgress(setup, generation, 7))).toEqual([
      'draws 3/3',
      'order 3/3',
      'placement 2/16 now',
      'resources 0/4',
    ]);
    expect(summaryOf(catanProgress(setup, generation, 25))).toEqual([
      'draws 3/3',
      'order 3/3',
      'placement 16/16',
      'resources 4/4 now',
    ]);
  });

  it('leaves out phases without steps and keeps switched off ones', () => {
    const plain = aCatanSetup(2, {
      order: { mode: 'manual', order: aCatanSetup(2).participants },
      personDraws: { landscapes: false, harbors: false, numbers: false },
    });

    expect(
      summaryOf(catanProgress(plain, runCatanGeneration(plain, new SeededRandomSource(1)), 0)),
    ).toEqual(['placement 1/8 now', 'resources 0/0 off']);
  });

  it('shows a skipped placement and a match without placement as switched off', () => {
    const plain = aCatanSetup(3, { startingResources: { count: 1, replacement: 'with' } });
    const atPlacement = runCatanGeneration(plain, new SeededRandomSource(2), undefined, 5);
    const skipped = skipCatanPlacement(plain, atPlacement);
    if (!skipped.ok) throw new Error(skipped.error);
    const none = aCatanSetup(3, { order: { mode: 'none' } });

    expect(summaryOf(catanProgress(plain, skipped.value, 4))).toContain('placement 0/12 off');
    expect(
      summaryOf(catanProgress(none, runCatanGeneration(none, new SeededRandomSource(3)), 2)),
    ).toEqual(['draws 3/3 now', 'placement 0/12 off', 'resources 0/0 off']);
  });

  it('assigns every kind of step to its phase', () => {
    const kinds = generation.steps.map(({ step }) => catanPhaseOf(step));

    expect(new Set(kinds)).toEqual(new Set(['draws', 'order', 'placement', 'resources']));
  });
});
