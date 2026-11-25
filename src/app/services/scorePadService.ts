import type { GameId, GroupId, PersonId } from '@/core/model';
import {
  addRound,
  changeEntry,
  createScorePad,
  deleteRound,
  isValidTarget,
  SCORE_PAD_SCHEMA_VERSION,
  withChanges,
  type EntryInvalidError,
  type ScorePad,
  type ScorePadSettings,
  type ScoreRound,
} from '@/core/scorepad';
import { assert, err, ok, type Result } from '@/core/shared';
import { canGroupPlay, findSupportedGame } from '@/games/registry';
import type { Clock, ScorePadRepositories, ScorePadStore } from '@/app/ports';
import type { GroupNotEligibleError, SessionActiveError } from './sessionService';

/**
 * Error code when the game of a new score pad is no active custom game with points (FA-NB-01);
 * the same code as for a result of a game that is not active.
 */
export type PadGameNotEligibleError = 'game-not-eligible';

/**
 * Error code when no score pad runs.
 */
export type NoScorePadError = 'no-score-pad';

/**
 * Error code when the stored score pad has a version this app does not know (Architecture 10.5);
 * the UI offers to end it.
 */
export type ScorePadUnsupportedError = 'score-pad-unsupported';

/**
 * Error code when the rounds changed since the person saw them, e.g. after a second quick tap on
 * "Weiter": the round is not stored twice.
 */
export type RoundChangedError = 'round-changed';

/**
 * Why the stored score pad cannot be worked with.
 */
export type ScorePadAccessError = NoScorePadError | ScorePadUnsupportedError;

/**
 * A stored change and whether it reached the target for the first time, so "Ziel erreicht" is
 * shown once (US-NB-03 AK-4).
 */
export type ScorePadChange = {
  readonly pad: ScorePad;
  readonly isTargetReachedNow: boolean;
};

/**
 * Input for starting a score pad with "Starten" (US-NB-01 AK-3).
 */
export type StartScorePadInput = {
  readonly gameId: GameId;
  readonly groupId: GroupId;
  readonly settings: ScorePadSettings;
};

/**
 * Starting, writing in and ending the score pad (FA-NB-*, Architecture 10.5). Every change is read,
 * made and stored in one transaction before the UI shows it. The result is stored by the result
 * service, which ends the score pad in the same transaction (FA-NB-07).
 */
export type ScorePadService = {
  /**
   * Starts a score pad of an active custom game with points at a table that can play it
   * (US-NB-01, FA-NB-01). Rejected while a match or a score pad runs (E-51).
   */
  start(
    input: StartScorePadInput,
  ): Promise<
    Result<ScorePad, SessionActiveError | GroupNotEligibleError | PadGameNotEligibleError>
  >;
  /**
   * Stores a complete round from the typed numbers (US-NB-02 AK-3, FA-NB-05): points of the round
   * or, when calculating oneself, the new standings. `seenRounds` is the number of rounds the
   * person saw; if it changed meanwhile, nothing is stored (`round-changed`).
   */
  addRound(
    seenRounds: number,
    entries: ScoreRound,
  ): Promise<Result<ScorePadChange, ScorePadAccessError | RoundChangedError | EntryInvalidError>>;
  /**
   * Changes one number of a stored round (US-NB-02 AK-4, FA-NB-05). A round that does not exist
   * throws.
   */
  changeEntry(
    index: number,
    personId: PersonId,
    value: number,
  ): Promise<Result<ScorePadChange, ScorePadAccessError | EntryInvalidError>>;
  /** Deletes a round (US-NB-02 AK-4). A round that does not exist throws. */
  deleteRound(index: number): Promise<Result<ScorePadChange, ScorePadAccessError>>;
  /** Changes target and calculation of this score pad (US-NB-03). */
  changeSettings(settings: ScorePadSettings): Promise<Result<ScorePadChange, ScorePadAccessError>>;
  /**
   * Ends the score pad without a result (US-NB-04 AK-3); also one of unknown version.
   */
  endWithoutResult(): Promise<void>;
};

/**
 * Dependencies of the score pad service, composed in `src/main.tsx`.
 */
export type ScorePadServiceDependencies = {
  readonly store: ScorePadStore;
  readonly clock: Clock;
};

// Architecture 10.5: a score pad of unknown version leads to a message, not a crash.
async function readPad(
  repositories: ScorePadRepositories,
): Promise<Result<ScorePad, ScorePadAccessError>> {
  const pad = await repositories.scorePad.get();
  if (pad === undefined) {
    return err('no-score-pad');
  }
  return pad.schemaVersion === SCORE_PAD_SCHEMA_VERSION ? ok(pad) : err('score-pad-unsupported');
}

/**
 * Creates the score pad service.
 */
export function createScorePadService(deps: ScorePadServiceDependencies): ScorePadService {
  const { store, clock } = deps;

  // Reads the score pad, changes it and stores it before returning it.
  function change<E extends string>(
    work: (pad: ScorePad) => Result<ScorePadChange, E>,
  ): Promise<Result<ScorePadChange, ScorePadAccessError | E>> {
    return store.transaction(async (repositories) => {
      const read = await readPad(repositories);
      if (!read.ok) {
        return read;
      }
      const changed = work(read.value);
      if (changed.ok) {
        await repositories.scorePad.put(changed.value.pad);
      }
      return changed;
    });
  }

  return {
    start({ gameId, groupId, settings }) {
      return store.transaction(async (repositories) => {
        // FA-AB-07, E-51: at most one running match, a score pad included.
        if (
          (await repositories.session.get()) !== undefined ||
          (await repositories.scorePad.get()) !== undefined
        ) {
          return err('session-active');
        }
        const game = (await repositories.customGames.listAll()).find(
          (candidate) => candidate.id === gameId,
        );
        // FA-NB-01: only active custom games with points.
        if (
          findSupportedGame(gameId) !== undefined ||
          game === undefined ||
          game.archived ||
          game.scoring === undefined
        ) {
          return err('game-not-eligible');
        }
        const group = (await repositories.groups.listAll()).find(
          (candidate) => candidate.id === groupId,
        );
        if (group === undefined || !canGroupPlay(group, gameId)) {
          return err('group-not-eligible');
        }
        assert(settings.target === null || isValidTarget(settings.target), 'the target is valid');
        const pad = createScorePad({
          gameId,
          groupId,
          participants: group.members.map((member) => member.personId),
          startedAt: clock.now(),
          settings,
        });
        await repositories.scorePad.put(pad);
        return ok(pad);
      });
    },

    addRound(seenRounds, entries) {
      return change<RoundChangedError | EntryInvalidError>((pad) => {
        if (pad.rounds.length !== seenRounds) {
          return err('round-changed');
        }
        const rounds = addRound(pad.rounds, entries, pad.participants, pad.settings.calculation);
        return rounds.ok ? ok(withChanges(pad, { rounds: rounds.value })) : rounds;
      });
    },

    changeEntry(index, personId, value) {
      return change<EntryInvalidError>((pad) => {
        const rounds = changeEntry(
          pad.rounds,
          index,
          personId,
          value,
          pad.participants,
          pad.settings.calculation,
        );
        return rounds.ok ? ok(withChanges(pad, { rounds: rounds.value })) : rounds;
      });
    },

    deleteRound(index) {
      return change((pad) => ok(withChanges(pad, { rounds: deleteRound(pad.rounds, index) })));
    },

    changeSettings(settings) {
      return change((pad) => ok(withChanges(pad, { settings })));
    },

    endWithoutResult() {
      return store.transaction(({ scorePad }) => scorePad.delete());
    },
  };
}
