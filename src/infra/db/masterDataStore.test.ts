import { aCustomGame, aPerson } from '@tests/support/masterDataFakes';
import { createTestDb } from '@tests/support/testDatabase';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { MasterDataStore } from '@/app/ports';
import type { BoardBrainDb } from './database';
import { createDexieMasterDataStore } from './masterDataStore';

const EARLIER = '2026-10-07T18:00:00.000Z';
const LATER = '2026-10-08T09:15:00.000Z';

let db: BoardBrainDb;
let store: MasterDataStore;

beforeEach(() => {
  db = createTestDb();
  store = createDexieMasterDataStore(db);
});

afterEach(() => {
  db.close();
});

describe('Architecture 7.3 master data repositories', () => {
  it('adds persons and lists all of them', async () => {
    const anna = aPerson({ name: 'Anna' });

    await store.transaction(({ persons }) => persons.add(anna));

    expect(await store.transaction(({ persons }) => persons.listAll())).toEqual([anna]);
    expect(await db.persons.toArray()).toEqual([anna]);
  });

  it('adds custom games and lists all of them', async () => {
    const uno = aCustomGame({ name: 'Uno' });

    await store.transaction(({ customGames }) => customGames.add(uno));

    expect(await store.transaction(({ customGames }) => customGames.listAll())).toEqual([uno]);
    expect(await db.games.toArray()).toEqual([uno]);
  });

  it('rejects a second record with the same id', async () => {
    const anna = aPerson();
    await store.transaction(({ persons }) => persons.add(anna));

    await expect(store.transaction(({ persons }) => persons.add(anna))).rejects.toThrow();
  });
});

describe('Architecture 7.4 change of user data', () => {
  it('records the first creation and the last change in the same transaction', async () => {
    await store.transaction(({ persons }) => persons.add(aPerson({ updatedAt: EARLIER })));

    expect(await db.meta.get('state')).toEqual({
      key: 'state',
      value: { lastUserDataChangeAt: EARLIER, firstDataAt: EARLIER },
    });
  });

  it('keeps the first creation and moves the last change forward', async () => {
    await store.transaction(({ persons }) => persons.add(aPerson({ updatedAt: EARLIER })));

    await store.transaction(({ customGames }) =>
      customGames.add(aCustomGame({ updatedAt: LATER })),
    );

    expect((await db.meta.get('state'))?.value).toEqual({
      lastUserDataChangeAt: LATER,
      firstDataAt: EARLIER,
    });
  });
});

describe('Architecture 4.4 transaction boundary', () => {
  it('rolls back everything if the work throws', async () => {
    const work = store.transaction(async ({ persons }) => {
      await persons.add(aPerson());
      throw new Error('unexpected');
    });

    await expect(work).rejects.toThrow('unexpected');
    expect(await db.persons.count()).toBe(0);
    expect(await db.meta.get('state')).toBeUndefined();
  });
});
