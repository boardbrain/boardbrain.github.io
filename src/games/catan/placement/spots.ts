import { CATAN_BOARD, type EdgeId, type VertexId } from '../board/board';
import type { CatanBuildingStep, CatanRoadStep, CatanStep } from '../generation/steps';
import { CATAN_STANDARD_RULES, validVertices } from './rules';

/**
 * The places a piece could have been drawn on, for the highlighting before it is fixed
 * (US-IN-02 AK-2): for a building the valid vertices by the placement rules, given the buildings
 * before it; for a road the edges at its building. `null` if the building of a road is missing.
 */
export type CatanPlacementSpots =
  | { readonly kind: 'building'; readonly vertices: readonly VertexId[] }
  | {
      readonly kind: 'road';
      readonly building: VertexId;
      readonly edges: readonly EdgeId[];
    };

/**
 * The places `piece` could have been drawn on among `steps` (US-IN-02 AK-2): a building on every
 * vertex the rules allow next to the buildings drawn before it (Requirements 6.2), a road on every
 * edge of its building (Requirements 6.3). The drawn place is always among them. Only the
 * buildings with a smaller index count, so a look at an earlier piece gives the same places as
 * when it was drawn.
 */
export function catanPlacementSpots(
  steps: readonly CatanStep[],
  piece: CatanBuildingStep | CatanRoadStep,
): CatanPlacementSpots | null {
  if (piece.kind === 'building') {
    const occupied = steps.flatMap((step) =>
      step.kind === 'building' && step.index < piece.index ? [step.result] : [],
    );
    return {
      kind: 'building',
      vertices: validVertices(CATAN_BOARD, CATAN_STANDARD_RULES, occupied),
    };
  }
  const building = steps.find((step) => step.kind === 'building' && step.index === piece.index);
  const vertex =
    building?.kind === 'building' ? CATAN_BOARD.vertices.get(building.result) : undefined;
  return vertex === undefined ? null : { kind: 'road', building: vertex.id, edges: vertex.edges };
}
