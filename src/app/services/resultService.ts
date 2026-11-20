import { elapsedMilliseconds, SESSION_SCHEMA_VERSION } from '@/core/generation';
import {
  matchColorsOf,
  toMatchId,
  type CatanColorKey,
  type CustomGame,
  type GameId,
  type Group,
  type GroupId,
  type LocalDate,
  type Match,
  type MatchColors,
  type MatchId,
  type PersonId,
} from '@/core/model';
import {
  checkResult,
  durationMinutesOf,
  type ResultError,
  type ResultInput,
  type ResultRules,
} from '@/core/results';
import { assert, err, ok, type Result } from '@/core/shared';
import { canGroupPlay, findSupportedGame, gameCapabilities } from '@/games/registry';
import type {
  Clock,
  IdGenerator,
  ResultRepositories,
  ResultStore,
  StoredSession,
} from '@/app/ports';
import type { GroupNotEligibleError, SessionAccessError } from './sessionService';

/**
 * Error code when a custom game is archived or no longer exists (Specification 3.6: only
 * active games).
 */
export type GameNotEligibleError = 'game-not-eligible';

/**
 * Error code when the result of a match in generation is to be entered; only a running match
 * offers "Ergebnis eintragen" (US-AB-06 AK-1, Specification 3.5).
 */
export type SessionNotRunningError = 'session-not-running';

/**
 * Error code when a match to change or delete no longer exists, e.g. after a mistyped address.
 */
export type MatchNotFoundError = 'match-not-found';

/**
 * What the result form starts with (US-ER-01, US-AB-06 AK-2): group and game, which are fixed,
 * their participants (E-41), what the game allows, and the values filled in beforehand.
 */
export type ResultDraft = {
  readonly groupId: GroupId;
  readonly gameId: GameId;
  /** All members of the group, in the order of the group (E-41). */
  readonly participants: readonly PersonId[];
  readonly rules: ResultRules;
  readonly values: ResultInput;
};

/**
 * Input for recording a result without a running match (US-ER-01).
 */
export type RecordResultInput = ResultInput & {
  readonly groupId: GroupId;
  readonly gameId: GameId;
};

/**
 * Recording, changing and deleting results (Architecture 4.4); storing the result of a running
 * match ends it in the same transaction (FA-AB-08). The service rejects what is invalid
 * (Specification 3.6); plausibility warnings are asked by the form before storing, with
 * `plausibilityWarnings` from `core/results` (US-ER-01 AK-8), and so is the warning before a
 * change (US-ER-05 AK-1).
 */
export type ResultService = {
  /**
   * Starting values of a new result of this group in this game (US-ER-01): today's date, the
   * default mode, the Catan colours of the group (US-ER-03 AK-1). Rejected for a group or game
   * that is not active or a group that cannot play the game (AK-5), also for a group that no
   * longer exists: its id may come from an old address.
   */
  draft(groupId: GroupId, gameId: GameId): Promise<Result<ResultDraft, ResultTargetError>>;
  /**
   * Starting values from the running match (US-AB-06 AK-2): game, group, edition, mode, the
   * Catan colours of the match, date and time of its beginning and the measured duration in
   * whole minutes, at least 1 (US-AB-07 AK-4).
   */
  draftFromSession(): Promise<Result<ResultDraft, SessionAccessError | SessionNotRunningError>>;
  /** Records a result (US-ER-01, FA-ER-01), also without a generation. */
  record(input: RecordResultInput): Promise<Result<Match, ResultError | ResultTargetError>>;
  /**
   * Records the result of the running match and ends it in the same transaction (US-AB-06
   * AK-2, FA-AB-08): afterwards no match is running. If storing fails, the match keeps running.
   */
  recordFromSession(
    input: ResultInput,
  ): Promise<Result<Match, SessionAccessError | SessionNotRunningError | ResultError>>;
  /**
   * Changes a result (US-ER-05, FA-ER-04). Group and game stay fixed (AK-4), also for a group
   * archived since; the time of recording is kept.
   */
  edit(
    matchId: MatchId,
    input: ResultInput,
  ): Promise<Result<Match, MatchNotFoundError | ResultError>>;
  /**
   * Deletes a result (US-ER-05). The snapshot "Vor Löschen" (AK-2) follows with I4; until then a
   * deleted result is gone (decision of the Product Owner, 15.11.2026, variant A).
   */
  delete(matchId: MatchId): Promise<Result<void, MatchNotFoundError>>;
};

/**
 * Why a result cannot be recorded for this group and game (Specification 3.4, 3.6).
 */
export type ResultTargetError = GroupNotEligibleError | GameNotEligibleError;

/**
 * Dependencies of the result service, composed in `src/main.tsx`.
 */
export type ResultServiceDependencies = {
  readonly store: ResultStore;
  readonly ids: IdGenerator;
  readonly clock: Clock;
};

// C-T-1: Dexie keeps its transaction through one level of native async function, not through
// helpers that call further async helpers; a write after them would run outside the transaction
// and end it early (PrematureCommitError). So every transaction first reads what it needs
// directly and then decides with the plain functions below.

type Stored = { readonly groups: readonly Group[]; readonly customGames: readonly CustomGame[] };

function findGroup(stored: Stored, groupId: GroupId): Group {
  const group = stored.groups.find((candidate) => candidate.id === groupId);
  assert(group !== undefined, `group ${groupId} exists`);
  return group;
}

function participantsOf(group: Group): PersonId[] {
  return group.members.map((member) => member.personId);
}

function colorRecord(colors: MatchColors): Record<PersonId, CatanColorKey> {
  const record: Record<PersonId, CatanColorKey> = {};
  for (const { personId, catanColor } of colors) {
    record[personId] = catanColor;
  }
  return record;
}

function findCustomGame(stored: Stored, gameId: GameId): CustomGame | undefined {
  return stored.customGames.find((candidate) => candidate.id === gameId);
}

// FA-SP-07: a custom game brings its own setting for points, so its record is read.
function rulesOf(stored: Stored, gameId: GameId): ResultRules {
  return findSupportedGame(gameId) === undefined
    ? gameCapabilities(gameId, findCustomGame(stored, gameId))
    : gameCapabilities(gameId);
}

// Specification 3.6: only active groups and games, and they must fit together (3.4).
function checkTarget(
  stored: Stored,
  group: Group,
  gameId: GameId,
): Result<ResultRules, ResultTargetError> {
  let rules = gameCapabilities(gameId);
  if (!rules.isSupported) {
    const game = findCustomGame(stored, gameId);
    if (game === undefined || game.archived) {
      return err('game-not-eligible');
    }
    rules = gameCapabilities(gameId, game);
  }
  return canGroupPlay(group, gameId) ? ok(rules) : err('group-not-eligible');
}

type RunningSession = { readonly session: StoredSession; readonly group: Group };

// Architecture 10.3: a session of unknown version leads to a message, not a crash.
function checkRunning(
  session: StoredSession | undefined,
  stored: Stored,
): Result<RunningSession, SessionAccessError | SessionNotRunningError> {
  if (session === undefined) {
    return err('no-session');
  }
  if (session.schemaVersion !== SESSION_SCHEMA_VERSION) {
    return err('session-unsupported');
  }
  if (session.generation.state !== 'running') {
    return err('session-not-running');
  }
  return ok({ session, group: findGroup(stored, session.groupId) });
}

/**
 * Creates the result service.
 */
export function createResultService(deps: ResultServiceDependencies): ResultService {
  const { store, ids, clock } = deps;

  // C-T-1: read directly in the transaction, see above.
  async function readStored(repositories: ResultRepositories): Promise<Stored> {
    const groups = await repositories.groups.listAll();
    const customGames = await repositories.customGames.listAll();
    return { groups, customGames };
  }

  // US-ER-01 AK-8: no result in the future of the device's local day.
  function today(): LocalDate {
    return clock.localDateTime(clock.now()).date;
  }

  function newMatch(
    groupId: GroupId,
    gameId: GameId,
    input: ResultInput,
    participants: readonly PersonId[],
    rules: ResultRules,
  ): Result<Match, ResultError> {
    const checked = checkResult(input, participants, rules, today());
    if (!checked.ok) {
      return checked;
    }
    const now = clock.now();
    return ok({
      id: toMatchId(ids.newId()),
      groupId,
      gameId,
      ...checked.value,
      recordedAt: now,
      updatedAt: now,
    });
  }

  return {
    draft(groupId, gameId) {
      return store.transaction(async (repositories) => {
        const stored = await readStored(repositories);
        const group = stored.groups.find((candidate) => candidate.id === groupId);
        if (group === undefined) {
          return err('group-not-eligible');
        }
        const target = checkTarget(stored, group, gameId);
        if (!target.ok) {
          return target;
        }
        const rules = target.value;
        const [defaultMode] = rules.modes;
        return ok({
          groupId,
          gameId,
          participants: participantsOf(group),
          rules,
          values: {
            date: clock.localDateTime(clock.now()).date,
            ...(defaultMode === undefined ? {} : { mode: defaultMode }),
            winnerIds: [],
            // US-ER-03 AK-1: the Catan colours of the group; a group that can play Catan has them.
            ...(rules.playerColors === null
              ? {}
              : { catanColors: colorRecord(matchColorsOf(group)) }),
          },
        });
      });
    },

    draftFromSession() {
      return store.transaction(async (repositories) => {
        const current = await repositories.session.get();
        const stored = await readStored(repositories);
        const running = checkRunning(current, stored);
        if (!running.ok) {
          return running;
        }
        const { session, group } = running.value;
        const timer = session.clock;
        assert(timer !== undefined, 'a running match has its timer (FA-AB-11)');
        const now = clock.now();
        const begin = clock.localDateTime(timer.startedAt);
        const { edition, mode } = session.setup.options;
        return ok({
          groupId: session.groupId,
          gameId: session.gameId,
          participants: participantsOf(group),
          rules: rulesOf(stored, session.gameId),
          values: {
            date: begin.date,
            time: begin.time,
            edition,
            mode,
            winnerIds: [],
            catanColors: colorRecord(session.setup.colors),
            durationMinutes: durationMinutesOf(elapsedMilliseconds(timer, now)),
          },
        });
      });
    },

    record(input) {
      return store.transaction(async (repositories) => {
        const { groupId, gameId, ...values } = input;
        const stored = await readStored(repositories);
        const group = stored.groups.find((candidate) => candidate.id === groupId);
        if (group === undefined) {
          return err('group-not-eligible');
        }
        const target = checkTarget(stored, group, gameId);
        if (!target.ok) {
          return target;
        }
        const match = newMatch(groupId, gameId, values, participantsOf(group), target.value);
        if (match.ok) {
          await repositories.matches.add(match.value);
        }
        return match;
      });
    },

    recordFromSession(input) {
      return store.transaction(async (repositories) => {
        const current = await repositories.session.get();
        const stored = await readStored(repositories);
        const running = checkRunning(current, stored);
        if (!running.ok) {
          return running;
        }
        // The group cannot be archived or rebound while its match runs (FA-AB-09).
        const { session, group } = running.value;
        const rules = rulesOf(stored, session.gameId);
        const match = newMatch(
          session.groupId,
          session.gameId,
          input,
          participantsOf(group),
          rules,
        );
        if (!match.ok) {
          return match;
        }
        // FA-AB-08: one transaction stores the result and ends the match (Architecture 10.3).
        await repositories.matches.add(match.value);
        await repositories.session.delete();
        return match;
      });
    },

    edit(matchId, input) {
      return store.transaction(async (repositories) => {
        const previous = await repositories.matches.get(matchId);
        if (previous === undefined) {
          return err('match-not-found');
        }
        const stored = await readStored(repositories);
        const group = findGroup(stored, previous.groupId);
        const rules = rulesOf(stored, previous.gameId);
        const checked = checkResult(input, participantsOf(group), rules, today());
        if (!checked.ok) {
          return checked;
        }
        const match: Match = {
          id: previous.id,
          groupId: previous.groupId,
          gameId: previous.gameId,
          ...checked.value,
          recordedAt: previous.recordedAt,
          updatedAt: clock.now(),
        };
        await repositories.matches.update(match);
        return ok(match);
      });
    },

    delete(matchId) {
      return store.transaction(async (repositories) => {
        if ((await repositories.matches.get(matchId)) === undefined) {
          return err('match-not-found');
        }
        await repositories.matches.delete(matchId, clock.now());
        return ok(undefined);
      });
    },
  };
}
