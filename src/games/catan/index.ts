/**
 * Public interface of the game module Catan (Architecture 5.1). Other modules import only
 * through this file (Development Guidelines 4.5). Everything that only concerns Catan lies
 * here, not in `core` (ADR-028).
 */
export { CATAN_BOARD, CATAN_BOARD_RADIUS } from './board';
export { CATAN_GAME_ID, CATAN_MODULE } from './catanModule';
export { CATAN_STANDARD_RULES, distanceRule, inlandOnly } from './placementRules';
export {
  CATAN_EDITIONS,
  catanPlacementRounds,
  type CatanBuildingType,
  type CatanEdition,
} from './placementRounds';
export {
  CATAN_RESOURCES,
  CATAN_STARTING_RESOURCES_COUNT,
  drawCatanStartingResources,
  type CatanResource,
} from './startingResources';
