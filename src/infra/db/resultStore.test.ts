import { aStoredSession } from '@tests/support/sessionFakes';
import { aMatch } from '@tests/support/resultFakes';
import { createTestDb } from '@tests/support/testDatabase';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ResultStore } from '@/app/ports';
import { toMatchId } from '@/core/model';
import { InvariantError } from '@/core/shared';
import type { BoardBrainDb } from './database';
import { createDexieResultStore } from './resultStore';

const LATER = '2026-10-08T09:15:00.000Z';

let db: BoardBrainDb;
let store: ResultStore;

beforeEach(() => {
  db = createTestDb();
  store = createDexieResultStore(db);
});

afterEach(() => {
  db.close();
});

describe('Architecture 7.3 match repository', () => {
  it('adds a match, reads it and records the change of user data', async () => {
    const match = aMatch();

    await store.transaction(({ matches }) => matches.add(match));

    expect(await store.transaction(({ matches }) => matches.get(match.id))).toEqual(match);
    expect(await db.matches.toArray()).toEqual([match]);
    expect(await db.meta.get('state')).toMatchObject({
      value: { lastUserDataChangeAt: match.updatedAt, firstDataAt: match.updatedAt },
    });
  });

  it('updates a stored match and records the change', async () => {
    const match = aMatch();
    await store.transaction(({ matches }) => matches.add(match));
    const changed = { ...match, notes: 'Revanche', updatedAt: LATER };

    await store.transaction(({ matches }) => matches.update(changed));

    expect(await db.matches.get(match.id)).toEqual(changed);
    expect(await db.meta.get('state')).toMatchObject({ value: { lastUserDataChangeAt: LATER } });
  });

  it('deletes a stored match and records the change at the given moment', async () => {
    const match = aMatch();
    await store.transaction(({ matches }) => matches.add(match));

    await store.transaction(({ matches }) => matches.delete(match.id, LATER));

    expect(await db.matches.count()).toBe(0);
    expect(await db.meta.get('state')).toMatchObject({ value: { lastUserDataChangeAt: LATER } });
  });

  it('gives undefined for a match that does not exist', async () => {
    const id = toMatchId('00000000-0000-4000-8000-0000000000d9');

    expect(await store.transaction(({ matches }) => matches.get(id))).toBeUndefined();
  });

  it('throws when updating or deleting a match that does not exist', async () => {
    await expect(store.transaction(({ matches }) => matches.update(aMatch()))).rejects.toThrow(
      InvariantError,
    );
    await expect(
      store.transaction(({ matches }) => matches.delete(aMatch().id, LATER)),
    ).rejects.toThrow(InvariantError);
  });
});

describe('FA-AB-08 storing a result ends the running match in one transaction', () => {
  it('adds the match and removes the session together', async () => {
    await db.session.put(aStoredSession());

    await store.transaction(async ({ matches, session }) => {
      await matches.add(aMatch());
      await session.delete();
    });

    expect(await db.matches.count()).toBe(1);
    expect(await db.session.count()).toBe(0);
  });

  it('keeps the session and stores no match if the transaction fails', async () => {
    const running = aStoredSession();
    await db.session.put(running);

    await expect(
      store.transaction(async ({ matches, session }) => {
        await matches.add(aMatch());
        await session.delete();
        throw new Error('crash in the middle');
      }),
    ).rejects.toThrow('crash in the middle');

    expect(await db.matches.count()).toBe(0);
    expect(await store.transaction(({ session }) => session.get())).toEqual(running);
    expect(await db.meta.get('state')).toBeUndefined();
  });

  it('reads groups and custom games', async () => {
    expect(await store.transaction(({ groups }) => groups.listAll())).toEqual([]);
    expect(await store.transaction(({ customGames }) => customGames.listAll())).toEqual([]);
  });
});
