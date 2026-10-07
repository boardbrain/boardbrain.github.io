import { assert } from '@/core/shared';
import {
  CATAN_COLOR_KEYS,
  GROUP_COLOR_KEYS,
  type CatanColorKey,
  type GroupColorKey,
} from './colors';

/**
 * Which colours a member of a group has (Specification 3.3):
 * `both` = group colour and Catan colour (global group with 2 to 4 members),
 * `catan-only` = the Catan colour is the group colour as well (group bound to Catan),
 * `group-only` = group colour only (own game, or global group with more than 4 members).
 */
export type ColorScheme = 'both' | 'catan-only' | 'group-only';

/**
 * Colours of one member. `catanColor` exists exactly in the schemes `both` and `catan-only`;
 * with `catan-only`, `groupColor` equals `catanColor` (FA-PG-07).
 */
export type MemberColors = {
  readonly groupColor: GroupColorKey;
  readonly catanColor?: CatanColorKey;
};

/**
 * Kind of colour that is changed.
 */
export type ColorKind = 'group' | 'catan';

/**
 * What the scheme depends on: the binding of the group and the number of members.
 */
export type ColorSchemeInput = {
  readonly memberCount: number;
  /** `null` for a global group, otherwise the game the group is bound to. */
  readonly boundGame: { readonly hasPlayerColors: boolean } | null;
  /** Most members a game with player colours allows (Catan: 4, FA-PG-10). */
  readonly maxPlayersWithColors: number;
};

/**
 * Determines the colour scheme of a group (Specification 3.3 rules 2 to 4).
 */
export function colorSchemeOf(input: ColorSchemeInput): ColorScheme {
  if (input.boundGame !== null) {
    return input.boundGame.hasPlayerColors ? 'catan-only' : 'group-only';
  }
  return input.memberCount <= input.maxPlayersWithColors ? 'both' : 'group-only';
}

function isCatanKey(key: GroupColorKey): key is CatanColorKey {
  return CATAN_COLOR_KEYS.some((catanKey) => catanKey === key);
}

function firstFree<K extends string>(order: readonly K[], taken: ReadonlySet<K>): K {
  const free = order.find((key) => !taken.has(key));
  assert(free !== undefined, 'a free colour is left (at most 12 members)');
  return free;
}

/**
 * Makes the colours of the members fit the scheme and fills gaps with the next free colours
 * in the order of the automatic assignment (FA-PG-08, US-PG-03 AK-1 to AK-4). Valid colours
 * that are already assigned are kept; a colour that occurs twice is replaced at its second
 * member.
 */
export function normalizeColors(
  colors: readonly Partial<MemberColors>[],
  scheme: ColorScheme,
): MemberColors[] {
  const usedCatan = new Set<CatanColorKey>();
  const usedGroup = new Set<GroupColorKey>();

  // First pass: keep what is valid, so nothing that is already assigned moves.
  const kept = colors.map((member) => {
    let catanColor: CatanColorKey | undefined;
    if (scheme !== 'group-only' && member.catanColor !== undefined) {
      if (!usedCatan.has(member.catanColor)) {
        catanColor = member.catanColor;
        usedCatan.add(catanColor);
      }
    }
    let groupColor: GroupColorKey | undefined;
    if (scheme === 'catan-only') {
      groupColor = catanColor;
    } else if (member.groupColor !== undefined && !usedGroup.has(member.groupColor)) {
      groupColor = member.groupColor;
    }
    if (groupColor !== undefined) {
      usedGroup.add(groupColor);
    }
    return { catanColor, groupColor };
  });

  // Second pass: fill the gaps in the order of the palette.
  return kept.map((member) => {
    if (scheme === 'catan-only') {
      const catanColor = member.catanColor ?? firstFree(CATAN_COLOR_KEYS, usedCatan);
      usedCatan.add(catanColor);
      return { groupColor: catanColor, catanColor };
    }
    const groupColor = member.groupColor ?? firstFree(GROUP_COLOR_KEYS, usedGroup);
    usedGroup.add(groupColor);
    if (scheme === 'group-only') {
      return { groupColor };
    }
    const catanColor = member.catanColor ?? firstFree(CATAN_COLOR_KEYS, usedCatan);
    usedCatan.add(catanColor);
    return { groupColor, catanColor };
  });
}

/**
 * Colours for a new group: assigned in order with free colours, without taking over colours
 * from other groups (US-PG-03 AK-1, FA-PG-08).
 */
export function defaultColors(memberCount: number, scheme: ColorScheme): MemberColors[] {
  return normalizeColors(
    Array.from({ length: memberCount }, () => ({})),
    scheme,
  );
}

/**
 * Gives a member a colour of the given kind. If another member already has that colour, the
 * two swap (US-PG-03 AK-5, FA-PG-08). With `catan-only` the group colour follows the Catan
 * colour. A request that does not fit the scheme leaves the colours unchanged.
 */
export function setMemberColor(
  colors: readonly MemberColors[],
  index: number,
  kind: ColorKind,
  color: GroupColorKey,
  scheme: ColorScheme,
): MemberColors[] {
  const current = colors[index];
  if (current === undefined) {
    return [...colors];
  }
  if (kind === 'catan' || scheme === 'catan-only') {
    const oldColor = current.catanColor;
    if (scheme === 'group-only' || oldColor === undefined || !isCatanKey(color)) {
      return [...colors];
    }
    const withCatan = (member: MemberColors, catanColor: CatanColorKey): MemberColors =>
      scheme === 'catan-only' ? { groupColor: catanColor, catanColor } : { ...member, catanColor };
    return colors.map((member, memberIndex) => {
      if (memberIndex === index) {
        return withCatan(member, color);
      }
      return member.catanColor === color ? withCatan(member, oldColor) : member;
    });
  }
  const oldColor = current.groupColor;
  return colors.map((member, memberIndex) => {
    if (memberIndex === index) {
      return { ...member, groupColor: color };
    }
    return member.groupColor === color ? { ...member, groupColor: oldColor } : member;
  });
}
