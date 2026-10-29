/**
 * Public interface of the module `core/draws`: drawing a person, drawing the order, drawing from a pool (FA-LS-*, FA-SR-*).
 *
 * Other modules import only through this file (Architecture 4.3). The building blocks are
 * game-independent; what a game draws, e.g. the resources of Catan, lies in its game module.
 */
export { drawFromPool, type PoolDrawOptions } from './drawFromPool';
export { drawPerson } from './drawPerson';
export {
  completeOrder,
  drawOrderSpin,
  drawPlacementOrder,
  orderSpinCount,
  remainingForOrder,
  startingPerson,
} from './placementOrder';
