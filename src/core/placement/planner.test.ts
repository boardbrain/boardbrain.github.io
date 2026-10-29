import { createBoard, hexesWithin, type VertexId } from '@/core/board';
import { InvariantError } from '@/core/shared';
import { defined } from '@tests/support/defined';
import { wordsForBuildings } from '@tests/support/placementCases';
import { ScriptedRandomSource } from '@tests/support/scriptedRandomSource';
import { SeededRandomSource } from '@tests/support/seededRandomSource';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { MAX_PLAN_ATTEMPTS, RetryOnDeadEnd } from './planner';
import type { VertexRule } from './rules';

const FC_SEED = 20261029;

// A single hex: six vertices in a ring, and a toy rule that keeps buildings apart. Three
// buildings fit only on every second vertex; two opposite buildings are a dead end. The rules
// of Catan and their tests lie in games/catan (ADR-028).
const board = createBoard(hexesWithin(0));
const neighboursOf = (vertex: VertexId): readonly VertexId[] =>
  board.vertices.get(vertex)?.neighbours ?? [];
const apart: VertexRule = {
  allows: (vertex, state) =>
    !state.occupied.has(vertex) && neighboursOf(vertex).every((n) => !state.occupied.has(n)),
};
const rules = [apart];
const first = defined([...board.vertices.keys()][0], 'a vertex of the ring');
const [left, right] = neighboursOf(first);
const opposite = defined(
  [...board.vertices.keys()].find(
    (vertex) =>
      vertex !== first &&
      !neighboursOf(first).includes(vertex) &&
      !neighboursOf(defined(left, 'left')).includes(vertex) &&
      !neighboursOf(defined(right, 'right')).includes(vertex),
  ),
  'the vertex opposite the first',
);
const everySecond = [
  first,
  ...neighboursOf(defined(left, 'left')).filter((v) => v !== first),
  ...neighboursOf(defined(right, 'right')).filter((v) => v !== first),
];
const planner = new RetryOnDeadEnd();

describe('Architecture 5.4 RetryOnDeadEnd (ADR-010, NFA-EW-08)', () => {
  it('US-PL-02 AK-4: discards a run ending in a dead end and returns the next complete run', () => {
    const rng = new ScriptedRandomSource([
      ...wordsForBuildings(board, rules, [], [first, opposite]),
      ...wordsForBuildings(board, rules, [], everySecond),
    ]);

    const result = planner.plan({ board, rules, fixed: [], total: 3 }, rng);

    expect(result).toEqual({ buildings: everySecond, attempts: 2 });
    expect(rng.consumed).toBe(2 + 3);
  });

  it('US-PL-02 AK-4: keeps the fixed buildings and draws only the open ones (property)', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer({ min: 0, max: 3 }), (seed, fixedCount) => {
        const fixed = everySecond.slice(0, fixedCount);
        const { buildings } = planner.plan(
          { board, rules, fixed, total: 3 },
          new SeededRandomSource(seed),
        );
        const all = [...fixed, ...buildings];
        return (
          buildings.length === 3 - fixedCount &&
          new Set(all).size === 3 &&
          all.every((v) => !neighboursOf(v).some((n) => all.includes(n)))
        );
      }),
      { seed: FC_SEED },
    );
  });

  it('returns nothing to draw when all buildings are fixed', () => {
    expect(
      planner.plan({ board, rules, fixed: everySecond, total: 3 }, new ScriptedRandomSource([])),
    ).toEqual({ buildings: [], attempts: 1 });
  });

  it('throws a RangeError for a total below the fixed buildings or not an integer', () => {
    const rng = new SeededRandomSource(1);

    expect(() => planner.plan({ board, rules, fixed: everySecond, total: 2 }, rng)).toThrow(
      RangeError,
    );
    expect(() => planner.plan({ board, rules, fixed: [], total: 2.5 }, rng)).toThrow(RangeError);
  });

  it('guards against programming errors with an upper bound of runs', () => {
    // Two opposite fixed buildings leave no valid vertex, so every run ends in a dead end.
    const input = { board, rules, fixed: [first, opposite], total: 3 };

    expect(MAX_PLAN_ATTEMPTS).toBe(10_000);
    expect(() => planner.plan(input, new ScriptedRandomSource([]))).toThrow(InvariantError);
    expect(() => new RetryOnDeadEnd(3).plan(input, new ScriptedRandomSource([]))).toThrow(
      'no placement found in 3 attempts',
    );
  });
});
