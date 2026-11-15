import type { ResultRepositories, ResultStore } from '@/app/ports';
import { CURRENT_SESSION_ID } from '@/core/generation';
import { assert } from '@/core/shared';
import type { BoardBrainDb } from './database';
import { recordUserDataChange } from './userDataChange';

// The writes chain Dexie's own promises instead of native async functions: awaiting a native
// promise that itself awaited Dexie lets the transaction commit early, so ending the session after
// storing the result would fail (PrematureCommitError). A result is the first case with more work
// after a write in the same transaction.
function repositories(db: BoardBrainDb): ResultRepositories {
  return {
    matches: {
      get: (id) => db.matches.get(id),
      add: (match) => db.matches.add(match).then(() => recordUserDataChange(db, match.updatedAt)),
      update: (match) =>
        db.matches
          .get(match.id)
          .then((stored) => {
            assert(stored !== undefined, `the match ${match.id} exists`);
            return db.matches.put(match);
          })
          .then(() => recordUserDataChange(db, match.updatedAt)),
      delete: (id, at) =>
        db.matches
          .get(id)
          .then((stored) => {
            assert(stored !== undefined, `the match ${id} exists`);
            return db.matches.delete(id);
          })
          .then(() => recordUserDataChange(db, at)),
    },
    groups: {
      listAll: () => db.groups.toArray(),
    },
    customGames: {
      listAll: () => db.games.toArray(),
    },
    session: {
      get: () => db.session.get(CURRENT_SESSION_ID),
      delete: () => db.session.delete(CURRENT_SESSION_ID),
    },
  };
}

/**
 * Result storage on IndexedDB (Architecture 7.3). A transaction spans matches, `meta`, the
 * groups and custom games it reads and the session, so storing the result of a running match
 * and ending it are written together or not at all (FA-AB-08, Architecture 10.3).
 */
export function createDexieResultStore(db: BoardBrainDb): ResultStore {
  const repos = repositories(db);
  return {
    transaction: (work) =>
      db.transaction('rw', [db.matches, db.meta, db.groups, db.games, db.session], () =>
        work(repos),
      ),
  };
}
