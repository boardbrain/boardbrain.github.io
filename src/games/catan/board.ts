import { createBoard, hexesWithin, type Board } from '@/core/board';

/**
 * Radius of the Catan board: all hexes at most two steps from the centre, rows 3, 4, 5, 4, 3
 * (FA-PL-07).
 */
export const CATAN_BOARD_RADIUS = 2;

/**
 * The standard board of Catan with 19 hexes, 54 vertices, 72 edges and 24 inland vertices
 * (Requirements 6.1, FA-PL-07).
 */
export const CATAN_BOARD: Board = createBoard(hexesWithin(CATAN_BOARD_RADIUS));
