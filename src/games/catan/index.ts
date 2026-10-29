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
export { canPlayCatan } from './eligibility';
export {
  CATAN_GENERATION,
  CATAN_INITIAL_GAME_STATE,
  canSkipCatanPlacement,
  catanPlacementOrder,
  createCatanGeneration,
  skipCatanPlacement,
  type CatanGameState,
  type CatanGeneration,
  type CatanGenerationDefinition,
  type PlacementNotSkippableError,
} from './generation/definition';
export {
  CATAN_DEFAULT_OPTIONS,
  CATAN_DEFAULT_STARTING_RESOURCES,
  CATAN_MODES,
  CATAN_PERSON_DRAWS,
  areCatanOptionsValid,
  enabledPersonDraws,
  type CatanMode,
  type CatanOptions,
  type CatanPersonDraw,
  type CatanSetup,
} from './generation/options';
export type {
  CatanBuildingStep,
  CatanOrderSpinStep,
  CatanPersonDrawStep,
  CatanRoadStep,
  CatanStartingResourcesStep,
  CatanStep,
} from './generation/steps';
export {
  catanSummary,
  type CatanSummary,
  type CatanSummaryBuilding,
  type CatanSummaryOrderSpin,
  type CatanSummaryPersonDraw,
  type CatanSummaryRoad,
  type CatanSummaryStartingResources,
} from './generation/summary';
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
