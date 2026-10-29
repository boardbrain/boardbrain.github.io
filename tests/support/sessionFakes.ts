import type { SessionRepositories, SessionStore, StoredSession } from '@/app/ports';
import { drawNextStep } from '@/core/generation';
import type { Group } from '@/core/model';
import { CATAN_GAME_ID, CATAN_GENERATION } from '@/games/catan';
import { aCatanSetup, runCatanGeneration } from './catanGeneration';
import { aGroup, TEST_NOW } from './masterDataFakes';
import { SeededRandomSource } from './seededRandomSource';

/**
 * Storage stand-in for tests of the session service (Architecture 14.1). A transaction works
 * on a copy and only takes it over if `work` completes, like a database transaction. Stored
 * sessions are deep copies, so a test notices if the service relies on objects it kept.
 */
export class InMemorySessionStore implements SessionStore {
  session: StoredSession | undefined = undefined;
  groups: readonly Group[];

  constructor(groups: readonly Group[] = []) {
    this.groups = groups;
  }

  async transaction<T>(work: (repositories: SessionRepositories) => Promise<T>): Promise<T> {
    let session = this.session;
    const groups = [...this.groups];
    const result = await work({
      session: {
        get: () => Promise.resolve(session === undefined ? undefined : structuredClone(session)),
        put: (stored) => {
          session = structuredClone(stored);
          return Promise.resolve();
        },
        delete: () => {
          session = undefined;
          return Promise.resolve();
        },
      },
      groups: { listAll: () => Promise.resolve([...groups]) },
    });
    this.session = session;
    return result;
  }
}

/**
 * Stored Catan session of `aGroup()`-like test persons in generation: four persons, seven
 * confirmed steps up to the first building and the revealed first road, hidden plan included.
 */
export function aStoredSession(fields: Partial<StoredSession> = {}): StoredSession {
  const setup = aCatanSetup(4, { startingResources: { count: 2, replacement: 'without' } });
  const confirmed = runCatanGeneration(setup, new SeededRandomSource(3), undefined, 7);
  const revealed = drawNextStep(CATAN_GENERATION, setup, confirmed, new SeededRandomSource(4));
  if (!revealed.ok) {
    throw new Error(revealed.error);
  }
  return {
    id: 'current',
    schemaVersion: 1,
    gameId: CATAN_GAME_ID,
    groupId: aGroup().id,
    setup,
    generation: revealed.value,
    startedAt: TEST_NOW,
    ...fields,
  };
}
