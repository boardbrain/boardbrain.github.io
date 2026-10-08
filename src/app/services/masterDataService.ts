import {
  containsName,
  createCustomGame,
  createGroup,
  createPerson,
  GROUP_SIZE,
  toGameId,
  toGroupId,
  toPersonId,
  type BoundGame,
  type CustomGame,
  type GameId,
  type Group,
  type GroupBinding,
  type GroupError,
  type MemberColors,
  type NameEmptyError,
  type Person,
  type PersonId,
} from '@/core/model';
import { assert, err, type Result } from '@/core/shared';
import type { Clock, IdGenerator, MasterDataStore } from '@/app/ports';
import { findSupportedGame, gameCapabilities } from '@/games/registry';

/**
 * Error code when a record with the same name already exists (US-PG-01 AK-3, US-SP-02 AK-2).
 */
export type NameDuplicateError = 'name-duplicate';

/**
 * Input for creating a person.
 */
export type CreatePersonInput = {
  readonly name: string;
  /** The user has confirmed the hint about an existing person with the same name. */
  readonly isDuplicateConfirmed: boolean;
};

/**
 * Input for creating a group. `colors` has one entry per person, in the same order.
 */
export type CreateGroupInput = {
  readonly name: string;
  readonly binding: GroupBinding;
  readonly personIds: readonly PersonId[];
  readonly colors: readonly MemberColors[];
};

/**
 * Creating, editing, archiving and deleting persons, groups and custom games
 * (Architecture 4.4). This increment contains creating persons, groups and custom games.
 */
export type MasterDataService = {
  /**
   * Creates a person (US-PG-01). A same-named person is only a hint: without confirmation
   * the result is `name-duplicate`, with confirmation the person is saved.
   */
  createPerson(
    input: CreatePersonInput,
  ): Promise<Result<Person, NameEmptyError | NameDuplicateError>>;
  /**
   * Creates a group (US-PG-02, US-PG-03). The members are checked against the stored persons,
   * and the binding against the games; a person or game that does not exist is a programming
   * error and throws.
   */
  createGroup(input: CreateGroupInput): Promise<Result<Group, GroupError>>;
  /**
   * Creates a custom game (US-SP-02). Same-named games, including supported ones such as
   * Catan, are rejected with `name-duplicate`.
   */
  createCustomGame(name: string): Promise<Result<CustomGame, NameEmptyError | NameDuplicateError>>;
};

/**
 * Dependencies of the master data service, composed in `src/main.tsx`.
 */
export type MasterDataServiceDependencies = {
  readonly store: MasterDataStore;
  readonly ids: IdGenerator;
  readonly clock: Clock;
  /** Names of the supported games in the UI language, e.g. "Catan" (US-SP-02 AK-2). */
  readonly supportedGameNames: readonly string[];
};

/**
 * Creates the master data service. The duplicate check and the write run in the same
 * transaction, so two quick saves cannot both pass the check.
 */
export function createMasterDataService(deps: MasterDataServiceDependencies): MasterDataService {
  const { store, ids, clock, supportedGameNames } = deps;

  return {
    async createPerson({ name, isDuplicateConfirmed }) {
      const created = createPerson({ id: toPersonId(ids.newId()), name, now: clock.now() });
      if (!created.ok) {
        return created;
      }
      return store.transaction(async ({ persons }) => {
        const existing = await persons.listAll();
        // US-PG-01 AK-3: archived persons still exist and therefore count as well.
        const names = existing.map((person) => person.name);
        if (!isDuplicateConfirmed && containsName(names, created.value.name)) {
          return err('name-duplicate');
        }
        await persons.add(created.value);
        return created;
      });
    },

    async createGroup({ name, binding, personIds, colors }) {
      return store.transaction(async ({ persons, customGames, groups }) => {
        const allPersons = await persons.listAll();
        const members = personIds.map((id) => {
          const person = allPersons.find((candidate) => candidate.id === id);
          assert(person !== undefined, `person ${id} exists`);
          return person;
        });
        const boundGame =
          binding.kind === 'global'
            ? null
            : boundGameOf(binding.gameId, await customGames.listAll());
        const created = createGroup({
          id: toGroupId(ids.newId()),
          name,
          binding,
          boundGame,
          persons: members,
          colors,
          now: clock.now(),
        });
        if (!created.ok) {
          return created;
        }
        await groups.add(created.value);
        return created;
      });
    },

    async createCustomGame(name) {
      const created = createCustomGame({ id: toGameId(ids.newId()), name, now: clock.now() });
      if (!created.ok) {
        return created;
      }
      return store.transaction(async ({ customGames }) => {
        const existing = await customGames.listAll();
        // US-SP-02 AK-2: compared with all custom games and the supported games such as Catan.
        const names = [...supportedGameNames, ...existing.map((game) => game.name)];
        if (containsName(names, created.value.name)) {
          return err('name-duplicate');
        }
        await customGames.add(created.value);
        return created;
      });
    },
  };
}

// FA-SP-05, FA-PG-10: a supported game dictates its player count and colours; a custom game
// has no colours and can be played by any group.
function boundGameOf(gameId: GameId, customGames: readonly CustomGame[]): BoundGame {
  const supported = findSupportedGame(gameId);
  if (supported !== undefined) {
    return {
      maxPlayers: supported.playerCount.max,
      hasPlayerColors: gameCapabilities(gameId).playerColors !== null,
    };
  }
  assert(
    customGames.some((game) => game.id === gameId),
    'the bound game exists',
  );
  return { maxPlayers: GROUP_SIZE.max, hasPlayerColors: false };
}
