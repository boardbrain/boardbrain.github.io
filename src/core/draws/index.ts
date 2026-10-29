/**
 * Public interface of the module `core/draws`: drawing a person, drawing the order, drawing starting resources (FA-LS-*, FA-SR-*).
 *
 * Other modules import only through this file (Architecture 4.3).
 */
export { drawPerson } from './drawPerson';
export {
  completeOrder,
  drawOrderSpin,
  drawPlacementOrder,
  orderSpinCount,
  remainingForOrder,
  startingPerson,
} from './placementOrder';
export {
  drawStartingResources,
  RESOURCES,
  STARTING_RESOURCES_COUNT,
  type Resource,
  type StartingResourcesOptions,
} from './startingResources';
