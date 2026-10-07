import {
  aCustomGame,
  aPerson,
  fixedClock,
  InMemoryMasterDataStore,
  sequentialIds,
  TEST_NOW,
} from '@tests/support/masterDataFakes';
import { describe, expect, it } from 'vitest';
import type { MasterDataStore } from '@/app/ports';
import { defaultColors, toGameId, toPersonId, type PersonId } from '@/core/model';
import { InvariantError } from '@/core/shared';
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

    const result = await service.createPerson({ name: ' Anna ', isDuplicateConfirmed: false });

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

    const result = await service.createPerson({ name, isDuplicateConfirmed: true });

    expect(result).toEqual({ ok: false, error: 'name-empty' });
    expect(store.persons).toEqual([]);
  });

  it('AK-3: reports a same-named person and does not save without confirmation', async () => {
    const store = new InMemoryMasterDataStore();
    store.persons = [aPerson({ name: 'Anna' })];
    const { service } = setUp(store);

    const result = await service.createPerson({ name: ' aNNa', isDuplicateConfirmed: false });

    expect(result).toEqual({ ok: false, error: 'name-duplicate' });
    expect(store.persons).toHaveLength(1);
  });

  it('AK-3: saves a same-named person after confirmation', async () => {
    const store = new InMemoryMasterDataStore();
    store.persons = [aPerson({ name: 'Anna' })];
    const { service } = setUp(store);

    const result = await service.createPerson({ name: 'anna', isDuplicateConfirmed: true });

    expect(result.ok).toBe(true);
    expect(store.persons.map((person) => person.name)).toEqual(['Anna', 'anna']);
  });

  it('AK-3: also reports a same-named archived person', async () => {
    const store = new InMemoryMasterDataStore();
    store.persons = [aPerson({ name: 'Anna', archived: true })];
    const { service } = setUp(store);

    const result = await service.createPerson({ name: 'Anna', isDuplicateConfirmed: false });

    expect(result).toEqual({ ok: false, error: 'name-duplicate' });
  });

  it('does not report a duplicate for a different name', async () => {
    const store = new InMemoryMasterDataStore();
    store.persons = [aPerson({ name: 'Anna' })];
    const { service } = setUp(store);

    const result = await service.createPerson({ name: 'Ben', isDuplicateConfirmed: false });

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
            },
          }),
        ),
    };
    const { service } = setUp(failing);

    await expect(
      service.createPerson({ name: 'Anna', isDuplicateConfirmed: false }),
    ).rejects.toThrow('disk full');
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
