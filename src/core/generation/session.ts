import type { GameId, GroupId, IsoTimestamp } from '@/core/model';
import type { SessionClock } from './clock';
import type { Generation } from './types';

/**
 * Id of the single stored session; there is at most one match in generation or running
 * (Specification 3.5, Architecture 7.3).
 */
export const CURRENT_SESSION_ID = 'current';

/**
 * Version of the stored form of a session. A session with a version the app does not know
 * leads to a message instead of a crash (Architecture 10.3). Version 2 (I2-D): the state of the
 * game module also holds what the flow shows, e.g. the starting resources turned over. Version 3
 * (I2-E): every step notes whether its animation has played (FA-AB-07). Version 4 (I3-A): the
 * running match has a timer (FA-AB-11). Version 5 (I3-B): the timer keeps every pause (ADR-031);
 * the database converts a session of version 4 when it opens.
 */
export const SESSION_SCHEMA_VERSION = 5;

/**
 * A match in generation or running (Architecture 10.2). The preparation is not stored
 * (Specification 3.5). `C` is the setup of the game: participants, options, colours of the
 * match.
 */
export type Session<C, S, G> = {
  readonly id: typeof CURRENT_SESSION_ID;
  readonly schemaVersion: number;
  readonly gameId: GameId;
  readonly groupId: GroupId;
  readonly setup: C;
  readonly generation: Generation<S, G>;
  /** When the generation was started. */
  readonly startedAt: IsoTimestamp;
  /**
   * Timer of the match (FA-AB-11); set when the generation is completed for the first time and
   * kept if a step is repeated afterwards.
   */
  readonly clock?: SessionClock;
};
