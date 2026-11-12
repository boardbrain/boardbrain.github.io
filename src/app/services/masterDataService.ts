import {
  containsName,
  createCustomGame,
  createGroup,
  createPerson,
  editGroup,
  GROUP_SIZE,
  renameCustomGame,
  renamePerson,
  toGameId,
  toGroupId,
  toPersonId,
  type BoundGame,
  type CustomGame,
  type GameId,
  type Group,
  type GroupBinding,
  type GroupEditError,
  type GroupError,
  type GroupId,
  type MemberColors,
  type NameEmptyError,
  type Person,
  type PersonId,
} from '@/core/model';
import { assert, err, type Result } from '@/core/shared';
import type { Clock, IdGenerator, MasterDataStore } from '@/app/ports';
import { findSupportedGame, gameCapabilities } from '@/games/registry';

/**
 * Error code when a record with the same name already exists: persons, groups and games have
 * names that are unique in the whole app (FA-PG-09, E-31, US-PG-01 AK-3, US-PG-02 AK-8,
 * US-SP-02 AK-2).
 */
export type NameDuplicateError = 'name-duplicate';

/**
 * Error code when the binding of a group is changed while the group takes part in a match in
 * generation or running (US-VW-02 AK-5, Specification 3.5, FA-AB-09).
 */
export type GroupInSessionError = 'group-in-session';

/**
 * Input for creating a person.
 */
export type CreatePersonInput = {
  readonly name: string;
};

/**
 * Input for renaming a person.
 */
export type RenamePersonInput = {
  readonly personId: PersonId;
  readonly name: string;
};

/**
 * Input for changing a group. `colors` has one entry per member, in the order of the members.
 */
export type EditGroupInput = {
  readonly groupId: GroupId;
  readonly name: string;
  readonly binding: GroupBinding;
  readonly colors: readonly MemberColors[];
};

/**
 * Input for renaming a custom game.
 */
export type RenameCustomGameInput = {
  readonly gameId: GameId;
  readonly name: string;
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
 * (Architecture 4.4). This increment contains creating and editing persons, groups and custom
 * games.
 */
export type MasterDataService = {
  /**
   * Creates a person (US-PG-01). A name that another person has, archived ones included, is
   * rejected with `name-duplicate` (AK-3).
   */
  createPerson(
    input: CreatePersonInput,
  ): Promise<Result<Person, NameEmptyError | NameDuplicateError>>;
  /**
   * Creates a group (US-PG-02, US-PG-03). The members are checked against the stored persons,
   * and the binding against the games; a person or game that does not exist is a programming
   * error and throws. A name that another group has is rejected with `name-duplicate` (AK-8).
   */
  createGroup(input: CreateGroupInput): Promise<Result<Group, GroupError | NameDuplicateError>>;
  /**
   * Creates a custom game (US-SP-02). Same-named games, including supported ones such as
   * Catan, are rejected with `name-duplicate`.
   */
  createCustomGame(name: string): Promise<Result<CustomGame, NameEmptyError | NameDuplicateError>>;
  /**
   * Renames a person (US-VW-06). A name that another person has, archived ones included, is
   * rejected with `name-duplicate` (AK-2). A person that does not exist throws.
   */
  renamePerson(
    input: RenamePersonInput,
  ): Promise<Result<Person, NameEmptyError | NameDuplicateError>>;
  /**
   * Changes name, colours and binding of a group; the members stay the same (US-VW-02). A name
   * that another group has is rejected with `name-duplicate` (AK-1). While the group takes part
   * in a match in generation or running, a changed binding is rejected with `group-in-session`
   * (AK-5). A group or game that does not exist throws.
   */
  editGroup(
    input: EditGroupInput,
  ): Promise<Result<Group, GroupEditError | NameDuplicateError | GroupInSessionError>>;
  /**
   * Renames a custom game (US-VW-07). Names of other games, including supported ones such as
   * Catan, are rejected with `name-duplicate`. Supported games are not custom games and cannot
   * be renamed (AK-2): their id throws like an unknown one.
   */
  renameCustomGame(
    input: RenameCustomGameInput,
  ): Promise<Result<CustomGame, NameEmptyError | NameDuplicateError>>;
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
    async createPerson({ name }) {
      const created = createPerson({ id: toPersonId(ids.newId()), name, now: clock.now() });
      if (!created.ok) {
        return created;
      }
      return store.transaction(async ({ persons }) => {
        const existing = await persons.listAll();
        // US-PG-01 AK-3, E-31: archived persons still exist and therefore count as well.
        const names = existing.map((person) => person.name);
        if (containsName(names, created.value.name)) {
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
        // US-PG-02 AK-8, E-31: unique among all groups, archived ones included.
        const names = (await groups.listAll()).map((group) => group.name);
        if (containsName(names, created.value.name)) {
          return err('name-duplicate');
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

    async renamePerson({ personId, name }) {
      return store.transaction(async ({ persons }) => {
        const allPersons = await persons.listAll();
        const person = allPersons.find((candidate) => candidate.id === personId);
        assert(person !== undefined, `person ${personId} exists`);
        const renamed = renamePerson(person, name, clock.now());
        if (!renamed.ok) {
          return renamed;
        }
        // US-VW-06 AK-2, FA-VW-01: unique among all other persons; her own name does not count,
        // so only changing the case is allowed.
        const otherNames = allPersons
          .filter((candidate) => candidate.id !== personId)
          .map((candidate) => candidate.name);
        if (containsName(otherNames, renamed.value.name)) {
          return err('name-duplicate');
        }
        await persons.update(renamed.value);
        return renamed;
      });
    },

    async editGroup({ groupId, name, binding, colors }) {
      return store.transaction(async ({ customGames, groups, session }) => {
        const allGroups = await groups.listAll();
        const group = allGroups.find((candidate) => candidate.id === groupId);
        assert(group !== undefined, `group ${groupId} exists`);
        // US-VW-02 AK-5, Architecture 10.4: the service checks the lock itself, not only the UI.
        // Name and colours stay changeable; the match keeps the colours it started with.
        if (!isSameBinding(group.binding, binding) && (await session.get())?.groupId === groupId) {
          return err('group-in-session');
        }
        const boundGame =
          binding.kind === 'global'
            ? null
            : boundGameOf(binding.gameId, await customGames.listAll());
        const edited = editGroup(group, { name, binding, boundGame, colors, now: clock.now() });
        if (!edited.ok) {
          return edited;
        }
        // US-VW-02 AK-1, E-31: unique among all other groups.
        const otherNames = allGroups
          .filter((candidate) => candidate.id !== groupId)
          .map((candidate) => candidate.name);
        if (containsName(otherNames, edited.value.name)) {
          return err('name-duplicate');
        }
        await groups.update(edited.value);
        return edited;
      });
    },

    async renameCustomGame({ gameId, name }) {
      return store.transaction(async ({ customGames }) => {
        const all = await customGames.listAll();
        const game = all.find((candidate) => candidate.id === gameId);
        assert(game !== undefined, `custom game ${gameId} exists`);
        const renamed = renameCustomGame(game, name, clock.now());
        if (!renamed.ok) {
          return renamed;
        }
        // US-VW-07 AK-1: unique as in US-SP-02 AK-2; the game's own name does not count, so
        // only changing the case is allowed.
        const names = [
          ...supportedGameNames,
          ...all.filter((candidate) => candidate.id !== gameId).map((candidate) => candidate.name),
        ];
        if (containsName(names, renamed.value.name)) {
          return err('name-duplicate');
        }
        await customGames.update(renamed.value);
        return renamed;
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

function isSameBinding(a: GroupBinding, b: GroupBinding): boolean {
  if (a.kind === 'global' || b.kind === 'global') {
    return (
      a.kind === b.kind &&
      (a.kind === 'global' && a.excludesCatan === true) ===
        (b.kind === 'global' && b.excludesCatan === true)
    );
  }
  return a.gameId === b.gameId;
}
