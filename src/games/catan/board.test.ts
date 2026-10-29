import { createBoard, hexesWithin, type Board, type VertexId } from '@/core/board';
import { describe, expect, it } from 'vitest';
import { CATAN_BOARD, CATAN_BOARD_RADIUS } from './board';

// Number of items per key, in the order the keys first occur.
function countBy<T, K>(items: Iterable<T>, keyOf: (item: T) => K): Map<K, number> {
  const counts = new Map<K, number>();
  for (const item of items) {
    counts.set(keyOf(item), (counts.get(keyOf(item)) ?? 0) + 1);
  }
  return counts;
}

function neighboursOf(board: Board, id: VertexId): readonly VertexId[] {
  return board.vertices.get(id)?.neighbours ?? [];
}

describe('US-PL-01 Catan board (Requirements 6.1, FA-PL-07)', () => {
  it('is the board of radius 2 around the centre hex', () => {
    expect(CATAN_BOARD_RADIUS).toBe(2);
  });

  it('AK-1: has 19 hexes in rows of 3, 4, 5, 4 and 3 from top to bottom', () => {
    const rows = countBy(CATAN_BOARD.hexes, (hex) => hex.coord.r);

    expect(CATAN_BOARD.hexes).toHaveLength(19);
    expect([...rows.keys()]).toEqual([-2, -1, 0, 1, 2]);
    expect([...rows.values()]).toEqual([3, 4, 5, 4, 3]);
  });

  it('has 54 vertices, 72 edges and 24 inland vertices', () => {
    expect(CATAN_BOARD.vertices.size).toBe(54);
    expect(CATAN_BOARD.edges.size).toBe(72);
    expect(CATAN_BOARD.inlandVertices).toHaveLength(24);
  });

  it('inland vertices are exactly the corners of the centre and the six hexes around it', () => {
    const innerCorners = [...createBoard(hexesWithin(1)).vertices.keys()].sort();

    expect([...CATAN_BOARD.inlandVertices].sort()).toEqual(innerCorners);
  });

  it('every inland vertex has exactly three edges and three neighbours', () => {
    for (const id of CATAN_BOARD.inlandVertices) {
      const vertex = CATAN_BOARD.vertices.get(id);

      expect(vertex?.edges).toHaveLength(3);
      expect(vertex?.neighbours).toHaveLength(3);
      expect(vertex?.landHexCount).toBe(3);
    }
  });

  it('neighbourhood is symmetric and every edge connects two neighbours', () => {
    for (const vertex of CATAN_BOARD.vertices.values()) {
      for (const other of vertex.neighbours) {
        expect(neighboursOf(CATAN_BOARD, other)).toContain(vertex.id);
      }
    }
    for (const edge of CATAN_BOARD.edges.values()) {
      const [a, b] = edge.vertices;

      expect(neighboursOf(CATAN_BOARD, a)).toContain(b);
      expect(CATAN_BOARD.vertices.get(a)?.edges).toContain(edge.id);
      expect(CATAN_BOARD.vertices.get(b)?.edges).toContain(edge.id);
    }
  });

  it('AK-2: every hex is without content (FA-PL-08, NFA-EW-03)', () => {
    expect(CATAN_BOARD.hexes.map((hex) => hex.content)).toEqual(
      Array.from({ length: 19 }, () => null),
    );
  });

  it('the coast has 12 vertices with two and 18 with one land hex (PP-01)', () => {
    const counts = countBy(CATAN_BOARD.vertices.values(), (vertex) => vertex.landHexCount);

    expect(counts.get(2)).toBe(12);
    expect(counts.get(1)).toBe(18);
  });

  it('has 30 coast edges and 42 edges between two land hexes', () => {
    const counts = countBy(CATAN_BOARD.edges.values(), (edge) => edge.landHexCount);

    expect(counts.get(1)).toBe(30);
    expect(counts.get(2)).toBe(42);
  });

  it('has one closed coastline of 30 vertices in order', () => {
    expect(CATAN_BOARD.coastlines).toHaveLength(1);
    const [coast = []] = CATAN_BOARD.coastlines;

    expect(coast).toHaveLength(30);
    expect(new Set(coast).size).toBe(30);
    coast.forEach((id, index) => {
      const next = coast[(index + 1) % coast.length];

      expect(neighboursOf(CATAN_BOARD, id)).toContain(next);
    });
  });

  it('ids depend only on the coordinates, so they are the same on every device', () => {
    const again = createBoard([...hexesWithin(2)].reverse());

    expect([...again.vertices.keys()].sort()).toEqual([...CATAN_BOARD.vertices.keys()].sort());
    expect([...again.edges.keys()].sort()).toEqual([...CATAN_BOARD.edges.keys()].sort());
  });
});
