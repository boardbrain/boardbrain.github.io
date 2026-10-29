import {
  confirmStep,
  CURRENT_SESSION_ID,
  drawNextStep,
  repeatStep,
  SESSION_SCHEMA_VERSION,
  startGeneration,
  type GenerationCompleteError,
  type NoStepRevealedError,
  type StepPendingError,
} from '@/core/generation';
import {
  areMatchColorsValid,
  matchColorsOf,
  type Group,
  type GroupId,
  type MatchColor,
  type MatchColors,
  type PersonId,
} from '@/core/model';
import type { RandomSource } from '@/core/random';
import { assert, err, ok, type Result } from '@/core/shared';
import {
  areCatanOptionsValid,
  canPlayCatan,
  CATAN_DEFAULT_OPTIONS,
  CATAN_GAME_ID,
  CATAN_GENERATION,
  CATAN_INITIAL_GAME_STATE,
  skipCatanPlacement,
  type CatanGeneration,
  type CatanOptions,
  type PlacementNotSkippableError,
} from '@/games/catan';
import type { Clock, SessionRepositories, SessionStore, StoredSession } from '@/app/ports';

/**
 * Error code when no match is in generation or running.
 */
export type NoSessionError = 'no-session';

/**
 * Error code when the stored session has a version this app does not know (Architecture
 * 10.3); the UI shows a message instead of crashing and offers to end the match.
 */
export type SessionUnsupportedError = 'session-unsupported';

/**
 * Error code when a new match is started while one is in generation or running
 * (Specification 3.5, US-AB-05 AK-2).
 */
export type SessionActiveError = 'session-active';

/**
 * Error code when the group cannot play Catan (US-AB-01 AK-1, Specification 3.4).
 */
export type GroupNotEligibleError = 'group-not-eligible';

/**
 * Why the stored session cannot be worked with.
 */
export type SessionAccessError = NoSessionError | SessionUnsupportedError;

/**
 * Default values of the preparation of a Catan match (US-AB-01, US-SP-04, US-PG-04). The
 * preparation itself is not stored (Specification 3.5).
 */
export type CatanPreparation = {
  readonly groupId: GroupId;
  /** All members take part, in the order of the group (US-AB-01 AK-2). */
  readonly participants: readonly PersonId[];
  readonly options: CatanOptions;
  /** Catan colours of the group, changeable for this match (US-PG-04). */
  readonly colors: readonly MatchColor[];
};

/**
 * Input for starting the generation ("Generierung starten", Specification 3.5).
 */
export type StartSessionInput = {
  readonly groupId: GroupId;
  readonly options: CatanOptions;
  /** One colour per member, in the order of the group (US-PG-04). */
  readonly colors: MatchColors;
};

/**
 * Preparing a match, starting the generation, drawing, confirming and repeating steps and
 * ending the match (Architecture 4.4, 10). Every step is drawn and stored before it is shown
 * (ADR-014); a restart therefore never draws a different result (US-AB-05).
 */
export type SessionService = {
  /**
   * The stored match in generation or running, or `null` (US-AB-05 AK-1). Its overview is
   * `catanSummary` (US-AB-04).
   */
  current(): Promise<Result<StoredSession | null, SessionUnsupportedError>>;
  /** Whether a match is in generation or running; the services check their locks with it (Architecture 10.4). */
  isSessionActive(): Promise<boolean>;
  /**
   * Default values for preparing a Catan match with this group (US-AB-01, US-SP-04, US-PG-04).
   * A group that does not exist throws.
   */
  prepare(groupId: GroupId): Promise<Result<CatanPreparation, GroupNotEligibleError>>;
  /**
   * Starts the generation without drawing a step yet (Specification 3.5). Rejected while
   * another match is in generation or running (US-AB-05 AK-2). Options and colours that do
   * not fit, or a group that does not exist, are programming errors and throw.
   */
  start(
    input: StartSessionInput,
  ): Promise<Result<StoredSession, SessionActiveError | GroupNotEligibleError>>;
  /**
   * Draws the next step and stores it as revealed before it is shown (ADR-014, Architecture
   * 10.1). Rejected while a step waits for confirmation (US-AB-02 AK-1).
   */
  drawNextStep(): Promise<
    Result<StoredSession, SessionAccessError | StepPendingError | GenerationCompleteError>
  >;
  /** Confirms the revealed step ("Weiter", US-AB-02 AK-1) and stores it at once. */
  confirmStep(): Promise<Result<StoredSession, SessionAccessError | NoStepRevealedError>>;
  /**
   * Repeats step `index` (US-AB-03): discards it and the steps that depend on it and stores the
   * step drawn again as revealed. The steps that are discarded are listed beforehand by
   * `stepsDiscardedBy` (AK-2). A step that does not exist throws.
   */
  repeatStep(index: number): Promise<Result<StoredSession, SessionAccessError | StepPendingError>>;
  /** Skips the placement at its beginning (US-PL-05). */
  skipPlacement(): Promise<Result<StoredSession, SessionAccessError | PlacementNotSkippableError>>;
  /**
   * Ends the match without a result: the generation is discarded and nothing is stored
   * (US-AB-06 AK-3, AK-4). Also possible for a session of unknown version.
   */
  endWithoutResult(): Promise<void>;
};

/**
 * Dependencies of the session service, composed in `src/main.tsx`.
 */
export type SessionServiceDependencies = {
  readonly store: SessionStore;
  readonly clock: Clock;
  /** The single source of randomness (NFA-ZF-03). */
  readonly rng: RandomSource;
};

// Architecture 10.3: a session of unknown version leads to a message instead of a crash.
async function readSession(
  repositories: SessionRepositories,
): Promise<Result<StoredSession, SessionAccessError>> {
  const session = await repositories.session.get();
  if (session === undefined) {
    return err('no-session');
  }
  if (session.schemaVersion !== SESSION_SCHEMA_VERSION) {
    return err('session-unsupported');
  }
  return ok(session);
}

async function findGroup(repositories: SessionRepositories, groupId: GroupId): Promise<Group> {
  const group = (await repositories.groups.listAll()).find((candidate) => candidate.id === groupId);
  assert(group !== undefined, `group ${groupId} exists`);
  return group;
}

/**
 * Creates the session service. Reading, changing and storing a session happen in one
 * transaction, so two quick taps cannot both draw a step.
 */
export function createSessionService(deps: SessionServiceDependencies): SessionService {
  const { store, clock, rng } = deps;

  // Reads the session, changes its generation and stores it before returning it (ADR-014).
  function change<E extends string>(
    work: (session: StoredSession) => Result<CatanGeneration, E>,
  ): Promise<Result<StoredSession, SessionAccessError | E>> {
    return store.transaction(async (repositories) => {
      const read = await readSession(repositories);
      if (!read.ok) {
        return read;
      }
      const changed = work(read.value);
      if (!changed.ok) {
        return changed;
      }
      const session: StoredSession = { ...read.value, generation: changed.value };
      await repositories.session.put(session);
      return ok(session);
    });
  }

  return {
    current() {
      return store.transaction(async (repositories) => {
        const read = await readSession(repositories);
        if (read.ok) {
          return read;
        }
        return read.error === 'no-session' ? ok(null) : err(read.error);
      });
    },

    isSessionActive() {
      // A session of unknown version is still a running match and keeps the locks.
      return store.transaction(async ({ session }) => (await session.get()) !== undefined);
    },

    prepare(groupId) {
      return store.transaction(async (repositories) => {
        const group = await findGroup(repositories, groupId);
        if (!canPlayCatan(group)) {
          return err('group-not-eligible');
        }
        return ok({
          groupId,
          participants: group.members.map((member) => member.personId),
          options: CATAN_DEFAULT_OPTIONS,
          colors: matchColorsOf(group),
        });
      });
    },

    start({ groupId, options, colors }) {
      return store.transaction(async (repositories) => {
        // Specification 3.5: at most one match in generation or running.
        if ((await repositories.session.get()) !== undefined) {
          return err('session-active');
        }
        const group = await findGroup(repositories, groupId);
        if (!canPlayCatan(group)) {
          return err('group-not-eligible');
        }
        const participants = group.members.map((member) => member.personId);
        assert(areCatanOptionsValid(options), 'the options of the match are valid');
        assert(
          areMatchColorsValid(colors, participants),
          'the colours of the match belong to the members',
        );
        const session: StoredSession = {
          id: CURRENT_SESSION_ID,
          schemaVersion: SESSION_SCHEMA_VERSION,
          gameId: CATAN_GAME_ID,
          groupId,
          setup: { participants, options, colors },
          generation: startGeneration(CATAN_INITIAL_GAME_STATE),
          startedAt: clock.now(),
        };
        await repositories.session.put(session);
        return ok(session);
      });
    },

    drawNextStep() {
      return change((session) =>
        drawNextStep(CATAN_GENERATION, session.setup, session.generation, rng),
      );
    },

    confirmStep() {
      return change((session) => confirmStep(CATAN_GENERATION, session.setup, session.generation));
    },

    repeatStep(index) {
      return change((session) =>
        repeatStep(CATAN_GENERATION, session.setup, session.generation, index, rng),
      );
    },

    skipPlacement() {
      return change((session) => skipCatanPlacement(session.setup, session.generation));
    },

    endWithoutResult() {
      return store.transaction(({ session }) => session.delete());
    },
  };
}
