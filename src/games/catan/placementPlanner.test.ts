import type { VertexId } from '@/core/board';
import { defined } from '@tests/support/defined';
import { centreBlockers, wordsForBuildings } from '@tests/support/placementCases';
import { ScriptedRandomSource } from '@tests/support/scriptedRandomSource';
import { SeededRandomSource } from '@tests/support/seededRandomSource';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { RetryOnDeadEnd, type PlanResult } from '@/core/placement';
import { CATAN_BOARD } from './board';
import { CATAN_STANDARD_RULES } from './placementRules';

const FC_SEED = 20261029;
const board = CATAN_BOARD;
const rules = CATAN_STANDARD_RULES;
const planner = new RetryOnDeadEnd();

// Every building inland and no two buildings on neighbouring or equal vertices.
function isValidPlacement(buildings: readonly VertexId[]): boolean {
  return buildings.every(
    (vertex, index) =>
      board.inlandVertices.includes(vertex) &&
      buildings.every(
        (other, otherIndex) =>
          otherIndex === index ||
          (other !== vertex && !(board.vertices.get(vertex)?.neighbours ?? []).includes(other)),
      ),
  );
}

function planFor(personCount: number, seed: number, fixed: readonly VertexId[] = []): PlanResult {
  return planner.plan(
    { board, rules, fixed, total: 2 * personCount },
    new SeededRandomSource(seed),
  );
}

describe('US-PL-02 Place buildings with RetryOnDeadEnd (Architecture 5.4, ADR-010)', () => {
  it('AK-3: places all buildings on inland vertices with the distance rule (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 4 }), fc.integer(), (personCount, seed) => {
        const { buildings } = planFor(personCount, seed);
        return buildings.length === 2 * personCount && isValidPlacement(buildings);
      }),
      { seed: FC_SEED, numRuns: 500 },
    );
  });

  it('Requirements 6.2.4: with 2 and 3 persons a plan never needs more than one run (property)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 3 }),
        fc.integer(),
        (personCount, seed) => planFor(personCount, seed).attempts === 1,
      ),
      { seed: FC_SEED, numRuns: 1000 },
    );
  });

  it('AK-4: discards a run ending in a dead end and returns only the next complete run', () => {
    const blockers = centreBlockers(board);
    const complete = planFor(4, 11).buildings;
    const rng = new ScriptedRandomSource([
      ...wordsForBuildings(board, rules, [], blockers),
      ...wordsForBuildings(board, rules, [], complete),
    ]);

    const result = planner.plan({ board, rules, fixed: [], total: 8 }, rng);

    expect(result).toEqual({ buildings: complete, attempts: 2 });
    expect(rng.consumed).toBe(blockers.length + complete.length);
  });

  it('AK-4: a retry starts again at the first open building, never before it', () => {
    // Buildings 1 to 5 are fixed; the sixth blocker leads into a dead end at building 7.
    const blockers = centreBlockers(board);
    const fixed = blockers.slice(0, 5);
    const [, , , , , sixth] = blockers;
    const rescue = planner.plan(
      { board, rules, fixed, total: 8 },
      new SeededRandomSource(3),
    ).buildings;
    const rng = new ScriptedRandomSource([
      ...wordsForBuildings(board, rules, fixed, [defined(sixth, 'the sixth blocker')]),
      ...wordsForBuildings(board, rules, fixed, rescue),
    ]);

    const result = planner.plan({ board, rules, fixed, total: 8 }, rng);

    expect(result).toEqual({ buildings: rescue, attempts: 2 });
    expect(isValidPlacement([...fixed, ...result.buildings])).toBe(true);
  });

  it('AK-4: keeps the shown buildings when building k is repeated, with 4 persons (property)', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), fc.integer({ min: 1, max: 8 }), (seed, again, k) => {
        const fixed = planFor(4, seed).buildings.slice(0, k - 1);
        const { buildings } = planFor(4, again, fixed);
        return buildings.length === 9 - k && isValidPlacement([...fixed, ...buildings]);
      }),
      { seed: FC_SEED, numRuns: 500 },
    );
  });
});
