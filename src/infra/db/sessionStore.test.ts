import { aGroup } from '@tests/support/masterDataFakes';
import { aStoredSession as aSession } from '@tests/support/sessionFakes';
import { createTestDb, createTestIndexedDb } from '@tests/support/testDatabase';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BoardBrainDb } from './database';
import { createDexieMasterDataStore } from './masterDataStore';
import { createDexieSessionStore } from './sessionStore';

let indexedDB: ReturnType<typeof createTestIndexedDb>;
let db: BoardBrainDb;

beforeEach(() => {
  indexedDB = createTestIndexedDb();
  db = createTestDb(indexedDB);
});

afterEach(() => {
  db.close();
});

describe('Architecture 10.2 stored session', () => {
  it('stores, reads and deletes the single session', async () => {
    const store = createDexieSessionStore(db);
    const session = aSession();

    await store.transaction(({ session: repository }) => repository.put(session));
    expect(await store.transaction(({ session: repository }) => repository.get())).toEqual(session);

    await store.transaction(({ session: repository }) => repository.delete());
    expect(await store.transaction(({ session: repository }) => repository.get())).toBeUndefined();
  });

  it('US-AB-05 AK-1, AK-3: the session with its revealed step survives reopening the database', async () => {
    const session = aSession();
    await createDexieSessionStore(db).transaction(({ session: repository }) =>
      repository.put(session),
    );
    db.close();

    db = createTestDb(indexedDB);
    const reopened = await createDexieSessionStore(db).transaction(({ session: repository }) =>
      repository.get(),
    );

    expect(reopened).toEqual(session);
    expect(reopened?.generation.steps.at(-1)?.status).toBe('revealed');
    expect(reopened?.generation.gameState.hiddenPlan).toHaveLength(7);
  });

  it('replaces the stored session instead of adding a second one', async () => {
    const store = createDexieSessionStore(db);
    const session = aSession();

    await store.transaction(({ session: repository }) => repository.put(session));
    await store.transaction(({ session: repository }) =>
      repository.put({ ...session, startedAt: '2026-10-08T09:00:00.000Z' }),
    );

    expect(await db.session.count()).toBe(1);
  });

  it('ADR-014: a failing transaction stores nothing', async () => {
    const store = createDexieSessionStore(db);

    await expect(
      store.transaction(async ({ session: repository }) => {
        await repository.put(aSession());
        throw new Error('failure after writing');
      }),
    ).rejects.toThrow('failure after writing');

    expect(await db.session.count()).toBe(0);
  });

  it('reads the groups inside the session transaction', async () => {
    await db.groups.add(aGroup());

    const groups = await createDexieSessionStore(db).transaction(({ groups: repository }) =>
      repository.listAll(),
    );

    expect(groups).toEqual([aGroup()]);
  });

  it('Architecture 10.4: master data transactions read the session for their locks', async () => {
    const session = aSession();
    await db.session.put(session);

    const read = await createDexieMasterDataStore(db).transaction(({ session: repository }) =>
      repository.get(),
    );

    expect(read).toEqual(session);
  });

  it('writing the session records no change of user data (Architecture 7.4)', async () => {
    await createDexieSessionStore(db).transaction(({ session: repository }) =>
      repository.put(aSession()),
    );

    expect(await db.meta.get('state')).toBeUndefined();
  });
});
