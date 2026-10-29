import type { Board, VertexId } from '@/core/board';
import { validVertices, type VertexRule } from '@/core/placement';

/**
 * The six inland vertices one edge outward from the corners of the centre hex. They are not
 * adjacent to each other but together block all 24 inland vertices: the dead end of
 * Requirements 6.2.4.
 */
export function centreBlockers(board: Board): VertexId[] {
  const isCentreCorner = (id: VertexId): boolean =>
    board.vertices.get(id)?.hexes.some((hex) => hex.q === 0 && hex.r === 0) ?? false;
  return [...board.vertices.keys()].filter(isCentreCorner).map((corner) => {
    const outward = board.vertices.get(corner)?.neighbours.find((n) => !isCentreCorner(n));
    if (outward === undefined) {
      throw new Error('every centre corner has a neighbour outside the centre hex');
    }
    return outward;
  });
}

/**
 * Random words that make the draws pick the given buildings in this order, starting from the
 * fixed buildings. Each word is the index of the vertex among the valid vertices of its draw.
 */
export function wordsForBuildings(
  board: Board,
  rules: readonly VertexRule[],
  fixed: readonly VertexId[],
  buildings: readonly VertexId[],
): number[] {
  const occupied = [...fixed];
  return buildings.map((building) => {
    const index = validVertices(board, rules, occupied).indexOf(building);
    if (index < 0) {
      throw new Error(`${building} is not valid after ${occupied.join(', ')}`);
    }
    occupied.push(building);
    return index;
  });
}
