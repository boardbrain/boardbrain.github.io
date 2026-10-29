import type { MasterDataRepositories, MasterDataStore } from '@/app/ports';
import { CURRENT_SESSION_ID } from '@/core/generation';
import type { IsoTimestamp } from '@/core/model';
import { assert } from '@/core/shared';
import type { BoardBrainDb } from './database';

/**
 * Records a change of user data in `meta.state` (Architecture 7.4). Called by every
 * repository write inside the same transaction, so no change can be forgotten.
 */
async function recordUserDataChange(db: BoardBrainDb, at: IsoTimestamp): Promise<void> {
  const entry = await db.meta.get('state');
  const state = entry?.value ?? {};
  await db.meta.put({
    key: 'state',
    value: { ...state, lastUserDataChangeAt: at, firstDataAt: state.firstDataAt ?? at },
  });
}

function repositories(db: BoardBrainDb): MasterDataRepositories {
  return {
    persons: {
      listAll: () => db.persons.toArray(),
      add: async (person) => {
        await db.persons.add(person);
        await recordUserDataChange(db, person.updatedAt);
      },
      update: async (person) => {
        const stored = await db.persons.get(person.id);
        assert(stored !== undefined, `the person ${person.id} exists`);
        await db.persons.put(person);
        await recordUserDataChange(db, person.updatedAt);
      },
    },
    groups: {
      listAll: () => db.groups.toArray(),
      add: async (group) => {
        await db.groups.add(group);
        await recordUserDataChange(db, group.updatedAt);
      },
      update: async (group) => {
        const stored = await db.groups.get(group.id);
        assert(stored !== undefined, `the group ${group.id} exists`);
        await db.groups.put(group);
        await recordUserDataChange(db, group.updatedAt);
      },
    },
    customGames: {
      listAll: () => db.games.toArray(),
      add: async (game) => {
        await db.games.add(game);
        await recordUserDataChange(db, game.updatedAt);
      },
      update: async (game) => {
        const stored = await db.games.get(game.id);
        assert(stored !== undefined, `the game ${game.id} exists`);
        await db.games.put(game);
        await recordUserDataChange(db, game.updatedAt);
      },
    },
    session: {
      get: () => db.session.get(CURRENT_SESSION_ID),
    },
  };
}

/**
 * Master data storage on IndexedDB (Architecture 7.3). A transaction spans persons, groups, custom
 * games, `meta` and, for the locks during a match, the session; Dexie rolls it back completely
 * if `work` throws.
 */
export function createDexieMasterDataStore(db: BoardBrainDb): MasterDataStore {
  const repos = repositories(db);
  return {
    transaction: (work) =>
      db.transaction('rw', [db.persons, db.groups, db.games, db.meta, db.session], () =>
        work(repos),
      ),
  };
}
