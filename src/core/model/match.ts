import type { CatanColorKey } from './colors';
import type { IsoTimestamp } from './entities';
import type { GameId, GroupId, MatchId, PersonId } from './ids';
import type { LocalDate, LocalTime } from './localDateTime';

/**
 * Target of a score pad (FA-NB-06): a number of points one person reaches or a number of rounds,
 * whole numbers from 1. The app only reminds of it and never ends on its own (E-52).
 */
export type ScoreTarget = {
  readonly kind: 'points' | 'rounds';
  readonly value: number;
};

/**
 * A match with its result (FA-ER-02, Specification 3.6, Architecture 7.1). All members of the
 * group took part (E-41), so the match keeps no list of participants. Places from points are not
 * stored but calculated (FA-ER-11, `core/results`); only a ranking entered by hand is stored
 * (FA-ER-12). Which of the optional fields a game has is decided by the game (FA-SP-05,
 * FA-SP-07).
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
  /**
   * Points of every participant or missing (FA-ER-06): the victory points of Catan or the points
   * of a custom game that counts them (FA-SP-07). Never together with `places`.
   */
  readonly scores?: Readonly<Record<PersonId, number>>;
  /**
   * Places entered by hand in a custom game, for every participant or missing (FA-ER-12);
   * the winners are those on place 1. Never together with `scores`.
   */
  readonly places?: Readonly<Record<PersonId, number>>;
  /**
   * Points of every participant in every round of a score pad, oldest round first (FA-NB-07,
   * E-53); `scores` are then their sums. Missing for a result without a score pad.
   */
  readonly rounds?: readonly Readonly<Record<PersonId, number>>[];
  /** Target of the score pad, only together with `rounds` (FA-NB-06). */
  readonly target?: ScoreTarget;
  /** Catan colours used in the match (FA-ER-09). */
  readonly catanColors?: Readonly<Record<PersonId, CatanColorKey>>;
  /** Whole minutes from 1 (FA-ER-10). */
  readonly durationMinutes?: number;
  readonly notes?: string;
  readonly updatedAt: IsoTimestamp;
};
