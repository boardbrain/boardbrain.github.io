// Design D-3 (docs/design/d3-start-navigation-final-preview.html): the main navigation is a fan of
// cards. From this many cards they get narrower and the fan flatter, so all fit on a phone.
const COMPACT_FROM = 6;
const STEP_DEGREES = 9;
const COMPACT_STEP_DEGREES = 6;

/**
 * Whether the hand holds so many cards that they must be narrower (70 instead of 86 px).
 */
export function isCompactHand(count: number): boolean {
  return count >= COMPACT_FROM;
}

/**
 * Rotation of a card in degrees: 9° per card from the middle, 6° in a compact hand.
 */
export function cardRotation(index: number, count: number): number {
  const step = isCompactHand(count) ? COMPACT_STEP_DEGREES : STEP_DEGREES;
  return (index - (count - 1) / 2) * step;
}
