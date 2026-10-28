// Design D-3 (docs/design/d3-start-navigation-final-preview.html): the main navigation is a fan of
// cards. From this many cards they get narrower and the fan flatter, so all fit on a phone.
const COMPACT_FROM = 6;
const STEP_DEGREES = 9;
const COMPACT_STEP_DEGREES = 6;

// Design K-3 (docs/design/k3-card-hand-final-preview.html): off the start view the hand is folded
// into a flat arc that shows only the tops of the cards.
const FOLDED_STEP_DEGREES = 3;
const FOLDED_ACTIVE_VISIBLE = 30;
const FOLDED_VISIBLE = 25;
// In the fanned hand the cards sink into the frame; the active card is pulled out.
const FANNED_ACTIVE_Y = 4;
const FANNED_Y = 16;

/** Height of a card in px without the bottom safe area. */
export const CARD_HEIGHT = 104;

/** The cards turn around a point below the hand, 140 % of the card height below their top. */
export const CARD_PIVOT = CARD_HEIGHT * 1.4;

/** How long a card must be pressed in the folded hand to fan out the whole hand, in ms. */
export const LONG_PRESS_MS = 450;

/**
 * State of the hand: fanned out with names, folded to the tops of the cards, or opened by a long
 * press over the dimmed view.
 */
export type HandState = 'fanned' | 'folded' | 'open';

/** Rotation in degrees and downward shift in px of one card. */
export type CardPose = { readonly rotate: number; readonly y: number };

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

/**
 * Whether the hand is folded on this page (design K-3, variant E2): only the start view shows the
 * fanned hand, every other page gets the space.
 */
export function isHandFolded(pathname: string): boolean {
  return pathname !== '/';
}

/**
 * State of the hand on this page; a folded hand can be opened by a long press.
 */
export function handState(pathname: string, isOpen: boolean): HandState {
  if (!isHandFolded(pathname)) return 'fanned';
  return isOpen ? 'open' : 'folded';
}

/**
 * Pose of a card: fanned like design D-3 or, when folded, a flat arc of 3° per card where the
 * active card shows 30 px and the others 25 px.
 */
export function cardPose(
  index: number,
  count: number,
  isActive: boolean,
  state: HandState,
): CardPose {
  if (state !== 'folded') {
    return { rotate: cardRotation(index, count), y: isActive ? FANNED_ACTIVE_Y : FANNED_Y };
  }
  const visible = isActive ? FOLDED_ACTIVE_VISIBLE : FOLDED_VISIBLE;
  return { rotate: (index - (count - 1) / 2) * FOLDED_STEP_DEGREES, y: CARD_HEIGHT - visible };
}

/**
 * Distance in px from the top of a folded card to its small symbol, so that the symbol sits in
 * the middle of the visible part. The turn lowers the top of the outer cards a little.
 */
export function foldedIconTop(
  index: number,
  count: number,
  isActive: boolean,
  iconSize: number,
): number {
  const { rotate, y } = cardPose(index, count, isActive, 'folded');
  const visible = CARD_HEIGHT - CARD_PIVOT + (CARD_PIVOT - y) * Math.cos((rotate * Math.PI) / 180);
  return Math.max(1, (visible - iconSize) / 2);
}
