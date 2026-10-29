import type { VertexRule } from '@/core/placement';

/**
 * Requirements 6.2.1: buildings stand only on inland vertices, i.e. vertices with three land
 * hexes.
 */
export const inlandOnly: VertexRule = {
  allows: (vertex, state) => state.board.vertices.get(vertex)?.landHexCount === 3,
};

/**
 * Requirements 6.2.2, distance rule: a vertex is free and none of its neighbours carries a
 * building.
 */
export const distanceRule: VertexRule = {
  allows: (vertex, state) =>
    !state.occupied.has(vertex) &&
    (state.board.vertices.get(vertex)?.neighbours ?? []).every(
      (neighbour) => !state.occupied.has(neighbour),
    ),
};

/**
 * Rules of Catan, mode "Standard" (Requirements 6.2, FA-PL-01). Later modes such as coastal
 * vertices (PP-01) add or replace rules without changing these (NFA-EW-02).
 */
export const CATAN_STANDARD_RULES: readonly VertexRule[] = [inlandOnly, distanceRule];
