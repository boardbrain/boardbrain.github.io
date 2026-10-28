/**
 * Public interface of the module `core/board`: board geometry: hexes, vertices, edges, neighbourhoods (FA-PL-07, NFA-EW-03 to -05).
 *
 * Other modules import only through this file (Architecture 4.3).
 */
export {
  createBoard,
  STANDARD_BOARD,
  STANDARD_BOARD_RADIUS,
  type Board,
  type Edge,
  type EdgeId,
  type Hex,
  type Vertex,
  type VertexId,
} from './board';
export { hexCenter, hexCorners, vertexPoint, type BoardPoint } from './geometry';
export { addHex, hexDistance, hexesWithin, hexKey, type HexCoord } from './hexCoord';
