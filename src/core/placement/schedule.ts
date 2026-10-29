/**
 * One turn of the placement: who places which kind of building.
 */
export type PlacementTurn<P, T> = {
  readonly person: P;
  readonly type: T;
};

/**
 * Snake order of the placement (FA-PL-02, US-PL-02 AK-1): even rounds run P1 … Pn, odd rounds
 * Pn … P1. `rounds` names the kind of building per round; the kinds belong to the game module,
 * e.g. settlement, then city with Cities & Knights (Requirements 6.4).
 */
export function placementSchedule<P, T>(
  order: readonly P[],
  rounds: readonly T[],
): PlacementTurn<P, T>[] {
  return rounds.flatMap((type, round) => {
    const persons = round % 2 === 0 ? order : [...order].reverse();
    return persons.map((person) => ({ person, type }));
  });
}
