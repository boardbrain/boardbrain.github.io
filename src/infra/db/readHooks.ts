import { useLiveQuery } from 'dexie-react-hooks';
import { sortByName, type CustomGame, type Person } from '@/core/model';
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
