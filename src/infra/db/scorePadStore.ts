import type { ScorePadRepositories, ScorePadStore } from '@/app/ports';
import { CURRENT_SESSION_ID } from '@/core/generation';
import { SCORE_PAD_ID } from '@/core/scorepad';
import type { BoardBrainDb } from './database';

function repositories(db: BoardBrainDb): ScorePadRepositories {
  return {
    scorePad: {
      get: () => db.scorePad.get(SCORE_PAD_ID),
      put: async (pad) => {
        await db.scorePad.put(pad);
      },
      delete: () => db.scorePad.delete(SCORE_PAD_ID),
    },
    session: {
      get: () => db.session.get(CURRENT_SESSION_ID),
    },
    groups: {
      listAll: () => db.groups.toArray(),
    },
    customGames: {
      listAll: () => db.games.toArray(),
    },
  };
}

/**
 * Storage of the running score pad on IndexedDB (Architecture 7.3, 10.5). A transaction spans the
 * score pad, the session (at most one running match) and the groups and games it reads; with
 * strict durability a round is written durably before it is shown.
 */
export function createDexieScorePadStore(db: BoardBrainDb): ScorePadStore {
  const repos = repositories(db);
  return {
    transaction: (work) =>
      db.transaction('rw', [db.scorePad, db.session, db.groups, db.games], () => work(repos)),
  };
}
