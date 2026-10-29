import { CATAN_BOARD, type VertexId } from '../board/board';
import { defined } from '@tests/support/defined';
import { centreBlockers } from '@tests/support/placementCases';
import { ScriptedRandomSource } from '@tests/support/scriptedRandomSource';
import { SeededRandomSource } from '@tests/support/seededRandomSource';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { RetryOnDeadEnd } from './planner';
import {
  CATAN_STANDARD_RULES,
  distanceRule,
  drawBuilding,
  inlandOnly,
  validVertices,
  type VertexRule,
} from './rules';

const FC_SEED = 20261029;
const board = CATAN_BOARD;

function neighboursOf(id: VertexId): readonly VertexId[] {
  return board.vertices.get(id)?.neighbours ?? [];
}

// A centre corner: inland, and all three neighbours are inland as well.
const centreCorner = defined(
  [...board.vertices.values()].find((vertex) =>
    vertex.hexes.some((hex) => hex.q === 0 && hex.r === 0),
  )?.id,
  'a centre corner',
);

describe('Requirements 6.2 placement rules as building blocks (Architecture 5.3)', () => {
  it('6.2.1: inlandOnly allows exactly the 24 inland vertices', () => {
    const allowed = validVertices(board, [inlandOnly], []);

    expect(allowed).toHaveLength(24);
    expect(new Set(allowed)).toEqual(new Set(board.inlandVertices));
  });

  it('6.2.1: inlandOnly does not allow a vertex that is not on the board', () => {
    const state = { board, occupied: new Set<VertexId>() };

    expect(inlandOnly.allows('v:unknown' as VertexId, state)).toBe(false);
  });

  it('6.2.2: distanceRule leaves a vertex outside the board to the other rules', () => {
    // It has no neighbours on the board; inlandOnly rejects it in every Catan mode.
    const state = { board, occupied: new Set<VertexId>() };

    expect(distanceRule.allows('v:unknown' as VertexId, state)).toBe(true);
    expect(validVertices(board, CATAN_STANDARD_RULES, [])).not.toContain('v:unknown');
  });

  it('6.2.2: distanceRule allows every vertex of an empty board', () => {
    expect(validVertices(board, [distanceRule], [])).toHaveLength(54);
  });

  it('6.2.2: distanceRule forbids the occupied vertex and its neighbours, nothing else', () => {
    const building = defined(board.inlandVertices[0], 'an inland vertex');
    const blocked = new Set([building, ...neighboursOf(building)]);

    const allowed = validVertices(board, [distanceRule], [building]);

    expect(allowed).toHaveLength(54 - blocked.size);
    expect(allowed.some((vertex) => blocked.has(vertex))).toBe(false);
  });

  it('NFA-EW-02: a mode is a list of rules; the Catan rules combine both building blocks', () => {
    expect(CATAN_STANDARD_RULES).toEqual([inlandOnly, distanceRule]);
    expect(new Set(validVertices(board, CATAN_STANDARD_RULES, []))).toEqual(
      new Set(board.inlandVertices),
    );
  });

  it('NFA-EW-02: an additional rule narrows the valid vertices without changing the others', () => {
    const notCentreCorner: VertexRule = { allows: (vertex) => vertex !== centreCorner };

    const allowed = validVertices(board, [...CATAN_STANDARD_RULES, notCentreCorner], []);

    expect(allowed).toHaveLength(23);
    expect(allowed).not.toContain(centreCorner);
  });

  it('keeps the fixed order of the board, independent of the order of the occupied vertices', () => {
    const occupied = [
      defined(board.inlandVertices[0], 'inland vertex 0'),
      defined(board.inlandVertices[12], 'inland vertex 12'),
    ];

    expect(validVertices(board, CATAN_STANDARD_RULES, occupied)).toEqual(
      validVertices(board, CATAN_STANDARD_RULES, [...occupied].reverse()),
    );
  });
});

describe('US-PL-02 Draw a building', () => {
  it('AK-3: maps every accepted word onto exactly one valid vertex (exhaustive)', () => {
    // NFA-ZF-02: uniformInt is proven exactly in core/random/uniform.test.ts; here each valid
    // vertex is hit by exactly one of the words 0 … m − 1, so each has probability 1/m.
    const states: VertexId[][] = [[], [centreCorner]];
    const plan = new RetryOnDeadEnd().plan(
      { board, rules: CATAN_STANDARD_RULES, fixed: [], total: 8 },
      new SeededRandomSource(7),
    );
    for (let count = 1; count < plan.buildings.length; count++) {
      states.push(plan.buildings.slice(0, count));
    }

    for (const occupied of states) {
      const valid = validVertices(board, CATAN_STANDARD_RULES, occupied);
      const drawn = valid.map((_, word) =>
        drawBuilding(board, CATAN_STANDARD_RULES, occupied, new ScriptedRandomSource([word])),
      );

      expect(drawn).toEqual(valid);
    }
  });

  it('AK-3: the empty board offers 24 vertices, after a centre corner 20 remain', () => {
    expect(validVertices(board, CATAN_STANDARD_RULES, [])).toHaveLength(24);
    expect(validVertices(board, CATAN_STANDARD_RULES, [centreCorner])).toHaveLength(20);
  });

  it('AK-3: every drawn vertex is inland and has no occupied neighbour (property)', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.integer({ min: 0, max: 7 }),
        fc.integer({ min: 0, max: 2 ** 32 - 1 }),
        (seed, count, word) => {
          const plan = new RetryOnDeadEnd().plan(
            { board, rules: CATAN_STANDARD_RULES, fixed: [], total: 8 },
            new SeededRandomSource(seed),
          );
          const occupied = plan.buildings.slice(0, count);
          const vertex = drawBuilding(
            board,
            CATAN_STANDARD_RULES,
            occupied,
            new SeededRandomSource(word),
          );
          // A dead end can only arise from the seventh building on.
          if (vertex === undefined) {
            return count >= 6;
          }
          return (
            board.inlandVertices.includes(vertex) &&
            !occupied.includes(vertex) &&
            neighboursOf(vertex).every((neighbour) => !occupied.includes(neighbour))
          );
        },
      ),
      { seed: FC_SEED, numRuns: 300 },
    );
  });

  it('Requirements 6.2.4: the six vertices outward of the centre corners form a dead end', () => {
    const blockers = centreBlockers(board);

    expect(new Set(blockers).size).toBe(6);
    expect(blockers.every((vertex) => board.inlandVertices.includes(vertex))).toBe(true);
    expect(
      blockers.every((vertex) => neighboursOf(vertex).every((n) => !blockers.includes(n))),
    ).toBe(true);
    expect(validVertices(board, CATAN_STANDARD_RULES, blockers)).toEqual([]);
  });

  it('returns undefined in a dead end without using a random word', () => {
    const rng = new ScriptedRandomSource([]);

    expect(drawBuilding(board, CATAN_STANDARD_RULES, centreBlockers(board), rng)).toBeUndefined();
    expect(rng.consumed).toBe(0);
  });
});
