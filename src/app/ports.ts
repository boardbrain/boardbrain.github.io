import type { CustomGame, IsoTimestamp, Person } from '@/core/model';

/**
 * Write and read access to persons inside a transaction (Architecture 7.3, 7.4).
 */
export type PersonRepository = {
  /** All persons, including archived ones. */
  listAll(): Promise<readonly Person[]>;
  /** Adds a new person and records the change of user data. */
  add(person: Person): Promise<void>;
};

/**
 * Write and read access to custom games inside a transaction (Architecture 7.3, 7.4).
 */
export type CustomGameRepository = {
  /** All custom games, including archived ones. */
  listAll(): Promise<readonly CustomGame[]>;
  /** Adds a new custom game and records the change of user data. */
  add(game: CustomGame): Promise<void>;
};

/**
 * Repositories available inside a master data transaction.
 */
export type MasterDataRepositories = {
  readonly persons: PersonRepository;
  readonly customGames: CustomGameRepository;
};

/**
 * Storage for persons and custom games. The application service sets the transaction
 * boundary (Architecture 4.4): everything `work` does is written completely or not at all.
 */
export type MasterDataStore = {
  /**
   * Runs `work` in one read-write transaction. If `work` throws, the transaction is rolled
   * back and the error is passed on. Inside `work`, only the repositories may be awaited.
   */
  transaction<T>(work: (repositories: MasterDataRepositories) => Promise<T>): Promise<T>;
};

/**
 * Source of new identifiers: UUID version 4 from `crypto.randomUUID()` (NFA-DH-05, ADR-011).
 */
export type IdGenerator = {
  newId(): string;
};

/**
 * Current time as a UTC timestamp (Architecture 7.1).
 */
export type Clock = {
  now(): IsoTimestamp;
};
