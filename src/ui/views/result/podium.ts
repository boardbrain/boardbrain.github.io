import styles from './podium.module.css';

/**
 * The colour of a place in a circle (design I3-C MP2): silver for place 2, bronze for place 3,
 * nothing else. Equal places get the same colour, so 1, 2, 2, 4 has no bronze.
 */
export function podiumClass(place: number | null | undefined): string | undefined {
  if (place === 2) {
    return styles.silver;
  }
  return place === 3 ? styles.bronze : undefined;
}
