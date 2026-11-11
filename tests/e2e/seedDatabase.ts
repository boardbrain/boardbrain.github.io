import type { Page } from '@playwright/test';
import type { StoredSession } from '@/app/ports';
import { CURRENT_SESSION_ID, SESSION_SCHEMA_VERSION, startGeneration } from '@/core/generation';
import {
  CATAN_COLOR_KEYS,
  GROUP_COLOR_KEYS,
  matchColorsOf,
  toGroupId,
  toPersonId,
  type Group,
  type Person,
} from '@/core/model';
import {
  CATAN_DEFAULT_OPTIONS,
  CATAN_GAME_ID,
  CATAN_INITIAL_GAME_STATE,
  openCatanResources,
  type CatanGeneration,
  type CatanOptions,
  type CatanSetup,
} from '@/games/catan';
import { runCatanGeneration } from '@tests/support/catanGeneration';
import { SeededRandomSource } from '@tests/support/seededRandomSource';

const NOW = '2026-11-01T10:00:00.000Z';

/**
 * A table of the seeded data: its name and the names of its members, in seat order.
 */
export type SeedTable = {
  readonly name: string;
  readonly members: readonly string[];
};

function uuid(number: number): string {
  return `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
}

type SeedRecords = {
  readonly persons: readonly Person[];
  readonly groups: readonly Group[];
  readonly session?: StoredSession;
};

// Persons and global tables; members get the group and Catan colours in the order the app gives
// them.
function recordsOf(tables: readonly SeedTable[]): { persons: Person[]; groups: Group[] } {
  const names = [...new Set(tables.flatMap((table) => table.members))];
  const persons: Person[] = names.map((name, index) => ({
    id: toPersonId(uuid(index + 1)),
    name,
    archived: false,
    createdAt: NOW,
    updatedAt: NOW,
  }));
  const idOf = new Map(persons.map((person) => [person.name, person.id]));
  const groups: Group[] = tables.map((table, tableIndex) => ({
    id: toGroupId(uuid(101 + tableIndex)),
    name: table.name,
    archived: false,
    binding: { kind: 'global' },
    members: table.members.map((name, seat) => {
      const personId = idOf.get(name);
      const groupColor = GROUP_COLOR_KEYS[seat];
      const catanColor = CATAN_COLOR_KEYS[seat];
      if (personId === undefined || groupColor === undefined) {
        throw new Error(`no person or colour for ${name}`);
      }
      return catanColor === undefined
        ? { personId, groupColor }
        : { personId, groupColor, catanColor };
    }),
    createdAt: NOW,
    updatedAt: NOW,
  }));
  return { persons, groups };
}

// Writes the records straight into the database of the app; afterwards the page shows the start
// view.
async function writeRecords(page: Page, data: SeedRecords): Promise<void> {
  // The app creates the database with its schema on the first start.
  await page.goto('/#/');
  await page.getByRole('navigation', { name: 'Karten' }).waitFor();
  await page.evaluate(async ({ persons, groups, session }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('boardbrain');
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(new Error(String(request.error)));
      };
    });
    const transaction = db.transaction(['persons', 'groups', 'session'], 'readwrite');
    for (const person of persons) {
      transaction.objectStore('persons').put(person);
    }
    for (const group of groups) {
      transaction.objectStore('groups').put(group);
    }
    if (session !== undefined) {
      transaction.objectStore('session').put(session);
    }
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => {
        resolve();
      };
      transaction.onerror = () => {
        reject(new Error(String(transaction.error)));
      };
    });
    db.close();
  }, data);
  // Read hooks that started before the write show the data after a reload.
  await page.reload();
  await page.getByRole('navigation', { name: 'Karten' }).waitFor();
}

/**
 * Writes persons and global tables straight into the database of the app, as the starting
 * point of a test (Development Guidelines 8.3); creating them in the user interface is tested
 * by persons.spec.ts and groups.spec.ts. Members get the group and Catan colours in the order
 * the app gives them. The records are typed as in `core/model`, so a change of the data model
 * shows up here when type checking. Afterwards the page shows the start view.
 */
export async function seedDatabase(page: Page, tables: readonly SeedTable[]): Promise<void> {
  await writeRecords(page, recordsOf(tables));
}

/**
 * A Catan match of one table as the starting point of a test.
 */
export type SeedMatch = {
  readonly table: SeedTable;
  /** Options that differ from the defaults of the preparation. */
  readonly options?: Partial<CatanOptions>;
  /** Number of steps drawn and confirmed; without it every step, so the match is running. */
  readonly steps?: number;
};

// The starting resources drawn are turned over, as "Alle umdrehen" does in the flow.
function withResourcesOpened(generation: CatanGeneration): CatanGeneration {
  let opened = generation;
  for (const { step } of generation.steps) {
    if (step.kind === 'starting-resources') {
      opened = openCatanResources(
        opened,
        step.personId,
        step.result.map((_, card) => card),
      );
    }
  }
  return opened;
}

/**
 * Writes a table and a Catan match drawn so far straight into the database (Development
 * Guidelines 8.3, K-6), so a test of what comes after the draws does not first tap through the
 * whole match; drawing in the user interface is tested by the tests of US-AB-02 and US-AB-05.
 * The match is drawn with the game logic of the app and a fixed seed, so it is always valid and
 * a change of the data model shows up here when type checking. Every step drawn is confirmed.
 * Afterwards the page shows the match: the overview once it is running, leading back into the
 * flow, as after its last step.
 */
export async function seedMatch(page: Page, match: SeedMatch): Promise<void> {
  const { persons, groups } = recordsOf([match.table]);
  const [group] = groups;
  if (group === undefined) {
    throw new Error('no table for the match');
  }
  const setup: CatanSetup = {
    participants: group.members.map((member) => member.personId),
    options: { ...CATAN_DEFAULT_OPTIONS, ...match.options },
    colors: matchColorsOf(group),
  };
  const generation = runCatanGeneration(
    setup,
    new SeededRandomSource(7),
    startGeneration(CATAN_INITIAL_GAME_STATE),
    match.steps,
  );
  const session: StoredSession = {
    id: CURRENT_SESSION_ID,
    schemaVersion: SESSION_SCHEMA_VERSION,
    gameId: CATAN_GAME_ID,
    groupId: group.id,
    setup,
    generation: withResourcesOpened(generation),
    startedAt: NOW,
  };
  await writeRecords(page, { persons, groups, session });
  await page.goto('/#/partie');
  const overview = page.getByRole('heading', { name: 'Laufende Partie' });
  await overview.or(page.locator('main[data-page]')).first().waitFor();
}
