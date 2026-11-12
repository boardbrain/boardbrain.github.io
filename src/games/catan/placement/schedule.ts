import type { CatanBuildingType } from './rounds';

/**
 * One turn of the placement: who places which kind of building, with one road each.
 */
export type PlacementTurn<P> = {
  readonly person: P;
  readonly type: CatanBuildingType;
};

/**
 * Snake order of the placement (FA-PL-02, US-PL-02 AK-1): even rounds run P1 … Pn, odd rounds
 * Pn … P1. `rounds` names the kind of building per round, e.g. settlement, then city with
 * Cities & Knights (Requirements 6.4).
 */
export function placementSchedule<P>(
  order: readonly P[],
  rounds: readonly CatanBuildingType[],
): PlacementTurn<P>[] {
  return rounds.flatMap((type, round) => {
    const persons = round % 2 === 0 ? order : [...order].reverse();
    return persons.map((person) => ({ person, type }));
  });
}
