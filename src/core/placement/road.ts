import type { Board, EdgeId, VertexId } from '@/core/board';
import { pick, type RandomSource } from '@/core/random';
import { assert } from '@/core/shared';

/**
 * Draws the road of a building just placed (US-PL-03, Requirements 6.3): each edge at the
 * building's vertex with the same probability. No further restrictions apply, so the road may
 * run along the coast or touch roads and buildings of other persons. Roads are not planned
 * ahead, because they depend on nothing but their own building (Architecture 5.4).
 * @throws {InvariantError} if the vertex is not on the board.
 */
export function drawRoad(board: Board, building: VertexId, rng: RandomSource): EdgeId {
  const vertex = board.vertices.get(building);
  assert(vertex !== undefined, 'the building stands on a vertex of the board');
  return pick(vertex.edges, rng);
}
