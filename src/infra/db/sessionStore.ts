import type { SessionRepositories, SessionStore } from '@/app/ports';
import { CURRENT_SESSION_ID } from '@/core/generation';
import type { BoardBrainDb } from './database';

function repositories(db: BoardBrainDb): SessionRepositories {
  return {
    session: {
      get: () => db.session.get(CURRENT_SESSION_ID),
      put: async (session) => {
        await db.session.put(session);
      },
      delete: () => db.session.delete(CURRENT_SESSION_ID),
    },
    groups: {
      listAll: () => db.groups.toArray(),
    },
  };
}

/**
 * Storage of the running match on IndexedDB (Architecture 7.3, 10.2). A transaction spans the
 * session and the groups; with strict durability a step is written durably before the
 * transaction completes, so it can be shown afterwards (ADR-014).
 */
export function createDexieSessionStore(db: BoardBrainDb): SessionStore {
  const repos = repositories(db);
  return {
    transaction: (work) => db.transaction('rw', [db.session, db.groups], () => work(repos)),
  };
}
