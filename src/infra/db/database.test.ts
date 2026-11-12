import { aPerson } from '@tests/support/masterDataFakes';
import { createTestDb, createTestIndexedDb } from '@tests/support/testDatabase';
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
  it('opens with schema version 1 and the stores and indexes of version 1', async () => {
    const db = track(createTestDb());

    await db.open();

    expect(db.verno).toBe(1);
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

  it('keeps data when the app is opened again (reload)', async () => {
    const indexedDB = createTestIndexedDb();
    const first = track(createTestDb(indexedDB));
    await first.persons.add(aPerson({ name: 'Anna' }));
    first.close();

    const second = track(createTestDb(indexedDB));

    expect(await second.persons.toArray()).toEqual([aPerson({ name: 'Anna' })]);
  });
});
