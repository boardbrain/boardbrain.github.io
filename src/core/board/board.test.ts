import { InvariantError } from '@/core/shared';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createBoard, type Board, type VertexId } from './board';
import { hexesWithin } from './hexCoord';

const FC_SEED = 20261027;

function neighboursOf(board: Board, id: VertexId): readonly VertexId[] {
  return board.vertices.get(id)?.neighbours ?? [];
}

describe('NFA-EW-05 boards of other shapes', () => {
  it('counts hexes, vertices, edges and inland vertices for any radius (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 5 }), (n) => {
        const board = createBoard(hexesWithin(n));
        return (
          board.hexes.length === 3 * n * n + 3 * n + 1 &&
          board.vertices.size === 6 * (n + 1) * (n + 1) &&
          board.edges.size === 3 * (n + 1) * (3 * n + 2) &&
          board.inlandVertices.length === 6 * n * n &&
          board.coastlines.length === 1 &&
          board.coastlines[0]?.length === 12 * n + 6
        );
      }),
      { seed: FC_SEED },
    );
  });

  it('every vertex has two or three neighbours (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 5 }), (n) =>
        [...createBoard(hexesWithin(n)).vertices.values()].every(
          (vertex) => vertex.neighbours.length === 2 || vertex.neighbours.length === 3,
        ),
      ),
      { seed: FC_SEED },
    );
  });

  it('neighbourhood is symmetric and every edge connects two neighbours (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 5 }), (n) => {
        const board = createBoard(hexesWithin(n));
        return (
          [...board.vertices.values()].every((vertex) =>
            vertex.neighbours.every((other) => neighboursOf(board, other).includes(vertex.id)),
          ) &&
          [...board.edges.values()].every(
            ({ id, vertices: [a, b] }) =>
              neighboursOf(board, a).includes(b) &&
              (board.vertices.get(a)?.edges.includes(id) ?? false) &&
              (board.vertices.get(b)?.edges.includes(id) ?? false),
          )
        );
      }),
      { seed: FC_SEED },
    );
  });

  it('every inland vertex has three edges, three neighbours and three land hexes (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 5 }), (n) => {
        const board = createBoard(hexesWithin(n));
        return board.inlandVertices.every((id) => {
          const vertex = board.vertices.get(id);
          return (
            vertex?.edges.length === 3 &&
            vertex.neighbours.length === 3 &&
            vertex.landHexCount === 3
          );
        });
      }),
      { seed: FC_SEED },
    );
  });

  it('ids depend only on the coordinates, not on their order (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 4 }), (n) => {
        const board = createBoard(hexesWithin(n));
        const again = createBoard([...hexesWithin(n)].reverse());
        return (
          [...again.vertices.keys()].sort().join() === [...board.vertices.keys()].sort().join() &&
          [...again.edges.keys()].sort().join() === [...board.edges.keys()].sort().join()
        );
      }),
      { seed: FC_SEED },
    );
  });

  it('NFA-EW-03: every hex is created without content', () => {
    expect(createBoard(hexesWithin(2)).hexes.map((hex) => hex.content)).toEqual(
      Array.from({ length: 19 }, () => null),
    );
  });

  it('finds one coastline per island', () => {
    const board = createBoard([
      { q: 0, r: 0 },
      { q: 5, r: 0 },
    ]);

    expect(board.coastlines).toHaveLength(2);
    expect(board.coastlines.map((coast) => coast.length)).toEqual([6, 6]);
  });

  it('rejects a hex that occurs twice', () => {
    expect(() =>
      createBoard([
        { q: 0, r: 0 },
        { q: 0, r: 0 },
      ]),
    ).toThrow(InvariantError);
  });
});
