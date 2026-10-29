import type { Session } from '@/core/generation';
import type { CustomGame, Group, IsoTimestamp, Person } from '@/core/model';
import type { CatanGameState, CatanSetup, CatanStep } from '@/games/catan';

/**
 * Write and read access to persons inside a transaction (Architecture 7.3, 7.4).
 */
export type PersonRepository = {
  /** All persons, including archived ones. */
  listAll(): Promise<readonly Person[]>;
  /** Adds a new person and records the change of user data. */
  add(person: Person): Promise<void>;
  /** Replaces a stored person with the same id and records the change of user data. */
  update(person: Person): Promise<void>;
};

/**
 * Write and read access to custom games inside a transaction (Architecture 7.3, 7.4).
 */
export type CustomGameRepository = {
  /** All custom games, including archived ones. */
  listAll(): Promise<readonly CustomGame[]>;
  /** Adds a new custom game and records the change of user data. */
  add(game: CustomGame): Promise<void>;
  /** Replaces a stored custom game with the same id and records the change of user data. */
  update(game: CustomGame): Promise<void>;
};

/**
 * Write and read access to groups inside a transaction (Architecture 7.3, 7.4).
 */
export type GroupRepository = {
  /** All groups, including archived ones. */
  listAll(): Promise<readonly Group[]>;
  /** Adds a new group and records the change of user data. */
  add(group: Group): Promise<void>;
  /** Replaces a stored group with the same id and records the change of user data. */
  update(group: Group): Promise<void>;
};

/**
 * The stored match in generation or running (Architecture 10.2). In version 1 only Catan has a
 * generation; a further game adds its session type here.
 */
export type StoredSession = Session<CatanSetup, CatanStep, CatanGameState>;

/**
 * Read and write access to the single stored session (Architecture 7.3, 10.2). The session is
 * no user data in the sense of Architecture 7.4, so writing it records no change.
 */
export type SessionRepository = {
  /** The stored session, or `undefined` if no match is in generation or running. */
  get(): Promise<StoredSession | undefined>;
  /** Stores the session; replaces the one stored before. */
  put(session: StoredSession): Promise<void>;
  /** Removes the stored session, if there is one. */
  delete(): Promise<void>;
};

/**
 * Repositories available inside a session transaction.
 */
export type SessionRepositories = {
  readonly session: SessionRepository;
  /** Groups are only read: the group of a new match is checked (US-AB-01 AK-1). */
  readonly groups: Pick<GroupRepository, 'listAll'>;
};

/**
 * Storage of the running match. The session service sets the transaction boundary: a step is
 * stored completely before it is shown (ADR-014).
 */
export type SessionStore = {
  /**
   * Runs `work` in one read-write transaction. If `work` throws, the transaction is rolled
   * back and the error is passed on. Inside `work`, only the repositories may be awaited.
   */
  transaction<T>(work: (repositories: SessionRepositories) => Promise<T>): Promise<T>;
};

/**
 * Repositories available inside a master data transaction.
 */
export type MasterDataRepositories = {
  readonly persons: PersonRepository;
  readonly customGames: CustomGameRepository;
  readonly groups: GroupRepository;
  /** The session is only read, to check the locks during a match (FA-AB-09, Architecture 10.4). */
  readonly session: Pick<SessionRepository, 'get'>;
};

/**
 * Storage for persons, groups and custom games. The application service sets the transaction
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
