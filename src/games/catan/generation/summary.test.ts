import { aCatanSetup, runCatanGeneration } from '@tests/support/catanGeneration';
import { defined } from '@tests/support/defined';
import { SeededRandomSource } from '@tests/support/seededRandomSource';
import { describe, expect, it } from 'vitest';
import { setMatchColor } from '@/core/model';
import { InvariantError } from '@/core/shared';
import { skipCatanPlacement } from './definition';
import { catanSummary } from './summary';

describe('US-AB-04 Overview of the running match (Catan summary)', () => {
  const setup = aCatanSetup(4, {
    edition: 'cities-and-knights',
    startingResources: { count: 2, replacement: 'with' },
  });
  const generation = runCatanGeneration(setup, new SeededRandomSource(42));
  const summary = catanSummary(setup, generation);

  it('AK-1: shows the results of LS-01, LS-03 and LS-04 with their steps', () => {
    expect(summary.personDraws.map((line) => [line.draw, line.stepIndex])).toEqual([
      ['landscapes', 0],
      ['harbors', 1],
      ['numbers', 2],
    ]);
  });

  it('AK-1, US-LS-03 AK-3: shows the order with place 1 as starting person', () => {
    const drawn = summary.orderSpins.map((line) => line.personId);

    expect(summary.orderSpins.map((line) => line.position)).toEqual([0, 1, 2]);
    expect(summary.order?.slice(0, 3)).toEqual(drawn);
    expect(summary.order).toHaveLength(4);
    expect(summary.startingPersonId).toBe(drawn[0]);
  });

  it('AK-1, US-PL-04 AK-1: shows buildings and roads in the colour of the person in this match', () => {
    expect(summary.buildings).toHaveLength(8);
    expect(summary.roads).toHaveLength(8);
    for (const line of [...summary.buildings, ...summary.roads]) {
      const color = setup.colors.find((candidate) => candidate.personId === line.personId);
      expect(line.catanColor).toBe(color?.catanColor);
    }
    expect(summary.buildings.map((line) => line.type).slice(3, 5)).toEqual(['settlement', 'city']);
  });

  it('US-PG-04 AK-1: uses the colours chosen for the match', () => {
    const first = defined(summary.buildings[0], 'first building');
    const changed = { ...setup, colors: setMatchColor(setup.colors, first.personId, 'orange') };

    expect(catanSummary(changed, generation).buildings[0]?.catanColor).toBe('orange');
  });

  it('AK-1, US-SR-01 AK-1: shows the starting resources in placement order', () => {
    expect(summary.startingResources.map((line) => line.personId)).toEqual(summary.order);
    expect(summary.startingResources.every((line) => line.resources.length === 2)).toBe(true);
  });

  it('US-PL-05 AK-2: after skipping, shows order and starting person but no buildings', () => {
    const plain = aCatanSetup(3);
    const atPlacement = runCatanGeneration(plain, new SeededRandomSource(7), undefined, 5);
    const skipped = skipCatanPlacement(plain, atPlacement);
    if (!skipped.ok) throw new Error(skipped.error);

    const overview = catanSummary(plain, skipped.value);

    expect(overview.placementSkipped).toBe(true);
    expect(overview.order).toHaveLength(3);
    expect(overview.startingPersonId).toBe(overview.order?.[0]);
    expect(overview.buildings).toEqual([]);
    expect(overview.roads).toEqual([]);
  });

  it('has no order while spins are missing', () => {
    const early = runCatanGeneration(setup, new SeededRandomSource(1), undefined, 4);

    expect(catanSummary(setup, early)).toMatchObject({ order: null, startingPersonId: null });
  });

  it('throws if a person has no colour in this match', () => {
    expect(() => catanSummary({ ...setup, colors: [] }, generation)).toThrow(InvariantError);
  });
});
