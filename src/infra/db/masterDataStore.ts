import type { MasterDataRepositories, MasterDataStore } from '@/app/ports';
import { CURRENT_SESSION_ID } from '@/core/generation';
import { assert } from '@/core/shared';
import type { BoardBrainDb } from './database';
import { recordUserDataChange } from './userDataChange';

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
    matches: {
      // A Dexie promise, so the transaction stays open (Architecture 7.3).
      hasScores: (gameId) =>
        db.matches
          .where('gameId')
          .equals(gameId)
          .filter((match) => match.scores !== undefined)
          .count()
          .then((count) => count > 0),
    },
    session: {
      get: () => db.session.get(CURRENT_SESSION_ID),
    },
  };
}

/**
 * Master data storage on IndexedDB (Architecture 7.3). A transaction spans persons, groups, custom
 * games, `meta`, the matches (only read, FA-SP-07) and, for the locks during a match, the
 * session; Dexie rolls it back completely if `work` throws.
 */
export function createDexieMasterDataStore(db: BoardBrainDb): MasterDataStore {
  const repos = repositories(db);
  return {
    transaction: (work) =>
      db.transaction('rw', [db.persons, db.groups, db.games, db.matches, db.meta, db.session], () =>
        work(repos),
      ),
  };
}
