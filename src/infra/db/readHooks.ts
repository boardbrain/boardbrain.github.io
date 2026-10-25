import { useLiveQuery } from 'dexie-react-hooks';
import {
  sortByName,
  type CustomGame,
  type Group,
  type GroupId,
  type Person,
  type PersonId,
} from '@/core/model';
import type { BoardBrainDb } from './database';

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
