/**
 * Axial coordinate of a hex with its tip pointing up (Architecture 5.2): `q` grows to the
 * east, `r` grows row by row to the south.
 */
export type HexCoord = { readonly q: number; readonly r: number };

/**
 * Key of a hex for sets and maps, e.g. `"1,-2"`.
 */
export function hexKey({ q, r }: HexCoord): string {
  return `${String(q)},${String(r)}`;
}

/**
 * Sum of two coordinates, e.g. a hex plus a direction.
 */
export function addHex(a: HexCoord, b: HexCoord): HexCoord {
  return { q: a.q + b.q, r: a.r + b.r };
}

/**
 * Number of steps between two hexes.
 */
export function hexDistance(a: HexCoord, b: HexCoord): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
}

/**
 * All hexes at most `radius` steps from the centre, row by row from top to bottom and within a
 * row from left to right. Radius 2 is the standard board (FA-PL-07).
 */
export function hexesWithin(radius: number): HexCoord[] {
  const hexes: HexCoord[] = [];
  for (let r = -radius; r <= radius; r += 1) {
    for (let q = Math.max(-radius, -r - radius); q <= Math.min(radius, -r + radius); q += 1) {
      // + 0 turns -0 (from -radius with radius 0) into 0.
      hexes.push({ q: q + 0, r: r + 0 });
    }
  }
  return hexes;
}
