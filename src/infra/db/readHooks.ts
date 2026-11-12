import { useLiveQuery } from 'dexie-react-hooks';
import type { ErrorLogEntry, StoredSession } from '@/app/ports';
import {
  CURRENT_SESSION_ID,
  SESSION_SCHEMA_VERSION,
  type GenerationState,
} from '@/core/generation';
import {
  sortByName,
  type CustomGame,
  type GameId,
  type IsoTimestamp,
  type Group,
  type GroupId,
  type Person,
  type PersonId,
} from '@/core/model';
import type { BoardBrainDb } from './database';
import { readErrorLog } from './errorLogStore';

/**
 * All persons sorted by name; `undefined` while loading. The view updates itself on every
 * change (Architecture 13.2).
 */
export function usePersons(db: BoardBrainDb): readonly Person[] | undefined {
  return useLiveQuery(async () => sortByName(await db.persons.toArray()), [db]);
}

/**
 * All custom games sorted by name; `undefined` while loading (Architecture 13.2).
 */
export function useCustomGames(db: BoardBrainDb): readonly CustomGame[] | undefined {
  return useLiveQuery(async () => sortByName(await db.games.toArray()), [db]);
}

/**
 * All groups sorted by name; `undefined` while loading (Architecture 13.2).
 */
export function useGroups(db: BoardBrainDb): readonly Group[] | undefined {
  return useLiveQuery(async () => sortByName(await db.groups.toArray()), [db]);
}

/**
 * One person (US-VW-05 AK-2); `undefined` while loading, `null` if there is no such person or
 * no valid id.
 */
export function usePerson(db: BoardBrainDb, id: PersonId | null): Person | null | undefined {
  return useLiveQuery(
    async () => (id === null ? null : ((await db.persons.get(id)) ?? null)),
    [db, id],
  );
}

/**
 * One group (US-VW-05 AK-3); `undefined` while loading, `null` if there is no such group or
 * no valid id.
 */
export function useGroup(db: BoardBrainDb, id: GroupId | null): Group | null | undefined {
  return useLiveQuery(
    async () => (id === null ? null : ((await db.groups.get(id)) ?? null)),
    [db, id],
  );
}

/**
 * One custom game (US-VW-07); `undefined` while loading, `null` if there is no such custom game
 * or no valid id. Supported games such as Catan are not custom games and give `null`.
 */
export function useCustomGame(db: BoardBrainDb, id: GameId | null): CustomGame | null | undefined {
  return useLiveQuery(
    async () => (id === null ? null : ((await db.games.get(id)) ?? null)),
    [db, id],
  );
}

/**
 * The stored match as the views read it (Architecture 13.2): none, of a version this app does
 * not know (Architecture 10.3), or in generation or running.
 */
export type CurrentSession =
  | { readonly status: 'none' }
  | { readonly status: 'unsupported' }
  | { readonly status: 'active'; readonly session: StoredSession };

/**
 * The match in generation or running (US-AB-05 AK-1); `undefined` while loading. The views
 * update themselves on every stored step; they change the match only through the session
 * service (ADR-029).
 */
export function useCurrentSession(db: BoardBrainDb): CurrentSession | undefined {
  return useLiveQuery(async (): Promise<CurrentSession> => {
    const session = await db.session.get(CURRENT_SESSION_ID);
    if (session === undefined) {
      return { status: 'none' };
    }
    return session.schemaVersion === SESSION_SCHEMA_VERSION
      ? { status: 'active', session }
      : { status: 'unsupported' };
  }, [db]);
}

/**
 * How many records of one kind are stored, archived ones included.
 */
export type RecordCount = { readonly total: number; readonly archived: number };

/**
 * What the diagnostics tell about the stored data (K-9): versions, counts and the state of a
 * match, but no names, so the report can be shared without second thoughts (NFA-DH-02).
 */
export type DataSummary = {
  /** Version of the database schema (Architecture 7.5). */
  readonly schemaVersion: number;
  readonly persons: RecordCount;
  readonly groups: RecordCount;
  readonly customGames: RecordCount;
  readonly session:
    | { readonly status: 'none' | 'unsupported' }
    | {
        readonly status: 'active';
        readonly state: GenerationState;
        readonly steps: number;
        readonly startedAt: IsoTimestamp;
      };
  /** Last change of user data (Architecture 7.4); missing as long as nothing was stored. */
  readonly lastUserDataChangeAt?: IsoTimestamp;
};

function countOf(records: readonly { readonly archived: boolean }[]): RecordCount {
  return {
    total: records.length,
    archived: records.filter((record) => record.archived).length,
  };
}

/**
 * Summary of the stored data for the diagnostics (K-9); `undefined` while loading.
 */
export function useDataSummary(db: BoardBrainDb): DataSummary | undefined {
  return useLiveQuery(async (): Promise<DataSummary> => {
    const [persons, groups, customGames, session, meta] = await Promise.all([
      db.persons.toArray(),
      db.groups.toArray(),
      db.games.toArray(),
      db.session.get(CURRENT_SESSION_ID),
      db.meta.get('state'),
    ]);
    const lastChange = meta?.key === 'state' ? meta.value.lastUserDataChangeAt : undefined;
    let sessionSummary: DataSummary['session'] = { status: 'none' };
    if (session !== undefined) {
      sessionSummary =
        session.schemaVersion === SESSION_SCHEMA_VERSION
          ? {
              status: 'active',
              state: session.generation.state,
              steps: session.generation.steps.length,
              startedAt: session.startedAt,
            }
          : { status: 'unsupported' };
    }
    return {
      schemaVersion: db.verno,
      persons: countOf(persons),
      groups: countOf(groups),
      customGames: countOf(customGames),
      session: sessionSummary,
      ...(lastChange === undefined ? {} : { lastUserDataChangeAt: lastChange }),
    };
  }, [db]);
}

/**
 * The recent unexpected errors, newest first (K-9); `undefined` while loading.
 */
export function useErrorLog(db: BoardBrainDb): readonly ErrorLogEntry[] | undefined {
  return useLiveQuery(() => readErrorLog(db), [db]);
}
