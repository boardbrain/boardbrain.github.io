import type { StoredSession } from '@/app/ports';
import { stepsDiscardedBy } from '@/core/generation';
import type { PersonId } from '@/core/model';
import { CATAN_GENERATION, catanSummary, type CatanStep } from '@/games/catan';
import { t } from '@/i18n/t';
import type { BoardBuilding, BoardRoad, PieceMarking } from '@/ui/board/Board';
import { stepTitle } from './matchTexts';

/**
 * The pieces of a match on the board (US-PL-04), each with the name of its tap area and its
 * step (US-AB-03 AK-8).
 */
export type MatchBoardPieces = {
  readonly buildings: readonly BoardBuilding[];
  readonly roads: readonly BoardRoad[];
  /** The step of each piece by its key, to repeat it. */
  readonly stepOf: ReadonlyMap<string, number>;
};

// The key of a piece on the board: its kind and the index of the building it belongs to.
function pieceKey(step: CatanStep): string | null {
  return step.kind === 'building' || step.kind === 'road'
    ? `${step.kind}-${String(step.index)}`
    : null;
}

/**
 * The buildings and roads of `session` for the board, named for repeating them ("Siedlung von
 * Anna wiederholen", US-AB-03 AK-8).
 */
export function matchBoardPieces(
  session: StoredSession,
  nameOf: (personId: PersonId) => string,
): MatchBoardPieces {
  const summary = catanSummary(session.setup, session.generation);
  const steps = session.generation.steps;
  const label = (index: number): string => {
    const step = steps[index]?.step;
    return step === undefined
      ? ''
      : t('partie.stueckWiederholen', { stueck: stepTitle(step, nameOf) });
  };
  const vertexOf = new Map(summary.buildings.map((building) => [building.index, building.vertex]));
  const stepOf = new Map<string, number>();
  const buildings = summary.buildings.map((building) => {
    const key = `building-${String(building.index)}`;
    stepOf.set(key, building.stepIndex);
    return {
      key,
      vertex: building.vertex,
      type: building.type,
      color: building.catanColor,
      label: label(building.stepIndex),
    };
  });
  const roads = summary.roads.flatMap((road) => {
    const from = vertexOf.get(road.index);
    if (from === undefined) {
      return [];
    }
    const key = `road-${String(road.index)}`;
    stepOf.set(key, road.stepIndex);
    return [{ key, edge: road.edge, from, color: road.catanColor, label: label(road.stepIndex) }];
  });
  return { buildings, roads, stepOf };
}

/**
 * The pieces marked while repeating step `index` is asked (US-AB-03 AK-8, design I2-H): the
 * piece itself and the pieces discarded with it, i.e. with a building its road and all later
 * pieces (AK-4), with a road nothing else (AK-3). `null` if the step is no piece.
 */
export function pieceMarking(session: StoredSession, index: number): PieceMarking | null {
  const { setup, generation } = session;
  const step = generation.steps[index]?.step;
  const main = step === undefined ? null : pieceKey(step);
  if (main === null) {
    return null;
  }
  const others = stepsDiscardedBy(CATAN_GENERATION, setup, generation, index).flatMap((other) => {
    const discarded = generation.steps[other]?.step;
    const key = discarded === undefined ? null : pieceKey(discarded);
    return key === null ? [] : [key];
  });
  return { main, others };
}
