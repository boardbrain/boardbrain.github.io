import type { Clock, IdGenerator, MasterDataRepositories, MasterDataStore } from '@/app/ports';
import {
  toGameId,
  toGroupId,
  toPersonId,
  type CustomGame,
  type Group,
  type Person,
} from '@/core/model';

/**
 * Fixed time for tests.
 */
export const TEST_NOW = '2026-10-07T18:30:00.000Z';

/**
 * Clock that always returns the same time.
 */
export function fixedClock(now: string = TEST_NOW): Clock {
  return { now: () => now };
}

/**
 * Deterministic UUID v4 values 00000000-0000-4000-8000-000000000001, …002, … for tests
 * (Development Guidelines 8.2: no real randomness in unit tests).
 */
export function sequentialIds(): IdGenerator {
  let counter = 0;
  return {
    newId: () => {
      counter += 1;
      return `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`;
    },
  };
}

/**
 * Storage stand-in for application service tests (Architecture 14.1). A transaction works on
 * copies and only takes them over if `work` completes, like a database transaction.
 */
export class InMemoryMasterDataStore implements MasterDataStore {
  persons: readonly Person[] = [];
  customGames: readonly CustomGame[] = [];
  groups: readonly Group[] = [];

  async transaction<T>(work: (repositories: MasterDataRepositories) => Promise<T>): Promise<T> {
    const persons = [...this.persons];
    const customGames = [...this.customGames];
    const groups = [...this.groups];
    const result = await work({
      persons: {
        listAll: () => Promise.resolve([...persons]),
        add: (person) => {
          persons.push(person);
          return Promise.resolve();
        },
      },
      groups: {
        listAll: () => Promise.resolve([...groups]),
        add: (group) => {
          groups.push(group);
          return Promise.resolve();
        },
      },
      customGames: {
        listAll: () => Promise.resolve([...customGames]),
        add: (game) => {
          customGames.push(game);
          return Promise.resolve();
        },
      },
    });
    this.persons = persons;
    this.customGames = customGames;
    this.groups = groups;
    return result;
  }
}

/**
 * Test person with sensible defaults.
 */
export function aPerson(fields: Partial<Person> = {}): Person {
  return {
    id: toPersonId('00000000-0000-4000-8000-0000000000a1'),
    name: 'Anna',
    archived: false,
    createdAt: TEST_NOW,
    updatedAt: TEST_NOW,
    ...fields,
  };
}

/**
 * Test custom game with sensible defaults.
 */
export function aCustomGame(fields: Partial<CustomGame> = {}): CustomGame {
  return {
    id: toGameId('00000000-0000-4000-8000-0000000000b1'),
    name: 'Uno',
    archived: false,
    createdAt: TEST_NOW,
    updatedAt: TEST_NOW,
    ...fields,
  };
}

/**
 * Test group of two members with sensible defaults.
 */
export function aGroup(fields: Partial<Group> = {}): Group {
  return {
    id: toGroupId('00000000-0000-4000-8000-0000000000c1'),
    name: 'Anna & Ben',
    archived: false,
    binding: { kind: 'global' },
    members: [
      {
        personId: toPersonId('00000000-0000-4000-8000-0000000000a1'),
        groupColor: 'red',
        catanColor: 'red',
      },
      {
        personId: toPersonId('00000000-0000-4000-8000-0000000000a2'),
        groupColor: 'blue',
        catanColor: 'blue',
      },
    ],
    createdAt: TEST_NOW,
    updatedAt: TEST_NOW,
    ...fields,
  };
}
