/**
 * Keys of the Catan player colours red, blue, white and orange (FA-SP-05, Specification 3.3).
 * Only keys are stored; the colour values live in the design tokens (NFA-GB-05).
 */
export const CATAN_COLOR_KEYS = ['red', 'blue', 'white', 'orange'] as const;

/**
 * Key of a Catan player colour (Architecture 7.1).
 */
export type CatanColorKey = (typeof CATAN_COLOR_KEYS)[number];
