/**
 * Keys of the Catan player colours red, blue, white and orange (FA-SP-05, Specification 3.3).
 * Only keys are stored; the colour values live in the design tokens (NFA-GB-05).
 */
export const CATAN_COLOR_KEYS = ['red', 'blue', 'white', 'orange'] as const;

/**
 * Key of a Catan player colour (Architecture 7.1).
 */
export type CatanColorKey = (typeof CATAN_COLOR_KEYS)[number];

/**
 * Keys of the 12 group colours in the order of the automatic assignment (FA-PG-07, FA-PG-08,
 * Architecture 13.4). The order alternates between colour families, so the first colours of a
 * group are easy to tell apart (no blue next to indigo, no teal next to cyan).
 */
export const GROUP_COLOR_KEYS = [
  'red',
  'blue',
  'yellow',
  'green',
  'violet',
  'orange',
  'cyan',
  'pink',
  'lime',
  'indigo',
  'teal',
  'white',
] as const;

/**
 * Key of a group colour (Architecture 7.1).
 */
export type GroupColorKey = (typeof GROUP_COLOR_KEYS)[number];
