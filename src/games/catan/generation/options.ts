import type { MatchColors, PersonId } from '@/core/model';
import {
  CATAN_STARTING_RESOURCES_COUNT,
  type StartingResourcesOptions,
} from '../startingResources';
import { CATAN_EDITIONS, type CatanEdition } from '../placement/rounds';

/**
 * Modes of Catan; in version 1 only "Standard" (US-SP-04 AK-2, Architecture 4.5).
 */
export const CATAN_MODES = ['standard'] as const;

/**
 * A mode of Catan (Architecture 4.5).
 */
export type CatanMode = (typeof CATAN_MODES)[number];

/**
 * The draws of a person in the order of the flow (US-LS-02 AK-1): who lays out the landscapes
 * (LS-01), the harbours (LS-03) and the number tokens (LS-04).
 */
export const CATAN_PERSON_DRAWS = ['landscapes', 'harbors', 'numbers'] as const;

/**
 * A draw of a person: LS-01, LS-03 or LS-04 (Architecture 4.5).
 */
export type CatanPersonDraw = (typeof CATAN_PERSON_DRAWS)[number];

/**
 * How the placement order comes about (FA-LS-07, US-AB-01 AK-3): drawn in n − 1 spins (LS-02,
 * the default), set by hand, with the placement following it, or none, in which case there is
 * no placement.
 */
export type CatanOrderOption =
  | { readonly mode: 'draw' }
  | { readonly mode: 'manual'; readonly order: readonly PersonId[] }
  | { readonly mode: 'none' };

/**
 * Options of a Catan match (FA-AB-02, US-AB-01 AK-3, AK-4, US-SP-04).
 */
export type CatanOptions = {
  readonly edition: CatanEdition;
  readonly mode: CatanMode;
  /** Which of LS-01, LS-03 and LS-04 take place; LS-02 always does (US-AB-01 AK-3). */
  readonly personDraws: Readonly<Record<CatanPersonDraw, boolean>>;
  /** How the placement order comes about; drawn by default (FA-LS-07). */
  readonly order: CatanOrderOption;
  /** `null` if no starting resources are drawn (US-AB-01 AK-4, FA-SR-01). */
  readonly startingResources: StartingResourcesOptions | null;
};

/**
 * Default options: base game, mode "Standard", all draws of a person on, the order drawn, no
 * starting resources (US-SP-04 AK-1, AK-2, US-AB-01 AK-3, AK-4).
 */
export const CATAN_DEFAULT_OPTIONS: CatanOptions = {
  edition: 'base',
  mode: 'standard',
  personDraws: { landscapes: true, harbors: true, numbers: true },
  order: { mode: 'draw' },
  startingResources: null,
};

/**
 * Default starting resources once they are switched on: 2 per person with replacement
 * (US-AB-01 AK-4).
 */
export const CATAN_DEFAULT_STARTING_RESOURCES: StartingResourcesOptions = {
  count: CATAN_STARTING_RESOURCES_COUNT.default,
  replacement: 'with',
};

/**
 * Setup of a Catan match that the generation works with: the participants in the order of the
 * group's members (US-AB-01 AK-2), the options and the Catan colours of this match (US-PG-04).
 */
export type CatanSetup = {
  readonly participants: readonly PersonId[];
  readonly options: CatanOptions;
  readonly colors: MatchColors;
};

/**
 * The draws of a person that take place, in the order of the flow (US-LS-02 AK-1, AK-3).
 */
export function enabledPersonDraws(options: CatanOptions): CatanPersonDraw[] {
  return CATAN_PERSON_DRAWS.filter((draw) => options.personDraws[draw]);
}

// FA-LS-07: an order set by hand contains every participant exactly once.
function isOrderValid(order: CatanOrderOption, participants: readonly PersonId[]): boolean {
  if (order.mode !== 'manual') {
    return true;
  }
  return (
    order.order.length === participants.length &&
    new Set(order.order).size === order.order.length &&
    order.order.every((person) => participants.includes(person))
  );
}

/**
 * Whether the options are complete and in range for these participants (FA-AB-02, FA-SR-02,
 * FA-LS-07): a known edition and mode, an order set by hand with every participant exactly
 * once and, if switched on, 1 to 5 starting resources.
 */
export function areCatanOptionsValid(
  options: CatanOptions,
  participants: readonly PersonId[],
): boolean {
  const resources = options.startingResources;
  return (
    CATAN_EDITIONS.includes(options.edition) &&
    CATAN_MODES.includes(options.mode) &&
    isOrderValid(options.order, participants) &&
    (resources === null ||
      (Number.isInteger(resources.count) &&
        resources.count >= CATAN_STARTING_RESOURCES_COUNT.min &&
        resources.count <= CATAN_STARTING_RESOURCES_COUNT.max))
  );
}
