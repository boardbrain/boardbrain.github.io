import { aPerson } from '@tests/support/masterDataFakes';
import { createTestDb } from '@tests/support/testDatabase';
import { afterEach, describe, expect, it } from 'vitest';
import type { ErrorLogEntry } from '@/app/ports';
import type { BoardBrainDb } from './database';
import { createDexieErrorLogStore, readErrorLog } from './errorLogStore';
import { createDexieMasterDataStore } from './masterDataStore';

const ENTRY: ErrorLogEntry = {
  at: '2026-11-12T20:00:00.000Z',
  address: '#/partie',
  message: 'TypeError: x',
  version: '0.1.0',
};

let db: BoardBrainDb | undefined;

afterEach(() => {
  db?.close();
});

describe('K-9 error log store', () => {
  it('starts empty', async () => {
    db = createTestDb();

    expect(await readErrorLog(db)).toEqual([]);
  });

  it('stores the changed entries', async () => {
    db = createTestDb();
    const store = createDexieErrorLogStore(db);

    await store.update((entries) => [ENTRY, ...entries]);
    await store.update((entries) => [{ ...ENTRY, message: 'second' }, ...entries]);

    expect((await readErrorLog(db)).map((entry) => entry.message)).toEqual([
      'second',
      'TypeError: x',
    ]);
  });

  it('Architecture 7.4: records no change of user data', async () => {
    db = createTestDb();

    await createDexieErrorLogStore(db).update(() => [ENTRY]);

    expect(await db.meta.get('state')).toBeUndefined();
  });

  it('leaves the state data untouched and is left untouched by it', async () => {
    db = createTestDb();
    await createDexieErrorLogStore(db).update(() => [ENTRY]);

    await createDexieMasterDataStore(db).transaction(({ persons }) =>
      persons.add(aPerson({ name: 'Anna', createdAt: ENTRY.at, updatedAt: ENTRY.at })),
    );

    expect(await readErrorLog(db)).toEqual([ENTRY]);
    expect((await db.meta.get('state'))?.value).toEqual({
      lastUserDataChangeAt: ENTRY.at,
      firstDataAt: ENTRY.at,
    });
  });
});
