import { defined } from '@tests/support/defined';
import { aPerson } from '@tests/support/masterDataFakes';
import { createTestDb, createTestIndexedDb } from '@tests/support/testDatabase';
import { Dexie } from 'dexie';
import { IDBKeyRange } from 'fake-indexeddb';
import { afterEach, describe, expect, it } from 'vitest';
import { type BoardBrainDb, SCHEMA_VERSIONS } from './database';

const openDbs: BoardBrainDb[] = [];

function track(db: BoardBrainDb): BoardBrainDb {
  openDbs.push(db);
  return db;
}

afterEach(() => {
  for (const db of openDbs.splice(0)) {
    db.close();
  }
});

describe('Architecture 7.3 database', () => {
  it('opens with schema version 2 and the stores and indexes of version 1', async () => {
    const db = track(createTestDb());

    await db.open();

    expect(db.verno).toBe(2);
    const schema = Object.fromEntries(
      db.tables.map((table) => [
        table.name,
        {
          key: table.schema.primKey.keyPath,
          indexes: table.schema.indexes.map((index) => index.name),
        },
      ]),
    );
    expect(schema).toEqual({
      persons: { key: 'id', indexes: ['name'] },
      groups: { key: 'id', indexes: [] },
      games: { key: 'id', indexes: [] },
      matches: { key: 'id', indexes: ['groupId', 'gameId', '[groupId+date]'] },
      snapshots: { key: 'id', indexes: ['createdAt', 'reason'] },
      session: { key: 'id', indexes: [] },
      meta: { key: 'key', indexes: [] },
    });
  });

  it('lists schema versions in strictly ascending order', () => {
    const versions = SCHEMA_VERSIONS.map((schema) => schema.version);

    expect(versions).toEqual(versions.toSorted((a, b) => a - b));
    expect(new Set(versions).size).toBe(versions.length);
  });

  it('ADR-031: version 2 turns the timer of a running match of session version 4 into pauses', async () => {
    const indexedDB = createTestIndexedDb();
    const old = new Dexie('boardbrain', { indexedDB, IDBKeyRange });
    old.version(1).stores(defined(SCHEMA_VERSIONS[0], 'version 1').stores);
    await old.table('session').put({
      id: 'current',
      schemaVersion: 4,
      gameId: 'catan',
      clock: {
        startedAt: '2026-11-15T18:00:00.000Z',
        pausedAt: '2026-11-15T19:00:00.000Z',
        pausedMs: 5 * 60_000,
      },
    });
    old.close();

    const db = track(createTestDb(indexedDB));
    const session = await db.session.get('current');

    expect(session?.schemaVersion).toBe(5);
    expect(session?.clock).toEqual({
      startedAt: '2026-11-15T18:00:00.000Z',
      pauses: [
        { from: '2026-11-15T18:00:00.000Z', to: '2026-11-15T18:05:00.000Z' },
        { from: '2026-11-15T19:00:00.000Z' },
      ],
    });
  });

  it('ADR-031: a session that is not of version 4 stays as it is', async () => {
    const indexedDB = createTestIndexedDb();
    const old = new Dexie('boardbrain', { indexedDB, IDBKeyRange });
    old.version(1).stores(defined(SCHEMA_VERSIONS[0], 'version 1').stores);
    await old.table('session').put({ id: 'current', schemaVersion: 3, clock: { pausedMs: 'x' } });
    old.close();

    const db = track(createTestDb(indexedDB));

    expect(await db.session.get('current')).toEqual({
      id: 'current',
      schemaVersion: 3,
      clock: { pausedMs: 'x' },
    });
  });

  it('keeps data when the app is opened again (reload)', async () => {
    const indexedDB = createTestIndexedDb();
    const first = track(createTestDb(indexedDB));
    await first.persons.add(aPerson({ name: 'Anna' }));
    first.close();

    const second = track(createTestDb(indexedDB));

    expect(await second.persons.toArray()).toEqual([aPerson({ name: 'Anna' })]);
  });
});
