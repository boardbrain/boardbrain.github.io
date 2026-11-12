import type { PersonId } from '@/core/model';
import type { EdgeId, VertexId } from '../board/board';
import type { CatanBuildingType } from '../placement/rounds';
import type { CatanResource } from '../startingResources';
import type { CatanPersonDraw } from './options';

/**
 * Draw of a person: LS-01, LS-03 or LS-04, one wheel spin (Specification 3.1).
 */
export type CatanPersonDrawStep = {
  readonly kind: 'person-draw';
  readonly draw: CatanPersonDraw;
  readonly result: PersonId;
};

/**
 * One spin of the placement order LS-02 (Specification 3.1, US-LS-03 AK-2). `position` counts
 * from 0; `candidates` are the persons on the wheel.
 */
export type CatanOrderSpinStep = {
  readonly kind: 'order-spin';
  readonly position: number;
  readonly candidates: readonly PersonId[];
  readonly result: PersonId;
};

/**
 * A building, settlement or city (Specification 3.1, US-PL-02). `index` counts the buildings
 * from 0 in placement order.
 */
export type CatanBuildingStep = {
  readonly kind: 'building';
  readonly index: number;
  readonly personId: PersonId;
  readonly type: CatanBuildingType;
  readonly result: VertexId;
};

/**
 * The road at building `index` (Specification 3.1, US-PL-03).
 */
export type CatanRoadStep = {
  readonly kind: 'road';
  readonly index: number;
  readonly personId: PersonId;
  readonly result: EdgeId;
};

/**
 * The starting resources of one person, in drawing order (Specification 3.1, US-SR-01).
 */
export type CatanStartingResourcesStep = {
  readonly kind: 'starting-resources';
  readonly personId: PersonId;
  readonly result: readonly CatanResource[];
};

/**
 * A step of the Catan generation (Specification 3.1, Architecture 5.5, ADR-028).
 */
export type CatanStep =
  | CatanPersonDrawStep
  | CatanOrderSpinStep
  | CatanBuildingStep
  | CatanRoadStep
  | CatanStartingResourcesStep;
