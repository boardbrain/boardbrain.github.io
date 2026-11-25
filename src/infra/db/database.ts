import { Dexie, type DexieOptions, type Table, type Transaction } from 'dexie';
import type { ErrorLogEntry, StoredSession } from '@/app/ports';
import { clockFromVersion4, type ClockVersion4 } from '@/core/generation';
import type { ScorePad } from '@/core/scorepad';
import type {
  CustomGame,
  GameId,
  Group,
  GroupId,
  IsoTimestamp,
  Match,
  MatchId,
  Person,
  PersonId,
} from '@/core/model';

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
 * Entry of the `meta` store: the state data and, since K-9, the recent unexpected errors for
 * the diagnostics. Settings follow with their increment.
 */
export type MetaEntry =
  | { readonly key: 'state'; readonly value: MetaState }
  | { readonly key: 'errors'; readonly value: readonly ErrorLogEntry[] };

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

// The timer as session version 4 stored it, or `undefined` if the value is something else.
function clockOfVersion4(value: unknown): ClockVersion4 | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  if (!('startedAt' in value) || !('pausedMs' in value)) {
    return undefined;
  }
  const { startedAt, pausedMs } = value;
  const pausedAt = 'pausedAt' in value ? value.pausedAt : undefined;
  if (
    typeof startedAt !== 'string' ||
    typeof pausedMs !== 'number' ||
    (pausedAt !== undefined && typeof pausedAt !== 'string')
  ) {
    return undefined;
  }
  return pausedAt === undefined ? { startedAt, pausedMs } : { startedAt, pausedAt, pausedMs };
}

// I3-B (ADR-031): a running match of session version 4 becomes version 5, its timer keeps every
// pause; the sum of its pauses becomes one pause after the beginning. A session that does not
// look like version 4 stays as it is and is reported as unknown (Architecture 10.3).
async function upgradeSessionToVersion5(transaction: Transaction): Promise<void> {
  await transaction
    .table('session')
    .toCollection()
    .modify((row: Record<string, unknown>) => {
      if (row.schemaVersion !== 4) {
        return;
      }
      if (row.clock !== undefined) {
        const clock = clockOfVersion4(row.clock);
        if (clock === undefined) {
          return;
        }
        row.clock = clockFromVersion4(clock);
      }
      row.schemaVersion = 5;
    });
}

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
  {
    // I3-B: no new store; converts the session of a running match (ADR-031).
    version: 2,
    stores: {},
    upgrade: upgradeSessionToVersion5,
  },
  {
    // I3-C2: the running score pad in a store of its own, nothing to convert (Architecture 10.5).
    version: 3,
    stores: { scorePad: 'id' },
  },
];

/**
 * Name of the single IndexedDB database (ADR-007).
 */
export const DATABASE_NAME = 'boardbrain';

/**
 * The IndexedDB database of BoardBrain (Architecture 7.3, ADR-007). Only `infra/db` uses it;
 * writes go through the repositories. The table of snapshots gets its type with its increment.
 */
export class BoardBrainDb extends Dexie {
  readonly persons: Table<Person, PersonId>;
  readonly groups: Table<Group, GroupId>;
  readonly games: Table<CustomGame, GameId>;
  readonly matches: Table<Match, MatchId>;
  readonly meta: Table<MetaEntry, MetaEntry['key']>;
  readonly session: Table<StoredSession, StoredSession['id']>;
  readonly scorePad: Table<ScorePad, ScorePad['id']>;

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
    this.groups = this.table('groups');
    this.games = this.table('games');
    this.matches = this.table('matches');
    this.meta = this.table('meta');
    this.session = this.table('session');
    this.scorePad = this.table('scorePad');
  }
}
