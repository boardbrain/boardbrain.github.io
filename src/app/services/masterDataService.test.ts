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
import { createMasterDataService, type MasterDataService } from './masterDataService';

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
