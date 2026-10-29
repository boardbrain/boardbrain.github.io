import type { Board, VertexId } from '@/core/board';
import { pick, type RandomSource } from '@/core/random';

/**
 * State of the board while buildings are placed: which vertices already carry a building.
 */
export type PlacementState = {
  readonly board: Board;
  readonly occupied: ReadonlySet<VertexId>;
};

/**
 * A placement rule decides whether a building may stand on a vertex in the current state
 * (Architecture 5.3, NFA-EW-02). A mode is a list of rules; later modes add or replace rules
 * without changing the existing ones. The concrete rules belong to the game module, e.g. the
 * rules of Catan in `games/catan` (ADR-028).
 */
export type VertexRule = {
  readonly allows: (vertex: VertexId, state: PlacementState) => boolean;
};

/**
 * All vertices allowed by every rule, in the fixed order of the board, so the same random
 * word always selects the same vertex.
 */
export function validVertices(
  board: Board,
  rules: readonly VertexRule[],
  occupied: Iterable<VertexId>,
): VertexId[] {
  const state: PlacementState = { board, occupied: new Set(occupied) };
  return [...board.vertices.keys()].filter((vertex) =>
    rules.every((rule) => rule.allows(vertex, state)),
  );
}

/**
 * Draws the vertex of the next building (US-PL-02 AK-3, Requirements 6.2.3): each valid
 * vertex with the same probability. Returns `undefined` for a dead end, where no valid vertex
 * is left (Requirements 6.2.4); then no random word is used.
 */
export function drawBuilding(
  board: Board,
  rules: readonly VertexRule[],
  occupied: Iterable<VertexId>,
  rng: RandomSource,
): VertexId | undefined {
  const valid = validVertices(board, rules, occupied);
  return valid.length === 0 ? undefined : pick(valid, rng);
}
