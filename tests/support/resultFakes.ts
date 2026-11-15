import type { ResultRepositories, ResultStore, StoredSession } from '@/app/ports';
import {
  parseLocalDate,
  toGameId,
  toMatchId,
  type CustomGame,
  type Group,
  type Match,
} from '@/core/model';
import { assert } from '@/core/shared';
import { aGroup, TEST_NOW } from './masterDataFakes';

/**
 * Id of the custom game of `aCustomGame()`.
 */
export const TEST_CUSTOM_GAME_ID = toGameId('00000000-0000-4000-8000-0000000000b1');

/**
 * Test match of `aGroup()` in a custom game with sensible defaults: Anna wins on 7 October 2026.
 */
export function aMatch(fields: Partial<Match> = {}): Match {
  const group = aGroup();
  const date = parseLocalDate('2026-10-07');
  assert(date.ok, 'a calendar day');
  const [winner] = group.members;
  assert(winner !== undefined, 'the group has members');
  return {
    id: toMatchId('00000000-0000-4000-8000-0000000000d1'),
    groupId: group.id,
    gameId: TEST_CUSTOM_GAME_ID,
    date: date.value,
    recordedAt: TEST_NOW,
    winnerIds: [winner.personId],
    updatedAt: TEST_NOW,
    ...fields,
  };
}

/**
 * Storage stand-in for tests of the result service (Architecture 14.1). A transaction works on
 * copies and only takes them over if `work` completes, like a database transaction; stored
 * records are deep copies, so a test notices if the service relies on objects it kept.
 */
export class InMemoryResultStore implements ResultStore {
  matches: readonly Match[] = [];
  groups: readonly Group[];
  customGames: readonly CustomGame[];
  session: StoredSession | undefined = undefined;
  /** Moments of the recorded changes of user data (Architecture 7.4). */
  changes: readonly string[] = [];

  constructor(groups: readonly Group[] = [], customGames: readonly CustomGame[] = []) {
    this.groups = groups;
    this.customGames = customGames;
  }

  async transaction<T>(work: (repositories: ResultRepositories) => Promise<T>): Promise<T> {
    const matches = new Map(this.matches.map((match) => [match.id, structuredClone(match)]));
    let session = this.session;
    const changes = [...this.changes];
    const result = await work({
      matches: {
        get: (id) => Promise.resolve(structuredClone(matches.get(id))),
        add: (match) => {
          assert(!matches.has(match.id), `no match ${match.id} yet`);
          matches.set(match.id, structuredClone(match));
          changes.push(match.updatedAt);
          return Promise.resolve();
        },
        update: (match) => {
          assert(matches.has(match.id), `the match ${match.id} exists`);
          matches.set(match.id, structuredClone(match));
          changes.push(match.updatedAt);
          return Promise.resolve();
        },
        delete: (id, at) => {
          assert(matches.delete(id), `the match ${id} exists`);
          changes.push(at);
          return Promise.resolve();
        },
      },
      groups: { listAll: () => Promise.resolve([...this.groups]) },
      customGames: { listAll: () => Promise.resolve([...this.customGames]) },
      session: {
        get: () => Promise.resolve(session === undefined ? undefined : structuredClone(session)),
        delete: () => {
          session = undefined;
          return Promise.resolve();
        },
      },
    });
    this.matches = [...matches.values()];
    this.session = session;
    this.changes = changes;
    return result;
  }
}
