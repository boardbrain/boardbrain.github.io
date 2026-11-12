import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { BoardBrainDb } from '@/infra/db/database';

/**
 * Separate IndexedDB in memory for one test (Architecture 14.1, `fake-indexeddb`).
 */
export function createTestIndexedDb(): IDBFactory {
  return new IDBFactory();
}

/**
 * Database of BoardBrain on the given in-memory IndexedDB; every test starts empty
 * (Development Guidelines 8.3).
 */
export function createTestDb(indexedDB: IDBFactory = createTestIndexedDb()): BoardBrainDb {
  return new BoardBrainDb('boardbrain', { indexedDB, IDBKeyRange });
}
