import { assert } from '@/core/shared';
import { CATAN_COLOR_KEYS, type CatanColorKey } from './colors';
import type { Group } from './group';
import type { PersonId } from './ids';

/**
 * Catan colour of a person for one match (FA-PG-06, Specification 3.3 rule 7).
 */
export type MatchColor = {
  readonly personId: PersonId;
  readonly catanColor: CatanColorKey;
};

/**
 * Catan colours of a match, one per participant in the order of the group's members.
 */
export type MatchColors = readonly MatchColor[];

/**
 * The default colours of a match: the Catan colours of the group (US-PG-04).
 * @throws {InvariantError} if a member has no Catan colour, i.e. the group cannot play Catan.
 */
export function matchColorsOf(group: Group): MatchColor[] {
  return group.members.map(({ personId, catanColor }) => {
    assert(catanColor !== undefined, 'every member of a Catan group has a Catan colour');
    return { personId, catanColor };
  });
}

/**
 * Gives a person another Catan colour for this match only (US-PG-04 AK-1). If another
 * participant already has it, the two swap their colours for this match (AK-2, Specification
 * 3.3 rule 6). The colours of the group stay unchanged.
 * @throws {InvariantError} if the person does not take part.
 */
export function setMatchColor(
  colors: MatchColors,
  personId: PersonId,
  catanColor: CatanColorKey,
): MatchColor[] {
  const current = colors.find((color) => color.personId === personId);
  assert(current !== undefined, `person ${personId} takes part in the match`);
  return colors.map((color) => {
    if (color.personId === personId) {
      return { personId, catanColor };
    }
    return color.catanColor === catanColor ? { ...color, catanColor: current.catanColor } : color;
  });
}

/**
 * Whether the colours belong exactly to these participants, in their order, and each Catan
 * colour occurs at most once (Specification 3.3).
 */
export function areMatchColorsValid(
  colors: MatchColors,
  participants: readonly PersonId[],
): boolean {
  const keys = colors.map((color) => color.catanColor);
  return (
    colors.length === participants.length &&
    colors.every((color, index) => color.personId === participants[index]) &&
    new Set(keys).size === keys.length &&
    keys.every((key) => CATAN_COLOR_KEYS.includes(key))
  );
}
