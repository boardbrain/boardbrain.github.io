/**
 * Public interface of the module `core/draws`: drawing a person, drawing the order (FA-LS-*).
 *
 * Other modules import only through this file (Architecture 4.3). Drawing persons concerns
 * persons and groups, so it lies here; what only concerns Catan, e.g. its starting resources,
 * lies in the Catan module (ADR-028).
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
