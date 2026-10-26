import { assert, err, ok, type Result } from '@/core/shared';
import type { CatanColorKey, GroupColorKey } from './colors';
import type { IsoTimestamp, Person } from './entities';
import type { GameId, GroupId, PersonId } from './ids';
import { colorSchemeOf, type MemberColors } from './groupColors';
import { cleanName, isSameName } from './names';

/**
 * Fewest and most members of a group (FA-PG-09).
 */
export const GROUP_SIZE = { min: 2, max: 12 } as const;

/**
 * Binding of a group: to all games or to exactly one game (FA-PG-04).
 */
export type GroupBinding =
  | {
      readonly kind: 'global';
      /** The group does not play Catan and has no Catan colours (E-27); missing means false. */
      readonly excludesCatan?: boolean;
    }
  | { readonly kind: 'game'; readonly gameId: GameId };

/**
 * Member of a group with the colours of the person in this group (Architecture 7.1).
 */
export type GroupMember = {
  readonly personId: PersonId;
  readonly groupColor: GroupColorKey;
  /** Only where Catan is possible (Specification 3.3). */
  readonly catanColor?: CatanColorKey;
};

/**
 * Group with a fixed set of persons (FA-PG-02, FA-PG-03, FA-PG-09). The members cannot be
 * changed after creation.
 */
export type Group = {
  readonly id: GroupId;
  readonly name: string;
  readonly archived: boolean;
  readonly binding: GroupBinding;
  readonly members: readonly GroupMember[];
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
};

/**
 * What the group's binding allows: the game it is bound to, or `null` for a global group.
 */
export type BoundGame = {
  /** Most members the game can be played with (Catan: 4, FA-PG-10). */
  readonly maxPlayers: number;
  readonly hasPlayerColors: boolean;
};

/**
 * Fields a new group is created from. `colors` has one entry per person, in the same order.
 */
export type NewGroupFields = {
  readonly id: GroupId;
  readonly name: string;
  readonly binding: GroupBinding;
  /** `null` for a global group. */
  readonly boundGame: BoundGame | null;
  readonly persons: readonly Person[];
  readonly colors: readonly MemberColors[];
  readonly now: IsoTimestamp;
};

/**
 * Expected reasons why a group cannot be created.
 */
export type GroupError =
  'name-empty' | 'member-count-invalid' | 'binding-too-many-members' | 'same-named-members';

/**
 * Highest number of members a global group can have and still play Catan (FA-PG-10); more
 * members only get a group colour (Specification 3.3 rule 4).
 */
export const GROUP_MAX_PLAYERS_WITH_COLORS = 4;

/**
 * Persons whose names are equal ignoring case and surrounding spaces, grouped by name
 * (US-PG-02 AK-6, Specification 3.4). Empty if all names are different.
 */
export function findSameNamedPersons(persons: readonly Person[]): Person[][] {
  const groups: Person[][] = [];
  for (const person of persons) {
    const sameName = groups.find((known) =>
      known.some((other) => isSameName(other.name, person.name)),
    );
    if (sameName === undefined) {
      groups.push([person]);
    } else {
      sameName.push(person);
    }
  }
  return groups.filter((known) => known.length > 1);
}

/**
 * Suggests a group name from the names of the members, e.g. "Anna, Ben & Clara"
 * (US-PG-02 AK-2). Empty without members.
 */
export function suggestGroupName(persons: readonly Person[]): string {
  const names = persons.map((person) => cleanName(person.name));
  const last = names.at(-1);
  if (last === undefined) {
    return '';
  }
  if (names.length === 1) {
    return last;
  }
  return `${names.slice(0, -1).join(', ')} & ${last}`;
}

// Combines persons and colours into members and checks that the colours fit the colour scheme
// of the binding (Specification 3.3). Wrong colours are a programming error of the caller.
function membersWithColors(
  personIds: readonly PersonId[],
  colors: readonly MemberColors[],
  binding: GroupBinding,
  boundGame: BoundGame | null,
): GroupMember[] {
  const count = personIds.length;
  assert(colors.length === count, 'there is one colour entry per person');
  const scheme = colorSchemeOf({
    memberCount: count,
    boundGame,
    maxPlayersWithColors: GROUP_MAX_PLAYERS_WITH_COLORS,
    excludesCatan: binding.kind === 'global' && binding.excludesCatan === true,
  });
  const members = personIds.map((personId, index): GroupMember => {
    const memberColors = colors[index];
    assert(memberColors !== undefined, 'the colours of the person exist');
    assert(
      (scheme === 'group-only') === (memberColors.catanColor === undefined),
      'a Catan colour exists exactly where the scheme has one',
    );
    assert(
      scheme !== 'catan-only' || memberColors.groupColor === memberColors.catanColor,
      'the Catan colour is the group colour in a group bound to Catan',
    );
    return memberColors.catanColor === undefined
      ? { personId, groupColor: memberColors.groupColor }
      : { personId, groupColor: memberColors.groupColor, catanColor: memberColors.catanColor };
  });
  assert(
    new Set(members.map((member) => member.groupColor)).size === count,
    'group colours are unique within the group',
  );
  assert(
    new Set(members.flatMap((member) => (member.catanColor ? [member.catanColor] : []))).size ===
      members.filter((member) => member.catanColor !== undefined).length,
    'Catan colours are unique within the group',
  );
  return members;
}

/**
 * Creates a new, active group (US-PG-02). Members must be 2 to 12 persons with different
 * names (AK-3, AK-6); a group bound to a game must not have more members than the game allows
 * (AK-4, FA-PG-10).
 * @throws {InvariantError} if the colours do not belong to the persons or do not fit the
 *   colour scheme: that is a programming error of the caller, not an input error.
 */
export function createGroup(fields: NewGroupFields): Result<Group, GroupError> {
  const name = cleanName(fields.name);
  if (name === '') {
    return err('name-empty');
  }
  const count = fields.persons.length;
  if (count < GROUP_SIZE.min || count > GROUP_SIZE.max) {
    return err('member-count-invalid');
  }
  if (fields.boundGame !== null && count > fields.boundGame.maxPlayers) {
    return err('binding-too-many-members');
  }
  assert(
    new Set(fields.persons.map((person) => person.id)).size === count,
    'a person is a member only once',
  );
  if (findSameNamedPersons(fields.persons).length > 0) {
    return err('same-named-members');
  }
  const members = membersWithColors(
    fields.persons.map((person) => person.id),
    fields.colors,
    fields.binding,
    fields.boundGame,
  );
  return ok({
    id: fields.id,
    name,
    archived: false,
    binding: fields.binding,
    members,
    createdAt: fields.now,
    updatedAt: fields.now,
  });
}

/**
 * Changes of a group (US-VW-02). `colors` has one entry per member, in the order of the
 * members; the members themselves cannot be changed (AK-2).
 */
export type GroupChanges = {
  readonly name: string;
  readonly binding: GroupBinding;
  /** `null` for a global group. */
  readonly boundGame: BoundGame | null;
  readonly colors: readonly MemberColors[];
  readonly now: IsoTimestamp;
};

/**
 * Expected reasons why a group cannot be changed.
 */
export type GroupEditError = 'name-empty' | 'binding-too-many-members';

/**
 * Changes name, colours and binding of a group and keeps its members (US-VW-02 AK-1, AK-2,
 * FA-VW-02). A binding the number of members does not fit is rejected (AK-3, FA-PG-10).
 * @throws {InvariantError} if the colours do not belong to the members or do not fit the
 *   colour scheme of the new binding.
 */
export function editGroup(group: Group, changes: GroupChanges): Result<Group, GroupEditError> {
  const name = cleanName(changes.name);
  if (name === '') {
    return err('name-empty');
  }
  if (changes.boundGame !== null && group.members.length > changes.boundGame.maxPlayers) {
    return err('binding-too-many-members');
  }
  const members = membersWithColors(
    group.members.map((member) => member.personId),
    changes.colors,
    changes.binding,
    changes.boundGame,
  );
  return ok({ ...group, name, binding: changes.binding, members, updatedAt: changes.now });
}
