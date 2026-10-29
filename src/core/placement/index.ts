/**
 * Public interface of the module `core/placement`: placement rules as building blocks and dead-end strategy (FA-PL-01 to -04, NFA-EW-02, NFA-EW-08).
 *
 * Other modules import only through this file (Architecture 4.3). The module is
 * game-independent; the rules and kinds of building of a game lie in its game module
 * (ADR-028).
 */
export {
  MAX_PLAN_ATTEMPTS,
  RetryOnDeadEnd,
  type BuildingPlanner,
  type PlanInput,
  type PlanResult,
} from './planner';
export { drawRoad } from './road';
export { drawBuilding, validVertices, type PlacementState, type VertexRule } from './rules';
export { placementSchedule, type PlacementTurn } from './schedule';
