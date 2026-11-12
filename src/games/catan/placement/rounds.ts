/**
 * Editions of Catan (Architecture 4.5): base game and Cities & Knights.
 */
export const CATAN_EDITIONS = ['base', 'cities-and-knights'] as const;

/**
 * An edition of Catan (Architecture 4.5).
 */
export type CatanEdition = (typeof CATAN_EDITIONS)[number];

/**
 * Kind of a building in Catan: settlement or city (FA-PL-03, FA-PL-04).
 */
export type CatanBuildingType = 'settlement' | 'city';

/**
 * Kind of building per placement round (Requirements 6.4, US-PL-02 AK-2): two settlements in
 * the base game (FA-PL-03); with Cities & Knights a settlement forward and a city backward
 * (FA-PL-04).
 */
export function catanPlacementRounds(edition: CatanEdition): readonly CatanBuildingType[] {
  return edition === 'base' ? ['settlement', 'settlement'] : ['settlement', 'city'];
}
