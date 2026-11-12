import type { RandomSource } from '@/core/random';
import { InvariantError } from '@/core/shared';
import type { Board, VertexId } from '../board/board';
import { drawBuilding, type VertexRule } from './rules';

/**
 * Input of a plan: the buildings already shown stay fixed, the planner draws the rest up to
 * `total` (Architecture 5.4).
 */
export type PlanInput = {
  readonly board: Board;
  readonly rules: readonly VertexRule[];
  /** Buildings 1 … k − 1 in placement order; they are never taken back (US-PL-02 AK-4). */
  readonly fixed: readonly VertexId[];
  /** Number of buildings of the whole placement, e.g. 8 for 4 persons. */
  readonly total: number;
};

/**
 * Result of a plan: the vertices of buildings `fixed.length + 1` … `total` in placement order.
 */
export type PlanResult = {
  readonly buildings: readonly VertexId[];
  /** Number of runs including the successful one; 1 means no dead end (NFA-EW-08). */
  readonly attempts: number;
};

/**
 * Exchangeable strategy for dead ends (NFA-EW-08, ADR-010). Version 1 uses `RetryOnDeadEnd`;
 * a look-ahead variant (PP-14) would be a second implementation.
 */
export type BuildingPlanner = {
  readonly plan: (input: PlanInput, rng: RandomSource) => PlanResult;
};

/**
 * Upper bound of runs, only a guard against programming errors (Architecture 5.4).
 */
export const MAX_PLAN_ATTEMPTS = 10_000;

/**
 * Variant B (E-09, Requirements 6.2.5): draws all remaining buildings hidden; a run that ends
 * in a dead end is discarded and drawn again from the first open building. Every single draw
 * stays uniform over the valid vertices (Requirements 6.2.3, 6.2.6). Only a complete run is
 * returned, so nobody ever sees a dead end (US-PL-02 AK-4).
 */
export class RetryOnDeadEnd implements BuildingPlanner {
  private readonly maxAttempts: number;

  constructor(maxAttempts: number = MAX_PLAN_ATTEMPTS) {
    this.maxAttempts = maxAttempts;
  }

  /**
   * @throws {RangeError} if `total` is not an integer of at least `fixed.length`.
   * @throws {InvariantError} if no run succeeds within the bound; with a solvable start this
   *   does not happen in practice (Architecture 5.4, termination).
   */
  plan({ board, rules, fixed, total }: PlanInput, rng: RandomSource): PlanResult {
    if (!Number.isInteger(total) || total < fixed.length) {
      throw new RangeError(
        `total must be an integer of at least ${String(fixed.length)}, got ${String(total)}`,
      );
    }
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      const buildings = drawRun(board, rules, fixed, total, rng);
      if (buildings !== undefined) {
        return { buildings, attempts: attempt };
      }
    }
    throw new InvariantError(`no placement found in ${String(this.maxAttempts)} attempts`);
  }
}

// One hidden run; undefined if it ends in a dead end.
function drawRun(
  board: Board,
  rules: readonly VertexRule[],
  fixed: readonly VertexId[],
  total: number,
  rng: RandomSource,
): VertexId[] | undefined {
  const occupied = [...fixed];
  while (occupied.length < total) {
    const vertex = drawBuilding(board, rules, occupied, rng);
    if (vertex === undefined) {
      return undefined;
    }
    occupied.push(vertex);
  }
  return occupied.slice(fixed.length);
}
