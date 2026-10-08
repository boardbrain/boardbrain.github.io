import { describe, expect, it } from 'vitest';
import { InvariantError } from '@/core/shared';
import { createGroup, findSameNamedPersons, suggestGroupName, type NewGroupFields } from './group';
import { defaultColors } from './groupColors';
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
