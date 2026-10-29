import { createBoard, hexesWithin, type VertexId } from '@/core/board';
import { ScriptedRandomSource } from '@tests/support/scriptedRandomSource';
import { describe, expect, it } from 'vitest';
import { drawBuilding, validVertices, type VertexRule } from './rules';

// A single hex: six vertices in a ring. The rules are toys; the rules of Catan and their tests
// lie in games/catan (ADR-028).
const board = createBoard(hexesWithin(0));
const ring = [...board.vertices.keys()];
const free: VertexRule = { allows: (vertex, state) => !state.occupied.has(vertex) };
const notFirst: VertexRule = { allows: (vertex) => vertex !== ring[0] };

describe('Architecture 5.3 placement rules as building blocks', () => {
  it('without rules every vertex is valid, in the fixed order of the board', () => {
    expect(validVertices(board, [], [])).toEqual(ring);
  });

  it('NFA-EW-02: a vertex is valid only if every rule of the mode allows it', () => {
    const occupied = ring.slice(3, 4);

    expect(validVertices(board, [free], occupied)).toEqual(ring.filter((v) => v !== ring[3]));
    expect(validVertices(board, [free, notFirst], occupied)).toEqual([
      ring[1],
      ring[2],
      ring[4],
      ring[5],
    ]);
  });

  it('keeps the order of the board, independent of the order of the occupied vertices', () => {
    const occupied = [ring[4], ring[1]] as VertexId[];

    expect(validVertices(board, [free], occupied)).toEqual(
      validVertices(board, [free], [...occupied].reverse()),
    );
  });
});

describe('US-PL-02 Draw a building', () => {
  it('AK-3: maps the words 0 … m − 1 one to one onto the m valid vertices (exhaustive)', () => {
    // NFA-ZF-02: uniformInt is proven exactly in core/random/uniform.test.ts; so every valid
    // vertex has probability 1/m.
    const occupied = ring.slice(0, 2);
    const valid = validVertices(board, [free], occupied);

    const drawn = valid.map((_, word) =>
      drawBuilding(board, [free], occupied, new ScriptedRandomSource([word])),
    );

    expect(drawn).toEqual(valid);
  });

  it('returns undefined in a dead end without using a random word', () => {
    const rng = new ScriptedRandomSource([]);

    expect(drawBuilding(board, [free], ring, rng)).toBeUndefined();
    expect(rng.consumed).toBe(0);
  });
});
