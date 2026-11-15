import type { CatanColorKey } from './colors';
import type { IsoTimestamp } from './entities';
import type { GameId, GroupId, MatchId, PersonId } from './ids';
import type { LocalDate, LocalTime } from './localDateTime';

/**
 * A match with its result (FA-ER-02, Specification 3.6, Architecture 7.1). All members of the
 * group took part (E-41), so the match keeps no list of participants. Places are not stored but
 * calculated from the victory points (FA-ER-11, `core/results`). Which of the optional fields a
 * game has is decided by the game (FA-SP-05); in version 1 only Catan has them.
 */
export type Match = {
  readonly id: MatchId;
  readonly groupId: GroupId;
  readonly gameId: GameId;
  /** Calendar day at the place of recording. */
  readonly date: LocalDate;
  readonly time?: LocalTime;
  /** When the result was recorded; orders matches without a time (Specification 3.7). */
  readonly recordedAt: IsoTimestamp;
  /** Key of an edition of the game, e.g. `'base'` for Catan (FA-ER-03). */
  readonly edition?: string;
  /** Key of a mode of the game, e.g. `'standard'` for Catan (FA-ER-03). */
  readonly mode?: string;
  /** At least one person; several mean a draw between them (FA-ER-07). */
  readonly winnerIds: readonly PersonId[];
  /** For every participant or missing (FA-ER-06). */
  readonly victoryPoints?: Readonly<Record<PersonId, number>>;
  /** Catan colours used in the match (FA-ER-09). */
  readonly catanColors?: Readonly<Record<PersonId, CatanColorKey>>;
  /** Whole minutes from 1 (FA-ER-10). */
  readonly durationMinutes?: number;
  readonly notes?: string;
  readonly updatedAt: IsoTimestamp;
};
