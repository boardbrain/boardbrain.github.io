import {
  aCustomGame,
  aGroup,
  aPerson,
  fixedClock,
  InMemoryMasterDataStore,
  sequentialIds,
  TEST_NOW,
} from '@tests/support/masterDataFakes';
import { aCatanSetup } from '@tests/support/catanGeneration';
import { describe, expect, it } from 'vitest';
import type { MasterDataStore, StoredSession } from '@/app/ports';
import { startGeneration } from '@/core/generation';
import {
  defaultColors,
  toGameId,
  toGroupId,
  toPersonId,
  type GroupId,
  type PersonId,
} from '@/core/model';
import { InvariantError } from '@/core/shared';
import { CATAN_INITIAL_GAME_STATE } from '@/games/catan';
import {
  createMasterDataService,
  type CreateGroupInput,
  type MasterDataService,
} from './masterDataService';

const FIRST_ID = '00000000-0000-4000-8000-000000000001';

function setUp(store: MasterDataStore = new InMemoryMasterDataStore()): {
  service: MasterDataService;
} {
  const service = createMasterDataService({
    store,
    ids: sequentialIds(),
    clock: fixedClock(),
    supportedGameNames: ['Catan'],
  });
  return { service };
}

describe('US-PG-01 Create a person', () => {
  it('AK-1: saves the person with id, cleaned name and timestamps', async () => {
    const store = new InMemoryMasterDataStore();
    const { service } = setUp(store);

    const result = await service.createPerson({ name: ' Anna ' });

    const anna = {
      id: FIRST_ID,
      name: 'Anna',
      archived: false,
      createdAt: TEST_NOW,
      updatedAt: TEST_NOW,
    };
    expect(result).toEqual({ ok: true, value: anna });
    expect(store.persons).toEqual([anna]);
  });

  it.each(['', '   '])('AK-2: does not save the blank name %j', async (name) => {
    const store = new InMemoryMasterDataStore();
    const { service } = setUp(store);

    const result = await service.createPerson({ name });

    expect(result).toEqual({ ok: false, error: 'name-empty' });
    expect(store.persons).toEqual([]);
  });

  it('AK-3: refuses a same-named person ignoring case and spaces', async () => {
    const store = new InMemoryMasterDataStore();
    store.persons = [aPerson({ name: 'Anna' })];
    const { service } = setUp(store);

    const result = await service.createPerson({ name: ' aNNa' });

    expect(result).toEqual({ ok: false, error: 'name-duplicate' });
    expect(store.persons).toHaveLength(1);
  });

  it('AK-3: also refuses the name of an archived person', async () => {
    const store = new InMemoryMasterDataStore();
    store.persons = [aPerson({ name: 'Anna', archived: true })];
    const { service } = setUp(store);

    const result = await service.createPerson({ name: 'Anna' });

    expect(result).toEqual({ ok: false, error: 'name-duplicate' });
  });

  it('does not report a duplicate for a different name', async () => {
    const store = new InMemoryMasterDataStore();
    store.persons = [aPerson({ name: 'Anna' })];
    const { service } = setUp(store);

    const result = await service.createPerson({ name: 'Ben' });

    expect(result.ok).toBe(true);
    expect(store.persons).toHaveLength(2);
  });
});

describe('US-SP-02 Create a custom game', () => {
  it('AK-1: saves the custom game with id, cleaned name and timestamps', async () => {
    const store = new InMemoryMasterDataStore();
    const { service } = setUp(store);

    const result = await service.createCustomGame(' Uno ');

    const uno = {
      id: FIRST_ID,
      name: 'Uno',
      archived: false,
      createdAt: TEST_NOW,
      updatedAt: TEST_NOW,
    };
    expect(result).toEqual({ ok: true, value: uno });
    expect(store.customGames).toEqual([uno]);
  });

  it('does not save a blank name', async () => {
    const store = new InMemoryMasterDataStore();
    const { service } = setUp(store);

    const result = await service.createCustomGame('  ');

    expect(result).toEqual({ ok: false, error: 'name-empty' });
    expect(store.customGames).toEqual([]);
  });

  it('AK-2: rejects the name of an existing custom game ignoring case', async () => {
    const store = new InMemoryMasterDataStore();
    store.customGames = [aCustomGame({ name: 'Uno' })];
    const { service } = setUp(store);

    const result = await service.createCustomGame('UNO');

    expect(result).toEqual({ ok: false, error: 'name-duplicate' });
    expect(store.customGames).toHaveLength(1);
  });

  it('AK-2: rejects the name of an archived custom game', async () => {
    const store = new InMemoryMasterDataStore();
    store.customGames = [aCustomGame({ name: 'Uno', archived: true })];
    const { service } = setUp(store);

    expect(await service.createCustomGame('Uno')).toEqual({ ok: false, error: 'name-duplicate' });
  });

  it('AK-2: rejects the name of the supported game Catan ignoring case', async () => {
    const store = new InMemoryMasterDataStore();
    const { service } = setUp(store);

    const result = await service.createCustomGame(' catan ');

    expect(result).toEqual({ ok: false, error: 'name-duplicate' });
    expect(store.customGames).toEqual([]);
  });
});

describe('Architecture 4.4 transaction boundary', () => {
  it('passes on an unexpected storage error and saves nothing', async () => {
    const store = new InMemoryMasterDataStore();
    const failing: MasterDataStore = {
      transaction: (work) =>
        store.transaction((repositories) =>
          work({
            ...repositories,
            persons: {
              listAll: () => repositories.persons.listAll(),
              add: () => Promise.reject(new Error('disk full')),
              update: () => Promise.reject(new Error('disk full')),
            },
          }),
        ),
    };
    const { service } = setUp(failing);

    await expect(service.createPerson({ name: 'Anna' })).rejects.toThrow('disk full');
    expect(store.persons).toEqual([]);
  });
});

describe('US-PG-02 Create a group', () => {
  const catanId = toGameId('c47a0000-0000-4000-8000-000000000001');
  const annaId = toPersonId('00000000-0000-4000-8000-0000000000a1');
  const benId = toPersonId('00000000-0000-4000-8000-0000000000a2');
  const claraId = toPersonId('00000000-0000-4000-8000-0000000000a3');

  function storeWith(...names: string[]): InMemoryMasterDataStore {
    const store = new InMemoryMasterDataStore();
    store.persons = names.map((name, index) =>
      aPerson({
        id: toPersonId(`00000000-0000-4000-8000-0000000000a${String(index + 1)}`),
        name,
      }),
    );
    return store;
  }

  it('AK-1: saves a global group with id, members, colours and timestamps', async () => {
    const store = storeWith('Anna', 'Ben');
    const { service } = setUp(store);

    const result = await service.createGroup({
      name: ' Anna & Ben ',
      binding: { kind: 'global' },
      personIds: [annaId, benId],
      colors: defaultColors(2, 'both'),
    });

    expect(result).toEqual({
      ok: true,
      value: {
        id: FIRST_ID,
        name: 'Anna & Ben',
        archived: false,
        binding: { kind: 'global' },
        members: [
          { personId: annaId, groupColor: 'red', catanColor: 'red' },
          { personId: benId, groupColor: 'blue', catanColor: 'blue' },
        ],
        createdAt: TEST_NOW,
        updatedAt: TEST_NOW,
      },
    });
    expect(store.groups).toHaveLength(1);
  });

  it('AK-3: refuses fewer than two members and saves nothing', async () => {
    const store = storeWith('Anna');
    const { service } = setUp(store);

    const result = await service.createGroup({
      name: 'Anna',
      binding: { kind: 'global' },
      personIds: [annaId],
      colors: defaultColors(1, 'both'),
    });

    expect(result).toEqual({ ok: false, error: 'member-count-invalid' });
    expect(store.groups).toEqual([]);
  });

  it('AK-4: refuses a group of 5 bound to Catan', async () => {
    const store = storeWith('A', 'B', 'C', 'D', 'E');
    const { service } = setUp(store);

    const result = await service.createGroup({
      name: 'Fünf',
      binding: { kind: 'game', gameId: catanId },
      personIds: store.persons.map((person) => person.id),
      colors: defaultColors(5, 'group-only'),
    });

    expect(result).toEqual({ ok: false, error: 'binding-too-many-members' });
  });

  it('US-PG-03 AK-3: a group bound to Catan keeps one colour for both purposes', async () => {
    const store = storeWith('Anna', 'Ben', 'Clara');
    const { service } = setUp(store);

    const result = await service.createGroup({
      name: 'Catan',
      binding: { kind: 'game', gameId: catanId },
      personIds: [annaId, benId, claraId],
      colors: defaultColors(3, 'catan-only'),
    });

    expect(result.ok && result.value.members.map((m) => [m.groupColor, m.catanColor])).toEqual([
      ['red', 'red'],
      ['blue', 'blue'],
      ['white', 'white'],
    ]);
  });

  it('US-PG-03 AK-4: a group bound to a custom game has only group colours', async () => {
    const store = storeWith('A', 'B', 'C', 'D', 'E');
    const uno = aCustomGame();
    store.customGames = [uno];
    const { service } = setUp(store);

    const result = await service.createGroup({
      name: 'Uno-Runde',
      binding: { kind: 'game', gameId: uno.id },
      personIds: store.persons.map((person) => person.id),
      colors: defaultColors(5, 'group-only'),
    });

    expect(result.ok && result.value.members.every((member) => !('catanColor' in member))).toBe(
      true,
    );
  });

  it('AK-5: a person can be member of several groups', async () => {
    const store = storeWith('Anna', 'Ben', 'Clara');
    const { service } = setUp(store);
    const input = (personIds: PersonId[], name: string): CreateGroupInput => ({
      name,
      binding: { kind: 'global' },
      personIds,
      colors: defaultColors(personIds.length, 'both'),
    });

    const first = await service.createGroup(input([annaId, benId], 'Erste'));
    const second = await service.createGroup(input([annaId, claraId], 'Zweite'));

    expect(first.ok && second.ok).toBe(true);
    expect(store.groups).toHaveLength(2);
  });

  it('AK-6: refuses same-named persons', async () => {
    const store = storeWith('Anna', 'anna');
    const { service } = setUp(store);

    const result = await service.createGroup({
      name: 'Doppelt',
      binding: { kind: 'global' },
      personIds: [annaId, benId],
      colors: defaultColors(2, 'both'),
    });

    expect(result).toEqual({ ok: false, error: 'same-named-members' });
    expect(store.groups).toEqual([]);
  });

  it('throws for a person that does not exist', async () => {
    const { service } = setUp(storeWith('Anna'));

    await expect(
      service.createGroup({
        name: 'Gruppe',
        binding: { kind: 'global' },
        personIds: [annaId, benId],
        colors: defaultColors(2, 'both'),
      }),
    ).rejects.toThrow(InvariantError);
  });

  it('throws for a game that does not exist', async () => {
    const { service } = setUp(storeWith('Anna', 'Ben'));

    await expect(
      service.createGroup({
        name: 'Gruppe',
        binding: { kind: 'game', gameId: toGameId('00000000-0000-4000-8000-0000000000ff') },
        personIds: [annaId, benId],
        colors: defaultColors(2, 'group-only'),
      }),
    ).rejects.toThrow(InvariantError);
  });
});

describe('E-27 Create a global group that excludes Catan', () => {
  it('US-PG-02 AK-7: saves the exclusion and only group colours', async () => {
    const store = new InMemoryMasterDataStore();
    store.persons = [
      aPerson({ id: toPersonId('00000000-0000-4000-8000-0000000000a1'), name: 'Anna' }),
      aPerson({ id: toPersonId('00000000-0000-4000-8000-0000000000a2'), name: 'Ben' }),
    ];
    const { service } = setUp(store);

    const result = await service.createGroup({
      name: 'Ohne Catan',
      binding: { kind: 'global', excludesCatan: true },
      personIds: [
        toPersonId('00000000-0000-4000-8000-0000000000a1'),
        toPersonId('00000000-0000-4000-8000-0000000000a2'),
      ],
      colors: defaultColors(2, 'group-only'),
    });

    expect(result.ok && result.value.binding).toEqual({ kind: 'global', excludesCatan: true });
    expect(store.groups[0]?.members.map((member) => member.groupColor)).toEqual(['red', 'blue']);
    expect(store.groups[0]?.members.every((member) => !('catanColor' in member))).toBe(true);
  });
});

const LATER = '2026-10-26T20:00:00.000Z';
const ANNA_ID = toPersonId('00000000-0000-4000-8000-0000000000a1');
const BEN_ID = toPersonId('00000000-0000-4000-8000-0000000000a2');
const CLARA_ID = toPersonId('00000000-0000-4000-8000-0000000000a3');
const DORA_ID = toPersonId('00000000-0000-4000-8000-0000000000a4');

function editSetUp(store: InMemoryMasterDataStore): MasterDataService {
  return createMasterDataService({
    store,
    ids: sequentialIds(),
    clock: fixedClock(LATER),
    supportedGameNames: ['Catan'],
  });
}

describe('US-VW-06 Rename a person', () => {
  function storeWithTable(): InMemoryMasterDataStore {
    const store = new InMemoryMasterDataStore();
    store.persons = [
      aPerson({ id: ANNA_ID, name: 'Ana' }),
      aPerson({ id: BEN_ID, name: 'Ben' }),
      aPerson({ id: CLARA_ID, name: 'Clara' }),
    ];
    // Anna and Ben share a table; Clara sits at none.
    store.groups = [aGroup()];
    return store;
  }

  it('AK-1: saves the cleaned new name with a new change time', async () => {
    const store = storeWithTable();
    const service = editSetUp(store);

    const result = await service.renamePerson({
      personId: ANNA_ID,
      name: ' Anna ',
    });

    const anna = aPerson({ id: ANNA_ID, name: 'Anna', updatedAt: LATER });
    expect(result).toEqual({ ok: true, value: anna });
    expect(store.persons[0]).toEqual(anna);
  });

  it('does not save a blank name', async () => {
    const store = storeWithTable();
    const service = editSetUp(store);

    const result = await service.renamePerson({
      personId: ANNA_ID,
      name: '  ',
    });

    expect(result).toEqual({ ok: false, error: 'name-empty' });
    expect(store.persons[0]?.name).toBe('Ana');
  });

  it('AK-2: refuses the name of another member of one of her groups', async () => {
    const store = storeWithTable();
    const service = editSetUp(store);

    const result = await service.renamePerson({ personId: ANNA_ID, name: 'ben' });

    expect(result).toEqual({ ok: false, error: 'name-duplicate' });
    expect(store.persons[0]?.name).toBe('Ana');
  });

  it('AK-2: refuses the name of a person outside her groups as well', async () => {
    const store = storeWithTable();
    const service = editSetUp(store);

    const result = await service.renamePerson({
      personId: ANNA_ID,
      name: 'Clara',
    });

    expect(result).toEqual({ ok: false, error: 'name-duplicate' });
    expect(store.persons[0]?.name).toBe('Ana');
  });

  it('AK-2: refuses the name of an archived person', async () => {
    const store = storeWithTable();
    store.persons = [...store.persons, aPerson({ id: DORA_ID, name: 'Dora', archived: true })];
    const service = editSetUp(store);

    const result = await service.renamePerson({ personId: ANNA_ID, name: 'DORA' });

    expect(result).toEqual({ ok: false, error: 'name-duplicate' });
  });

  it('allows changing only the case of her own name', async () => {
    const store = storeWithTable();
    const service = editSetUp(store);

    const result = await service.renamePerson({
      personId: ANNA_ID,
      name: 'ANA',
    });

    expect(result.ok && result.value.name).toBe('ANA');
  });

  it('throws for a person that does not exist', async () => {
    const service = editSetUp(new InMemoryMasterDataStore());

    await expect(service.renamePerson({ personId: ANNA_ID, name: 'Anna' })).rejects.toThrow(
      InvariantError,
    );
  });
});

describe('US-VW-02 Edit a group', () => {
  const catanId = toGameId('c47a0000-0000-4000-8000-000000000001');

  function storeWithGroup(memberCount = 2): InMemoryMasterDataStore {
    const store = new InMemoryMasterDataStore();
    const members = defaultColors(memberCount, memberCount <= 4 ? 'both' : 'group-only').map(
      (colors, index) => ({
        personId: toPersonId(`00000000-0000-4000-8000-0000000000a${String(index + 1)}`),
        ...colors,
      }),
    );
    store.persons = members.map(({ personId }, index) =>
      aPerson({ id: personId, name: `P${String(index)}` }),
    );
    store.groups = [aGroup({ members })];
    return store;
  }

  it('AK-1: saves name and colours with a new change time', async () => {
    const store = storeWithGroup();
    const service = editSetUp(store);
    const group = aGroup();

    const result = await service.editGroup({
      groupId: group.id,
      name: ' Die Zwei ',
      binding: { kind: 'global' },
      colors: [
        { groupColor: 'green', catanColor: 'blue' },
        { groupColor: 'red', catanColor: 'red' },
      ],
    });

    expect(result.ok && result.value).toEqual({
      ...group,
      name: 'Die Zwei',
      members: [
        { personId: ANNA_ID, groupColor: 'green', catanColor: 'blue' },
        { personId: BEN_ID, groupColor: 'red', catanColor: 'red' },
      ],
      updatedAt: LATER,
    });
    expect(store.groups).toHaveLength(1);
    expect(store.groups[0]?.name).toBe('Die Zwei');
  });

  function sessionOf(groupId: GroupId): StoredSession {
    return {
      id: 'current',
      schemaVersion: 1,
      gameId: catanId,
      groupId,
      setup: aCatanSetup(2),
      generation: startGeneration(CATAN_INITIAL_GAME_STATE),
      startedAt: TEST_NOW,
    };
  }

  it('AK-5: refuses changing the binding while the group is in a match', async () => {
    const store = storeWithGroup();
    store.session = sessionOf(aGroup().id);
    const service = editSetUp(store);

    const result = await service.editGroup({
      groupId: aGroup().id,
      name: 'Anna & Ben',
      binding: { kind: 'global', excludesCatan: true },
      colors: [{ groupColor: 'red' }, { groupColor: 'blue' }],
    });

    expect(result).toEqual({ ok: false, error: 'group-in-session' });
    expect(store.groups).toEqual([aGroup()]);
  });

  it('AK-5: keeps name and colours changeable while the group is in a match', async () => {
    const store = storeWithGroup();
    store.session = sessionOf(aGroup().id);
    const service = editSetUp(store);

    const result = await service.editGroup({
      groupId: aGroup().id,
      name: 'Die Zwei',
      binding: { kind: 'global' },
      colors: [
        { groupColor: 'blue', catanColor: 'blue' },
        { groupColor: 'red', catanColor: 'red' },
      ],
    });

    expect(result.ok).toBe(true);
  });

  it('AK-5: a match of another group does not lock the binding', async () => {
    const store = storeWithGroup();
    store.session = sessionOf(toGroupId('00000000-0000-4000-8000-0000000000c9'));
    const service = editSetUp(store);

    const result = await service.editGroup({
      groupId: aGroup().id,
      name: 'Anna & Ben',
      binding: { kind: 'game', gameId: catanId },
      colors: [
        { groupColor: 'red', catanColor: 'red' },
        { groupColor: 'blue', catanColor: 'blue' },
      ],
    });

    expect(result.ok).toBe(true);
  });

  it('AK-3: refuses binding a group of 5 to Catan and saves nothing', async () => {
    const store = storeWithGroup(5);
    const service = editSetUp(store);
    const before = store.groups[0];

    const result = await service.editGroup({
      groupId: aGroup().id,
      name: 'Fünf',
      binding: { kind: 'game', gameId: catanId },
      colors: defaultColors(5, 'group-only'),
    });

    expect(result).toEqual({ ok: false, error: 'binding-too-many-members' });
    expect(store.groups[0]).toBe(before);
  });

  it('AK-3: binds a group of 2 to a custom game', async () => {
    const store = storeWithGroup();
    const uno = aCustomGame();
    store.customGames = [uno];
    const service = editSetUp(store);

    const result = await service.editGroup({
      groupId: aGroup().id,
      name: 'Uno-Runde',
      binding: { kind: 'game', gameId: uno.id },
      colors: defaultColors(2, 'group-only'),
    });

    expect(result.ok && result.value.binding).toEqual({ kind: 'game', gameId: uno.id });
  });

  it('AK-6: saves the exclusion of Catan without Catan colours', async () => {
    const store = storeWithGroup();
    const service = editSetUp(store);

    const result = await service.editGroup({
      groupId: aGroup().id,
      name: 'Ohne Catan',
      binding: { kind: 'global', excludesCatan: true },
      colors: defaultColors(2, 'group-only'),
    });

    expect(result.ok).toBe(true);
    expect(store.groups[0]?.members.every((member) => !('catanColor' in member))).toBe(true);
  });

  it('throws for a group that does not exist', async () => {
    const service = editSetUp(new InMemoryMasterDataStore());

    await expect(
      service.editGroup({
        groupId: aGroup().id,
        name: 'Gruppe',
        binding: { kind: 'global' },
        colors: defaultColors(2, 'both'),
      }),
    ).rejects.toThrow(InvariantError);
  });
});

describe('US-VW-07 Rename a custom game', () => {
  const unoId = toGameId('00000000-0000-4000-8000-0000000000b1');
  const kniffelId = toGameId('00000000-0000-4000-8000-0000000000b2');

  function storeWithGames(): InMemoryMasterDataStore {
    const store = new InMemoryMasterDataStore();
    store.customGames = [
      aCustomGame({ id: unoId, name: 'Unno' }),
      aCustomGame({ id: kniffelId, name: 'Kniffel', archived: true }),
    ];
    return store;
  }

  it('AK-1: saves the cleaned new name with a new change time', async () => {
    const store = storeWithGames();
    const service = editSetUp(store);

    const result = await service.renameCustomGame({ gameId: unoId, name: ' Uno ' });

    const uno = aCustomGame({ id: unoId, name: 'Uno', updatedAt: LATER });
    expect(result).toEqual({ ok: true, value: uno });
    expect(store.customGames[0]).toEqual(uno);
  });

  it('does not save a blank name', async () => {
    const store = storeWithGames();
    const service = editSetUp(store);

    expect(await service.renameCustomGame({ gameId: unoId, name: ' ' })).toEqual({
      ok: false,
      error: 'name-empty',
    });
  });

  it.each(['kniffel', ' CATAN '])('AK-1: refuses the name %j of another game', async (name) => {
    const store = storeWithGames();
    const service = editSetUp(store);

    const result = await service.renameCustomGame({ gameId: unoId, name });

    expect(result).toEqual({ ok: false, error: 'name-duplicate' });
    expect(store.customGames[0]?.name).toBe('Unno');
  });

  it('AK-1: allows changing only the case of its own name', async () => {
    const store = storeWithGames();
    const service = editSetUp(store);

    const result = await service.renameCustomGame({ gameId: unoId, name: 'UNNO' });

    expect(result.ok && result.value.name).toBe('UNNO');
  });

  it('AK-2: throws for Catan, which is not a custom game', async () => {
    const service = editSetUp(storeWithGames());

    await expect(
      service.renameCustomGame({
        gameId: toGameId('c47a0000-0000-4000-8000-000000000001'),
        name: 'Siedler',
      }),
    ).rejects.toThrow(InvariantError);
  });
});

describe('E-31 Unique group names', () => {
  const otherGroupId = toGroupId('00000000-0000-4000-8000-0000000000c2');

  function storeWithTwoGroups(): InMemoryMasterDataStore {
    const store = new InMemoryMasterDataStore();
    store.persons = [aPerson({ id: ANNA_ID, name: 'Anna' }), aPerson({ id: BEN_ID, name: 'Ben' })];
    store.groups = [
      aGroup({ name: 'Freitagsrunde' }),
      aGroup({ id: otherGroupId, name: 'Familie', archived: true }),
    ];
    return store;
  }

  it('US-PG-02 AK-8: refuses a new group with the name of an archived group', async () => {
    const store = storeWithTwoGroups();
    const service = editSetUp(store);

    const result = await service.createGroup({
      name: ' familie ',
      binding: { kind: 'global' },
      personIds: [ANNA_ID, BEN_ID],
      colors: defaultColors(2, 'both'),
    });

    expect(result).toEqual({ ok: false, error: 'name-duplicate' });
    expect(store.groups).toHaveLength(2);
  });

  it('US-VW-02 AK-1: refuses renaming a group to the name of another group', async () => {
    const store = storeWithTwoGroups();
    const service = editSetUp(store);

    const result = await service.editGroup({
      groupId: aGroup().id,
      name: 'FAMILIE',
      binding: { kind: 'global' },
      colors: defaultColors(2, 'both'),
    });

    expect(result).toEqual({ ok: false, error: 'name-duplicate' });
    expect(store.groups[0]?.name).toBe('Freitagsrunde');
  });

  it('US-VW-02 AK-1: allows changing only the case of its own name', async () => {
    const store = storeWithTwoGroups();
    const service = editSetUp(store);

    const result = await service.editGroup({
      groupId: aGroup().id,
      name: 'FREITAGSRUNDE',
      binding: { kind: 'global' },
      colors: defaultColors(2, 'both'),
    });

    expect(result.ok && result.value.name).toBe('FREITAGSRUNDE');
  });
});
