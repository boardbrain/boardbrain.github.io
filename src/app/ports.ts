import type { Session } from '@/core/generation';
import type {
  CustomGame,
  GameId,
  Group,
  IsoTimestamp,
  LocalDateTime,
  Match,
  MatchId,
  Person,
} from '@/core/model';
import type { ScorePad } from '@/core/scorepad';
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
 * Read and write access to the single running score pad (Architecture 7.3, 10.5). Like the
 * session it is no user data in the sense of Architecture 7.4.
 */
export type ScorePadRepository = {
  /** The running score pad, or `undefined` if none runs. */
  get(): Promise<ScorePad | undefined>;
  /** Stores the score pad; replaces the one stored before. */
  put(pad: ScorePad): Promise<void>;
  /** Removes the running score pad, if there is one. */
  delete(): Promise<void>;
};

/**
 * Repositories available inside a score pad transaction.
 */
export type ScorePadRepositories = {
  readonly scorePad: ScorePadRepository;
  /** The match is only read: at most one running match (FA-AB-07, E-51). */
  readonly session: Pick<SessionRepository, 'get'>;
  /** Groups are only read: the participants of the table (E-41). */
  readonly groups: Pick<GroupRepository, 'listAll'>;
  /** Custom games are only read: only an active game with points (FA-NB-01). */
  readonly customGames: Pick<CustomGameRepository, 'listAll'>;
};

/**
 * Storage of the running score pad. The score pad service sets the transaction boundary: every
 * round is stored completely before it is shown (Architecture 10.5).
 */
export type ScorePadStore = {
  /**
   * Runs `work` in one read-write transaction. If `work` throws, the transaction is rolled
   * back and the error is passed on. Inside `work`, only the repositories may be awaited.
   */
  transaction<T>(work: (repositories: ScorePadRepositories) => Promise<T>): Promise<T>;
};

/**
 * Repositories available inside a session transaction.
 */
export type SessionRepositories = {
  readonly session: SessionRepository;
  /** The score pad is only read: at most one running match (FA-AB-07, E-51). */
  readonly scorePad: Pick<ScorePadRepository, 'get'>;
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
 * What the master data need to know about matches, read inside their transaction.
 */
export type MatchFacts = {
  /** Whether a match of this game has points (US-VW-07 AK-4, FA-SP-07). */
  hasScores(gameId: GameId): Promise<boolean>;
};

/**
 * Repositories available inside a master data transaction.
 */
export type MasterDataRepositories = {
  readonly persons: PersonRepository;
  readonly customGames: CustomGameRepository;
  readonly groups: GroupRepository;
  /** Matches are only read: whether points of a game may be switched off (FA-SP-07). */
  readonly matches: MatchFacts;
  /** The session is only read, to check the locks during a match (FA-AB-09, Architecture 10.4). */
  readonly session: Pick<SessionRepository, 'get'>;
  /** The score pad is only read: it locks like a match (FA-NB-02, Architecture 10.4). */
  readonly scorePad: Pick<ScorePadRepository, 'get'>;
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
 * Write and read access to matches with their result inside a transaction (Architecture 7.3,
 * 7.4).
 */
export type MatchRepository = {
  /** The match with this id, or `undefined`. */
  get(id: MatchId): Promise<Match | undefined>;
  /** Adds a new match and records the change of user data. */
  add(match: Match): Promise<void>;
  /** Replaces a stored match with the same id and records the change of user data. */
  update(match: Match): Promise<void>;
  /** Removes a stored match and records the change of user data at `at`. */
  delete(id: MatchId, at: IsoTimestamp): Promise<void>;
};

/**
 * Repositories available inside a result transaction.
 */
export type ResultRepositories = {
  readonly matches: MatchRepository;
  /** Groups are only read: the participants and whether the group is active (Specification 3.6). */
  readonly groups: Pick<GroupRepository, 'listAll'>;
  /** Custom games are only read: whether the game is active (Specification 3.6). */
  readonly customGames: Pick<CustomGameRepository, 'listAll'>;
  /** The running match: its result ends it in the same transaction (FA-AB-08, US-AB-06 AK-2). */
  readonly session: Pick<SessionRepository, 'get' | 'delete'>;
  /** The running score pad: its result ends it in the same transaction (FA-NB-07). */
  readonly scorePad: Pick<ScorePadRepository, 'get' | 'delete'>;
};

/**
 * Storage of results. The result service sets the transaction boundary (Architecture 4.4):
 * storing the result of a running match and ending it happen completely or not at all.
 */
export type ResultStore = {
  /**
   * Runs `work` in one read-write transaction. If `work` throws, the transaction is rolled
   * back and the error is passed on. Inside `work`, only the repositories may be awaited.
   */
  transaction<T>(work: (repositories: ResultRepositories) => Promise<T>): Promise<T>;
};

/**
 * Source of new identifiers: UUID version 4 from `crypto.randomUUID()` (NFA-DH-05, ADR-011).
 */
export type IdGenerator = {
  newId(): string;
};

/**
 * Current time as a UTC timestamp (Architecture 7.1) and the conversion of a moment into the
 * date and time of day at the place of the device, as they are meant at the table.
 */
export type Clock = {
  now(): IsoTimestamp;
  /** Date and time of day of `at` in the time zone of the device, to the minute. */
  localDateTime(at: IsoTimestamp): LocalDateTime;
};

/**
 * An unexpected error as the diagnostics list it (K-9). Stays on the device (NFA-DH-01) and
 * holds no user data: only the error text, where it happened and the app version.
 */
export type ErrorLogEntry = {
  readonly at: IsoTimestamp;
  /** Address of the view, e.g. `#/partie`. */
  readonly address: string;
  /** Name and message of the error, e.g. `TypeError: x is undefined`. */
  readonly message: string;
  /** First line of the stack below the message, if there is one. */
  readonly origin?: string;
  readonly version: string;
};

/**
 * Storage of the recent unexpected errors (K-9). It is no user data in the sense of
 * Architecture 7.4, so writing it records no change.
 */
export type ErrorLogStore = {
  /**
   * Replaces the stored entries with the result of `change` in one read-write transaction.
   * The entries are ordered newest first.
   */
  update(change: (entries: readonly ErrorLogEntry[]) => readonly ErrorLogEntry[]): Promise<void>;
};
