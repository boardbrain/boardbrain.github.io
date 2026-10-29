import type { MatchColors, PersonId } from '@/core/model';
import {
  CATAN_STARTING_RESOURCES_COUNT,
  type StartingResourcesOptions,
} from '../startingResources';
import type { CatanEdition } from '../placement/rounds';

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
 * Options of a Catan match (FA-AB-02, US-AB-01 AK-3, AK-4, US-SP-04).
 */
export type CatanOptions = {
  readonly edition: CatanEdition;
  readonly mode: CatanMode;
  /** Which of LS-01, LS-03 and LS-04 take place; LS-02 always does (US-AB-01 AK-3). */
  readonly personDraws: Readonly<Record<CatanPersonDraw, boolean>>;
  /** `null` if no starting resources are drawn (US-AB-01 AK-4, FA-SR-01). */
  readonly startingResources: StartingResourcesOptions | null;
};

/**
 * Default options: base game, mode "Standard", all draws of a person on, no starting
 * resources (US-SP-04 AK-1, AK-2, US-AB-01 AK-3, AK-4).
 */
export const CATAN_DEFAULT_OPTIONS: CatanOptions = {
  edition: 'base',
  mode: 'standard',
  personDraws: { landscapes: true, harbors: true, numbers: true },
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
