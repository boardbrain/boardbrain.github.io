import type { CatanPreparation, StartSessionInput } from '@/app/services/sessionService';
import { setMatchColor, type CatanColorKey, type MatchColors, type PersonId } from '@/core/model';
import {
  CATAN_PERSON_DRAWS,
  CATAN_STARTING_RESOURCES_COUNT,
  type CatanEdition,
  type CatanOrderOption,
  type CatanPersonDraw,
  type StartingResourcesOptions,
} from '@/games/catan';

/**
 * What to do instead of drawing the order (FA-LS-07): set it by hand or play without placement.
 */
export type OrderAlternative = 'manual' | 'none';

/**
 * The preparation of a match across the pages table, options and colours (design I2-C, V3). It
 * lives only in memory (Specification 3.5).
 */
export type MatchPreparation = {
  /** Start values of the chosen table from the session service. */
  readonly base: CatanPreparation;
  readonly edition: CatanEdition;
  readonly personDraws: Readonly<Record<CatanPersonDraw, boolean>>;
  readonly isOrderDrawn: boolean;
  readonly orderAlternative: OrderAlternative;
  /** Persons tapped so far for an order set by hand, place 1 first. */
  readonly manualOrder: readonly PersonId[];
  readonly hasStartingResources: boolean;
  readonly resourceCount: number;
  readonly replacement: StartingResourcesOptions['replacement'];
  /** Catan colours of this match (US-PG-04). */
  readonly colors: MatchColors;
};

/**
 * Starts the preparation for a table with its start values. When the table changes, the chosen
 * options stay, colours and an order set by hand start again (design I2-C).
 */
export function preparationFor(
  base: CatanPreparation,
  previous: MatchPreparation | null,
): MatchPreparation {
  if (previous !== null) {
    return { ...previous, base, manualOrder: [], colors: base.colors };
  }
  const resources = base.options.startingResources;
  return {
    base,
    edition: base.options.edition,
    personDraws: base.options.personDraws,
    isOrderDrawn: base.options.order.mode === 'draw',
    orderAlternative: 'manual',
    manualOrder: [],
    hasStartingResources: resources !== null,
    resourceCount: resources?.count ?? CATAN_STARTING_RESOURCES_COUNT.default,
    replacement: resources?.replacement ?? 'with',
    colors: base.colors,
  };
}

/**
 * Taps a person for the order set by hand (US-AB-01 AK-3): a person not yet placed gets the
 * next place, a placed person is taken back together with everyone after them. As with the
 * wheel, the last place follows from the others.
 */
export function tapForOrder(preparation: MatchPreparation, personId: PersonId): MatchPreparation {
  const { manualOrder, base } = preparation;
  const at = manualOrder.indexOf(personId);
  const order = at === -1 ? [...manualOrder, personId] : manualOrder.slice(0, at);
  const rest = base.participants.filter((person) => !order.includes(person));
  const [last] = rest;
  return {
    ...preparation,
    manualOrder: rest.length === 1 && last !== undefined ? [...order, last] : order,
  };
}

/**
 * Whether the options are complete, so the colours may follow: an order set by hand needs every
 * person (US-AB-01 AK-3).
 */
export function isOrderComplete(preparation: MatchPreparation): boolean {
  return (
    preparation.isOrderDrawn ||
    preparation.orderAlternative === 'none' ||
    preparation.manualOrder.length === preparation.base.participants.length
  );
}

/**
 * Gives a person another colour for this match; a taken colour swaps (US-PG-04).
 */
export function chooseColor(
  preparation: MatchPreparation,
  personId: PersonId,
  color: CatanColorKey,
): MatchPreparation {
  return { ...preparation, colors: setMatchColor(preparation.colors, personId, color) };
}

/**
 * Whether the person's colour differs from the table for this match ("· einmalig").
 */
export function isColorChanged(preparation: MatchPreparation, personId: PersonId): boolean {
  const colorOf = (colors: MatchColors): CatanColorKey | undefined =>
    colors.find((color) => color.personId === personId)?.catanColor;
  return colorOf(preparation.colors) !== colorOf(preparation.base.colors);
}

/**
 * The draws of a person that are switched on, in the order of the flow (US-LS-02 AK-1).
 */
export function enabledDraws(preparation: MatchPreparation): CatanPersonDraw[] {
  return CATAN_PERSON_DRAWS.filter((draw) => preparation.personDraws[draw]);
}

function orderOption(preparation: MatchPreparation): CatanOrderOption {
  if (preparation.isOrderDrawn) {
    return { mode: 'draw' };
  }
  return preparation.orderAlternative === 'manual'
    ? { mode: 'manual', order: preparation.manualOrder }
    : { mode: 'none' };
}

/**
 * Input for "Generierung starten" (Specification 3.5).
 */
export function startInputOf(preparation: MatchPreparation): StartSessionInput {
  return {
    groupId: preparation.base.groupId,
    options: {
      edition: preparation.edition,
      mode: preparation.base.options.mode,
      personDraws: preparation.personDraws,
      order: orderOption(preparation),
      startingResources: preparation.hasStartingResources
        ? { count: preparation.resourceCount, replacement: preparation.replacement }
        : null,
    },
    colors: preparation.colors,
  };
}
