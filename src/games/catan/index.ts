/**
 * Public interface of the game module Catan (Architecture 5.1). Other modules import only
 * through this file (Development Guidelines 4.5). Everything that only concerns Catan lies
 * here: board, placement, editions and resources (ADR-028).
 */
export {
  CATAN_BOARD,
  CATAN_BOARD_RADIUS,
  createBoard,
  type Board,
  type Edge,
  type EdgeId,
  type Hex,
  type Vertex,
  type VertexId,
} from './board/board';
export { hexCenter, hexCorners, vertexPoint, type BoardPoint } from './board/geometry';
export { addHex, hexDistance, hexesWithin, hexKey, type HexCoord } from './board/hexCoord';
export { CATAN_GAME_ID, CATAN_MODULE } from './catanModule';
export {
  MAX_PLAN_ATTEMPTS,
  RetryOnDeadEnd,
  type BuildingPlanner,
  type PlanInput,
  type PlanResult,
} from './placement/planner';
export { drawRoad } from './placement/road';
export {
  CATAN_EDITIONS,
  catanPlacementRounds,
  type CatanBuildingType,
  type CatanEdition,
} from './placement/rounds';
export {
  CATAN_STANDARD_RULES,
  distanceRule,
  drawBuilding,
  inlandOnly,
  validVertices,
  type PlacementState,
  type VertexRule,
} from './placement/rules';
export { placementSchedule, type PlacementTurn } from './placement/schedule';
export {
  CATAN_RESOURCES,
  CATAN_STARTING_RESOURCES_COUNT,
  drawCatanStartingResources,
  type CatanResource,
  type StartingResourcesOptions,
} from './startingResources';
