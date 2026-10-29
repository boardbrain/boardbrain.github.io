import { createBoard, hexesWithin, type VertexId } from '@/core/board';
import { InvariantError } from '@/core/shared';
import { defined } from '@tests/support/defined';
import { ScriptedRandomSource } from '@tests/support/scriptedRandomSource';
import { SeededRandomSource } from '@tests/support/seededRandomSource';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { drawRoad } from './road';

const FC_SEED = 20261029;
// Centre hex with its six neighbours: six inland vertices, the others on the coast.
const board = createBoard(hexesWithin(1));

function edgesAt(vertex: VertexId): readonly string[] {
  return board.vertices.get(vertex)?.edges ?? [];
}

describe('US-PL-03 Draw a road', () => {
  it('AK-1: maps the words 0, 1 and 2 onto the three edges at the building (exhaustive)', () => {
    for (const building of board.inlandVertices) {
      const roads = [0, 1, 2].map((word) =>
        drawRoad(board, building, new ScriptedRandomSource([word])),
      );

      expect(roads).toEqual(edgesAt(building));
      expect(new Set(roads).size).toBe(3);
    }
  });

  it('AK-1: every road touches its building (property)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...board.inlandVertices),
        fc.integer(),
        (building, seed) =>
          board.edges
            .get(drawRoad(board, building, new SeededRandomSource(seed)))
            ?.vertices.includes(building) === true,
      ),
      { seed: FC_SEED },
    );
  });

  it('AK-2: has no further restrictions; it only looks at the board and the building', () => {
    // The draw does not even receive the other buildings or roads, so a road may run along the
    // coast or touch roads and buildings of other persons (Requirements 6.3.2).
    const coastal = [...board.vertices.values()].find((vertex) => vertex.landHexCount === 1);
    const building = defined(coastal, 'a coastal vertex').id;

    const roads = edgesAt(building).map((_, word) =>
      drawRoad(board, building, new ScriptedRandomSource([word])),
    );

    expect(roads).toEqual(edgesAt(building));
  });

  it('uses exactly one word per road', () => {
    const rng = new ScriptedRandomSource([2, 0]);

    drawRoad(board, defined(board.inlandVertices[0], 'an inland vertex'), rng);

    expect(rng.consumed).toBe(1);
  });

  it('throws an InvariantError for a vertex that is not on the board', () => {
    expect(() => drawRoad(board, 'v:unknown' as VertexId, new ScriptedRandomSource([0]))).toThrow(
      InvariantError,
    );
  });
});
