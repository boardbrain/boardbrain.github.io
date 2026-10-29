import { startingPerson } from '@/core/draws';
import type { CatanColorKey, PersonId } from '@/core/model';
import { assert } from '@/core/shared';
import type { EdgeId, VertexId } from '../board/board';
import type { CatanBuildingType } from '../placement/rounds';
import type { CatanResource } from '../startingResources';
import { catanPlacementOrder, type CatanGeneration } from './definition';
import type { CatanPersonDraw, CatanSetup } from './options';

/**
 * Line of the summary. `stepIndex` is the step it comes from, so it can be selected and
 * repeated (US-AB-03 AK-6).
 */
type SummaryLine<T> = T & { readonly stepIndex: number };

/**
 * Result of LS-01, LS-03 or LS-04 in the summary.
 */
export type CatanSummaryPersonDraw = SummaryLine<{
  readonly draw: CatanPersonDraw;
  readonly personId: PersonId;
}>;

/**
 * One spin of the placement order in the summary.
 */
export type CatanSummaryOrderSpin = SummaryLine<{
  readonly position: number;
  readonly personId: PersonId;
}>;

/**
 * A building in the summary with the Catan colour of the person in this match.
 */
export type CatanSummaryBuilding = SummaryLine<{
  readonly index: number;
  readonly personId: PersonId;
  readonly type: CatanBuildingType;
  readonly vertex: VertexId;
  readonly catanColor: CatanColorKey;
}>;

/**
 * A road in the summary with the Catan colour of the person in this match.
 */
export type CatanSummaryRoad = SummaryLine<{
  readonly index: number;
  readonly personId: PersonId;
  readonly edge: EdgeId;
  readonly catanColor: CatanColorKey;
}>;

/**
 * The starting resources of one person in the summary.
 */
export type CatanSummaryStartingResources = SummaryLine<{
  readonly personId: PersonId;
  readonly resources: readonly CatanResource[];
}>;

/**
 * Overview of a Catan match (US-AB-04 AK-1): results of LS-01, LS-03 and LS-04, the placement
 * order with the starting person, buildings and roads in the colours of the match and the
 * starting resources. Contains every step drawn so far.
 */
export type CatanSummary = {
  readonly personDraws: readonly CatanSummaryPersonDraw[];
  /** In the order of the positions. */
  readonly orderSpins: readonly CatanSummaryOrderSpin[];
  /** The complete placement order, or `null` while spins are missing. */
  readonly order: readonly PersonId[] | null;
  /** Place 1 of the order (US-LS-03 AK-3), or `null` while spins are missing. */
  readonly startingPersonId: PersonId | null;
  readonly placementSkipped: boolean;
  readonly buildings: readonly CatanSummaryBuilding[];
  readonly roads: readonly CatanSummaryRoad[];
  /** In placement order (US-SR-01 AK-1). */
  readonly startingResources: readonly CatanSummaryStartingResources[];
};

/**
 * Creates the overview of a Catan match (US-AB-04 AK-1, Architecture 5.5 `summary`).
 * Buildings and roads carry the Catan colour of the person in this match (US-PL-04 AK-1).
 */
export function catanSummary(setup: CatanSetup, generation: CatanGeneration): CatanSummary {
  const steps = generation.steps.map((record) => record.step);
  const order = catanPlacementOrder(setup, steps) ?? null;
  const colorOf = (personId: PersonId): CatanColorKey => {
    const color = setup.colors.find((candidate) => candidate.personId === personId);
    assert(color !== undefined, `person ${personId} has a colour in this match`);
    return color.catanColor;
  };
  const placeOf = (personId: PersonId): number => order?.indexOf(personId) ?? 0;

  const personDraws: CatanSummaryPersonDraw[] = [];
  const orderSpins: CatanSummaryOrderSpin[] = [];
  const buildings: CatanSummaryBuilding[] = [];
  const roads: CatanSummaryRoad[] = [];
  const startingResources: CatanSummaryStartingResources[] = [];
  steps.forEach((step, stepIndex) => {
    switch (step.kind) {
      case 'person-draw':
        personDraws.push({ stepIndex, draw: step.draw, personId: step.result });
        break;
      case 'order-spin':
        orderSpins.push({ stepIndex, position: step.position, personId: step.result });
        break;
      case 'building':
        buildings.push({
          stepIndex,
          index: step.index,
          personId: step.personId,
          type: step.type,
          vertex: step.result,
          catanColor: colorOf(step.personId),
        });
        break;
      case 'road':
        roads.push({
          stepIndex,
          index: step.index,
          personId: step.personId,
          edge: step.result,
          catanColor: colorOf(step.personId),
        });
        break;
      case 'starting-resources':
        startingResources.push({ stepIndex, personId: step.personId, resources: step.result });
        break;
    }
  });

  return {
    personDraws,
    orderSpins: orderSpins.sort((a, b) => a.position - b.position),
    order,
    startingPersonId: order === null ? null : startingPerson(order),
    placementSkipped: generation.gameState.placementSkipped,
    buildings,
    roads,
    startingResources: startingResources.sort((a, b) => placeOf(a.personId) - placeOf(b.personId)),
  };
}
