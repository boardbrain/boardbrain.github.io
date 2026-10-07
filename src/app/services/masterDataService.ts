import {
  containsName,
  createCustomGame,
  createPerson,
  toGameId,
  toPersonId,
  type CustomGame,
  type NameEmptyError,
  type Person,
} from '@/core/model';
import { err, type Result } from '@/core/shared';
import type { Clock, IdGenerator, MasterDataStore } from '@/app/ports';

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
 * Creating, editing, archiving and deleting persons, groups and custom games
 * (Architecture 4.4). This increment contains creating persons and custom games.
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
