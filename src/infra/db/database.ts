import { Dexie, type DexieOptions, type Table, type Transaction } from 'dexie';
import type { CustomGame, GameId, IsoTimestamp, Person, PersonId } from '@/core/model';

/**
 * State data in `meta` (Architecture 7.4). Further fields follow with their increments.
 */
export type MetaState = {
  /** Last change to persons, groups, games or matches (snapshot "daily"). */
  readonly lastUserDataChangeAt?: IsoTimestamp;
  /** First creation of data (export reminder without a previous full backup). */
  readonly firstDataAt?: IsoTimestamp;
};

/**
 * Entry of the `meta` store. Settings follow with their increment.
 */
export type MetaEntry = { readonly key: 'state'; readonly value: MetaState };

/**
 * One version of the database schema (Architecture 7.5). A schema change appends a new
 * version with only the changed stores and, if data must be converted, an `upgrade` function.
 * Existing versions are never changed, so every older database can be upgraded step by step.
 */
type SchemaVersion = {
  readonly version: number;
  readonly stores: Readonly<Record<string, string | null>>;
  readonly upgrade?: (transaction: Transaction) => Promise<void>;
};

/**
 * All schema versions in ascending order (Architecture 7.3). Version 1 already contains every
 * store of version 1 of the app, so later increments need no migration for their stores.
 */
export const SCHEMA_VERSIONS: readonly SchemaVersion[] = [
  {
    version: 1,
    stores: {
      persons: 'id, name',
      groups: 'id',
      games: 'id',
      matches: 'id, groupId, gameId, [groupId+date]',
      snapshots: 'id, createdAt, reason',
      session: 'id',
      meta: 'key',
    },
  },
];

/**
 * Name of the single IndexedDB database (ADR-007).
 */
export const DATABASE_NAME = 'boardbrain';

/**
 * The IndexedDB database of BoardBrain (Architecture 7.3, ADR-007). Only `infra/db` uses it;
 * writes go through the repositories. Tables of groups, matches, snapshots and the session
 * get their types with their increments.
 */
export class BoardBrainDb extends Dexie {
  readonly persons: Table<Person, PersonId>;
  readonly games: Table<CustomGame, GameId>;
  readonly meta: Table<MetaEntry, MetaEntry['key']>;

  /**
   * @param name Database name; tests use a separate name or factory per test.
   * @param options In tests a separate IndexedDB implementation (`fake-indexeddb`).
   */
  constructor(
    name: string = DATABASE_NAME,
    options: Pick<DexieOptions, 'indexedDB' | 'IDBKeyRange'> = {},
  ) {
    // Chromium browsers such as Brave report a transaction as complete only once it is
    // durably written (Architecture 7.3).
    super(name, { ...options, chromeTransactionDurability: 'strict' });
    for (const schema of SCHEMA_VERSIONS) {
      const version = this.version(schema.version).stores(schema.stores);
      if (schema.upgrade !== undefined) {
        version.upgrade(schema.upgrade);
      }
    }
    this.persons = this.table('persons');
    this.games = this.table('games');
    this.meta = this.table('meta');
  }
}
