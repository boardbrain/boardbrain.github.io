import {
  confirmStep,
  CURRENT_SESSION_ID,
  drawNextStep,
  repeatStep,
  revealedStepIndex,
  SESSION_SCHEMA_VERSION,
  startGeneration,
  withGameState,
  type GenerationCompleteError,
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
  openCatanResources,
  skipCatanPlacement,
  type CatanGameState,
  type CatanGeneration,
  type CatanOptions,
  type CatanSetup,
  type CatanStep,
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
 * Error code when the step shown is no longer the one waiting for confirmation, e.g. after a
 * second quick tap on "Losen"; nothing is changed.
 */
export type StepChangedError = 'step-changed';

/**
 * Error code when "Weiter" is tapped but no step waits for confirmation.
 */
export type NothingToConfirmError = 'nothing-to-confirm';

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
 * (ADR-014); a restart therefore never draws a different result (US-AB-05). Whether a step is
 * shown without a result is not stored: it is the next missing step while none waits for
 * confirmation (US-AB-02 AK-3, E-35).
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
   * Starts the generation ("Generierung starten", Specification 3.5). Nothing is drawn yet: the
   * first step is shown without a result (US-AB-02 AK-3). A match without any step is running at
   * once. Rejected while another match is in generation or running (US-AB-05 AK-2). Options and
   * colours that do not fit, or a group that does not exist, are programming errors and throw.
   */
  start(
    input: StartSessionInput,
  ): Promise<Result<StoredSession, SessionActiveError | GroupNotEligibleError>>;
  /**
   * "Losen" (US-AB-02 AK-1): confirms the revealed step, if there is one, and draws the next
   * one in one transaction, stored as revealed before it is shown (ADR-014, Architecture 10.1).
   * `shownStep` is the index of the step the person saw, `null` on a step without a result; if
   * it is no longer the step waiting, nothing happens, so two quick taps draw only once.
   * Rejected once no step is missing.
   */
  draw(
    shownStep: number | null,
  ): Promise<
    Result<StoredSession, SessionAccessError | StepChangedError | GenerationCompleteError>
  >;
  /**
   * "Weiter" and "Zur Übersicht" (US-AB-02 AK-1): confirms the revealed step without drawing;
   * the next view shows its step without a result (AK-3). After the last step the match is
   * running. `shownStep` as for `draw`.
   */
  confirm(
    shownStep: number,
  ): Promise<Result<StoredSession, SessionAccessError | StepChangedError | NothingToConfirmError>>;
  /**
   * Repeats step `index` (US-AB-03): confirms another step waiting for confirmation, then
   * discards step `index` and the steps that depend on it. The step is then shown without a
   * result, and `draw` draws it again (AK-1, E-35). The steps that are discarded are listed
   * beforehand by `stepsDiscardedBy` (AK-2). A step that does not exist throws.
   */
  repeatStep(index: number): Promise<Result<StoredSession, SessionAccessError>>;
  /**
   * Skips the placement at its beginning (US-PL-05): confirms a revealed last spin and skips
   * the placement in one transaction; the starting resources then start without a result.
   */
  skipPlacement(): Promise<Result<StoredSession, SessionAccessError | PlacementNotSkippableError>>;
  /**
   * Turns over cards of the starting resources of a person (FA-SR-05, US-SR-01 AK-6), indices
   * into the result; they stay turned over, also after a restart. Nothing is drawn. A person
   * without starting resources drawn, or a card that does not exist, throws.
   */
  openResources(
    personId: PersonId,
    cards: readonly number[],
  ): Promise<Result<StoredSession, SessionAccessError>>;
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

// Confirms the revealed step, if there is one (US-AB-02 AK-1).
function confirmRevealed(setup: CatanSetup, generation: CatanGeneration): CatanGeneration {
  const confirmed = confirmStep(CATAN_GENERATION, setup, generation);
  return confirmed.ok ? confirmed.value : generation;
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
        assert(areCatanOptionsValid(options, participants), 'the options of the match are valid');
        assert(
          areMatchColorsValid(colors, participants),
          'the colours of the match belong to the members',
        );
        const setup: CatanSetup = { participants, options, colors };
        const started = startGeneration<CatanStep, CatanGameState>(CATAN_INITIAL_GAME_STATE);
        const session: StoredSession = {
          id: CURRENT_SESSION_ID,
          schemaVersion: SESSION_SCHEMA_VERSION,
          gameId: CATAN_GAME_ID,
          groupId,
          setup,
          // E-35: nothing is drawn yet; without any step the match is running at once.
          generation: withGameState(CATAN_GENERATION, setup, started, started.gameState),
          startedAt: clock.now(),
        };
        await repositories.session.put(session);
        return ok(session);
      });
    },

    draw(shownStep) {
      return change(
        (session): Result<CatanGeneration, StepChangedError | GenerationCompleteError> => {
          if ((revealedStepIndex(session.generation) ?? null) !== shownStep) {
            return err('step-changed');
          }
          const confirmed = confirmRevealed(session.setup, session.generation);
          const drawn = drawNextStep(CATAN_GENERATION, session.setup, confirmed, rng);
          // After confirming nothing is revealed, so the only reason is that no step is missing.
          return drawn.ok ? drawn : err('generation-complete');
        },
      );
    },

    confirm(shownStep) {
      return change(
        (session): Result<CatanGeneration, StepChangedError | NothingToConfirmError> => {
          const revealed = revealedStepIndex(session.generation);
          if (revealed === undefined) {
            return err('nothing-to-confirm');
          }
          if (revealed !== shownStep) {
            return err('step-changed');
          }
          return ok(confirmRevealed(session.setup, session.generation));
        },
      );
    },

    repeatStep(index) {
      return change((session) => {
        // A step waiting elsewhere was seen already, e.g. when repeating from the look back.
        const revealed = revealedStepIndex(session.generation);
        const generation =
          revealed === undefined || revealed === index
            ? session.generation
            : confirmRevealed(session.setup, session.generation);
        const repeated = repeatStep(CATAN_GENERATION, session.setup, generation, index);
        assert(repeated.ok, 'no other step waits for confirmation');
        return repeated;
      });
    },

    skipPlacement() {
      return change((session) =>
        skipCatanPlacement(session.setup, confirmRevealed(session.setup, session.generation)),
      );
    },

    openResources(personId, cards) {
      return change((session) => ok(openCatanResources(session.generation, personId, cards)));
    },

    endWithoutResult() {
      return store.transaction(({ session }) => session.delete());
    },
  };
}
