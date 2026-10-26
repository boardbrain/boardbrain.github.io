import { describe, expect, it } from 'vitest';
import { InvariantError } from '@/core/shared';
import {
  createGroup,
  editGroup,
  findNameConflicts,
  findSameNamedPersons,
  suggestGroupName,
  type Group,
  type GroupChanges,
  type NewGroupFields,
} from './group';
import { defaultColors, normalizeColors, type MemberColors } from './groupColors';
import { toGameId, toGroupId, toPersonId } from './ids';
import type { Person } from './entities';

const TEST_NOW = '2026-10-07T18:30:00.000Z';
const GROUP_ID = toGroupId('00000000-0000-4000-8000-0000000000c1');
const CATAN = { maxPlayers: 4, hasPlayerColors: true };

function aPerson(id: Person['id'], name: string): Person {
  return { id, name, archived: false, createdAt: TEST_NOW, updatedAt: TEST_NOW };
}

function people(...names: string[]): Person[] {
  return names.map((name, index) =>
    aPerson(
      toPersonId(`00000000-0000-4000-8000-0000000001${String(index).padStart(2, '0')}`),
      name,
    ),
  );
}

function fields(persons: Person[], overrides: Partial<NewGroupFields> = {}): NewGroupFields {
  return {
    id: GROUP_ID,
    name: 'Spieleabend',
    binding: { kind: 'global' },
    boundGame: null,
    persons,
    colors: defaultColors(
      Math.min(persons.length, 12),
      persons.length <= 4 ? 'both' : 'group-only',
    ),
    now: TEST_NOW,
    ...overrides,
  };
}

describe('US-PG-02 AK-1: create a group', () => {
  it.each([2, 7, 12])('creates a group of %i members', (count) => {
    const persons = people(
      ...Array.from({ length: count }, (_, index) => `Person ${String(index)}`),
    );

    const result = createGroup(fields(persons));

    expect(result.ok && result.value.members).toHaveLength(count);
  });

  it('stores name, binding, members with colours and timestamps', () => {
    const [anna, ben] = people('Anna', 'Ben');
    const catan = toGameId('c47a0000-0000-4000-8000-000000000001');

    const result = createGroup({
      ...fields([anna, ben].flatMap((person) => (person ? [person] : []))),
      name: '  Anna & Ben ',
      binding: { kind: 'game', gameId: catan },
      boundGame: CATAN,
      colors: defaultColors(2, 'catan-only'),
    });

    expect(result).toEqual({
      ok: true,
      value: {
        id: GROUP_ID,
        name: 'Anna & Ben',
        archived: false,
        binding: { kind: 'game', gameId: catan },
        members: [
          { personId: anna?.id, groupColor: 'red', catanColor: 'red' },
          { personId: ben?.id, groupColor: 'blue', catanColor: 'blue' },
        ],
        createdAt: TEST_NOW,
        updatedAt: TEST_NOW,
      },
    });
  });
});

describe('US-PG-02 AK-2: name', () => {
  it('suggests the names of the members', () => {
    expect(suggestGroupName(people('Anna', 'Ben', 'Clara'))).toBe('Anna, Ben & Clara');
    expect(suggestGroupName(people('Anna', 'Ben'))).toBe('Anna & Ben');
    expect(suggestGroupName(people(' Anna '))).toBe('Anna');
    expect(suggestGroupName([])).toBe('');
  });

  it('requires a name', () => {
    expect(createGroup({ ...fields(people('Anna', 'Ben')), name: '   ' })).toEqual({
      ok: false,
      error: 'name-empty',
    });
  });
});

describe('US-PG-02 AK-3: number of members', () => {
  it.each([0, 1, 13])('rejects %i members', (count) => {
    const persons = people(
      ...Array.from({ length: count }, (_, index) => `Person ${String(index)}`),
    );

    expect(createGroup(fields(persons, { colors: [] }))).toEqual({
      ok: false,
      error: 'member-count-invalid',
    });
  });
});

describe('US-PG-02 AK-4: binding to Catan', () => {
  it('rejects a group of 5 bound to Catan', () => {
    const persons = people('A', 'B', 'C', 'D', 'E');

    const result = createGroup(
      fields(persons, {
        binding: { kind: 'game', gameId: toGameId('c47a0000-0000-4000-8000-000000000001') },
        boundGame: CATAN,
      }),
    );

    expect(result).toEqual({ ok: false, error: 'binding-too-many-members' });
  });

  it('allows a group of 12 bound to a game without a limit below 12', () => {
    const persons = people(...Array.from({ length: 12 }, (_, index) => `P${String(index)}`));

    const result = createGroup(
      fields(persons, {
        binding: { kind: 'game', gameId: toGameId('00000000-0000-4000-8000-0000000000b1') },
        boundGame: { maxPlayers: 12, hasPlayerColors: false },
        colors: defaultColors(12, 'group-only'),
      }),
    );

    expect(result.ok).toBe(true);
  });
});

describe('US-PG-02 AK-6: same-named persons', () => {
  it('rejects persons with the same name ignoring case and spaces', () => {
    expect(createGroup(fields(people('Anna', ' anna ')))).toEqual({
      ok: false,
      error: 'same-named-members',
    });
  });

  it('names the affected persons', () => {
    const [anna, ben, annaAgain] = people('Anna', 'Ben', 'ANNA');

    expect(findSameNamedPersons([anna, ben, annaAgain].flatMap((p) => (p ? [p] : [])))).toEqual([
      [anna, annaAgain],
    ]);
  });

  it('finds nothing among different names', () => {
    expect(findSameNamedPersons(people('Anna', 'Ben'))).toEqual([]);
  });
});

describe('US-PG-03 colours of a created group', () => {
  it('AK-2: stores group colour and Catan colour in a global group of 4', () => {
    const result = createGroup(fields(people('A', 'B', 'C', 'D')));

    expect(result.ok && result.value.members.map((member) => member.catanColor)).toEqual([
      'red',
      'blue',
      'white',
      'orange',
    ]);
  });

  it('AK-4: stores no Catan colour in a group of 5', () => {
    const result = createGroup(fields(people('A', 'B', 'C', 'D', 'E')));

    expect(result.ok && result.value.members.every((m) => !('catanColor' in m))).toBe(true);
  });

  it('rejects colours that do not fit the persons (invariant)', () => {
    expect(() => createGroup(fields(people('Anna', 'Ben'), { colors: [] }))).toThrow(
      InvariantError,
    );
  });

  it('rejects a missing Catan colour in a scheme that needs one (invariant)', () => {
    const persons = people('Anna', 'Ben');

    expect(() => createGroup(fields(persons, { colors: defaultColors(2, 'group-only') }))).toThrow(
      InvariantError,
    );
  });

  it('rejects the same group colour twice (invariant)', () => {
    const persons = people('Anna', 'Ben');

    expect(() =>
      createGroup(
        fields(persons, {
          colors: [
            { groupColor: 'red', catanColor: 'red' },
            { groupColor: 'red', catanColor: 'blue' },
          ],
        }),
      ),
    ).toThrow(InvariantError);
  });

  it('rejects the same person twice (invariant)', () => {
    const [anna] = people('Anna');
    const persons = anna ? [anna, anna] : [];

    expect(() => createGroup(fields(persons))).toThrow(InvariantError);
  });

  it('AK-3: requires the group colour to equal the Catan colour in a group bound to Catan', () => {
    const persons = people('Anna', 'Ben');

    expect(() =>
      createGroup(
        fields(persons, {
          binding: { kind: 'game', gameId: toGameId('c47a0000-0000-4000-8000-000000000001') },
          boundGame: CATAN,
          colors: [
            { groupColor: 'yellow', catanColor: 'red' },
            { groupColor: 'blue', catanColor: 'blue' },
          ],
        }),
      ),
    ).toThrow(InvariantError);
  });
});

describe('E-27 global group that excludes Catan', () => {
  it('US-PG-02 AK-7: creates a group of 3 with group colours only', () => {
    const persons = people('Anna', 'Ben', 'Clara');

    const result = createGroup(
      fields(persons, {
        binding: { kind: 'global', excludesCatan: true },
        colors: defaultColors(3, 'group-only'),
      }),
    );

    expect(result.ok && result.value.binding).toEqual({ kind: 'global', excludesCatan: true });
    expect(result.ok && result.value.members.every((member) => !('catanColor' in member))).toBe(
      true,
    );
  });

  it('US-PG-03 AK-4: rejects Catan colours in a group that excludes Catan (invariant)', () => {
    const persons = people('Anna', 'Ben');

    expect(() =>
      createGroup(
        fields(persons, {
          binding: { kind: 'global', excludesCatan: true },
          colors: defaultColors(2, 'both'),
        }),
      ),
    ).toThrow(InvariantError);
  });

  it('US-PG-03 AK-2: still needs Catan colours if Catan is explicitly not excluded', () => {
    const persons = people('Anna', 'Ben');

    expect(() =>
      createGroup(
        fields(persons, {
          binding: { kind: 'global', excludesCatan: false },
          colors: defaultColors(2, 'group-only'),
        }),
      ),
    ).toThrow(InvariantError);
  });
});

const LATER = '2026-10-26T20:00:00.000Z';
const CATAN_ID = toGameId('c47a0000-0000-4000-8000-000000000001');
const UNO = { maxPlayers: 12, hasPlayerColors: false };

function aStoredGroup(persons: Person[]): Group {
  const result = createGroup(fields(persons));
  if (!result.ok) {
    throw new Error('the test group is valid');
  }
  return result.value;
}

function colorsOf(group: Group): MemberColors[] {
  return group.members.map(({ groupColor, catanColor }) =>
    catanColor === undefined ? { groupColor } : { groupColor, catanColor },
  );
}

function changes(group: Group, overrides: Partial<GroupChanges> = {}): GroupChanges {
  return {
    name: group.name,
    binding: group.binding,
    boundGame: null,
    colors: colorsOf(group),
    now: LATER,
    ...overrides,
  };
}

describe('US-VW-02 Edit a group', () => {
  it('AK-1: changes name and colours and keeps id and creation time', () => {
    const group = aStoredGroup(people('Anna', 'Ben'));
    const colors: MemberColors[] = [
      { groupColor: 'green', catanColor: 'white' },
      { groupColor: 'red', catanColor: 'orange' },
    ];

    const result = editGroup(group, changes(group, { name: '  Die Zwei ', colors }));

    expect(result).toEqual({
      ok: true,
      value: {
        ...group,
        name: 'Die Zwei',
        members: group.members.map((member, index) => ({
          personId: member.personId,
          ...colors[index],
        })),
        updatedAt: LATER,
      },
    });
  });

  it('AK-1: requires a name', () => {
    const group = aStoredGroup(people('Anna', 'Ben'));

    expect(editGroup(group, changes(group, { name: '  ' }))).toEqual({
      ok: false,
      error: 'name-empty',
    });
  });

  it('AK-2: keeps the members and their order', () => {
    const group = aStoredGroup(people('Anna', 'Ben', 'Clara'));

    const result = editGroup(group, changes(group, { name: 'Neu' }));

    expect(result.ok && result.value.members.map((member) => member.personId)).toEqual(
      group.members.map((member) => member.personId),
    );
  });

  it('AK-3: rejects binding a group of 5 to Catan', () => {
    const group = aStoredGroup(people('A', 'B', 'C', 'D', 'E'));

    const result = editGroup(
      group,
      changes(group, { binding: { kind: 'game', gameId: CATAN_ID }, boundGame: CATAN }),
    );

    expect(result).toEqual({ ok: false, error: 'binding-too-many-members' });
  });

  it('AK-3: binds a group of 4 to Catan with one colour for both purposes', () => {
    const group = aStoredGroup(people('A', 'B', 'C', 'D'));

    const result = editGroup(
      group,
      changes(group, {
        binding: { kind: 'game', gameId: CATAN_ID },
        boundGame: CATAN,
        colors: normalizeColors(colorsOf(group), 'catan-only'),
      }),
    );

    expect(result.ok && result.value.binding).toEqual({ kind: 'game', gameId: CATAN_ID });
    expect(
      result.ok && result.value.members.every((member) => member.groupColor === member.catanColor),
    ).toBe(true);
  });

  it('AK-4: assigns Catan colours when a group bound to a custom game becomes global', () => {
    const uno = toGameId('00000000-0000-4000-8000-0000000000b1');
    const group = aStoredGroup(people('Anna', 'Ben'));
    const unoColors: MemberColors[] = [{ groupColor: 'green' }, { groupColor: 'magenta' }];
    const bound = editGroup(
      group,
      changes(group, { binding: { kind: 'game', gameId: uno }, boundGame: UNO, colors: unoColors }),
    );
    if (!bound.ok) {
      throw new Error('binding to Uno is valid');
    }

    const result = editGroup(
      bound.value,
      changes(bound.value, {
        binding: { kind: 'global' },
        colors: normalizeColors(colorsOf(bound.value), 'both'),
      }),
    );

    expect(result.ok && colorsOf(result.value)).toEqual([
      { groupColor: 'green', catanColor: 'red' },
      { groupColor: 'magenta', catanColor: 'blue' },
    ]);
  });

  it('AK-6: drops the Catan colours when Catan is excluded', () => {
    const group = aStoredGroup(people('Anna', 'Ben'));

    const result = editGroup(
      group,
      changes(group, {
        binding: { kind: 'global', excludesCatan: true },
        colors: normalizeColors(colorsOf(group), 'group-only'),
      }),
    );

    expect(result.ok && result.value.binding).toEqual({ kind: 'global', excludesCatan: true });
    expect(result.ok && colorsOf(result.value)).toEqual([
      { groupColor: 'red' },
      { groupColor: 'blue' },
    ]);
  });

  it('AK-6: assigns Catan colours again when Catan is allowed again', () => {
    const created = createGroup(
      fields(people('Anna', 'Ben'), {
        binding: { kind: 'global', excludesCatan: true },
        colors: [{ groupColor: 'green' }, { groupColor: 'red' }],
      }),
    );
    if (!created.ok) {
      throw new Error('the test group is valid');
    }

    const result = editGroup(
      created.value,
      changes(created.value, {
        binding: { kind: 'global' },
        colors: normalizeColors(colorsOf(created.value), 'both'),
      }),
    );

    expect(result.ok && colorsOf(result.value)).toEqual([
      { groupColor: 'green', catanColor: 'red' },
      { groupColor: 'red', catanColor: 'blue' },
    ]);
  });

  it('rejects colours that do not fit the new binding (invariant)', () => {
    const group = aStoredGroup(people('Anna', 'Ben'));

    expect(() =>
      editGroup(group, changes(group, { binding: { kind: 'global', excludesCatan: true } })),
    ).toThrow(InvariantError);
  });

  it('rejects colours for a different number of members (invariant)', () => {
    const group = aStoredGroup(people('Anna', 'Ben'));

    expect(() => editGroup(group, changes(group, { colors: defaultColors(3, 'both') }))).toThrow(
      InvariantError,
    );
  });
});

describe('US-VW-06 AK-2: name conflicts in the groups of a person', () => {
  const persons = people('Anna', 'Ben', 'Clara', 'Dora');
  const [anna, ben, clara, dora] = persons;
  if (anna === undefined || ben === undefined || clara === undefined || dora === undefined) {
    throw new Error('four test persons exist');
  }
  const annaBen = aStoredGroup([anna, ben]);
  const claraDora = {
    ...aStoredGroup([clara, dora]),
    id: toGroupId('00000000-0000-4000-8000-0000000000c2'),
  };
  const groups = [annaBen, claraDora];

  it('finds the group in which another member has the new name, ignoring case', () => {
    expect(findNameConflicts(groups, persons, anna.id, ' BEN ')).toEqual([annaBen]);
  });

  it('ignores groups the person is not a member of', () => {
    expect(findNameConflicts(groups, persons, anna.id, 'Clara')).toEqual([]);
  });

  it('ignores the person itself', () => {
    expect(findNameConflicts(groups, persons, anna.id, 'anna')).toEqual([]);
  });
});
