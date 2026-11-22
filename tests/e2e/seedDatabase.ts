import type { Page } from '@playwright/test';
import type { StoredSession } from '@/app/ports';
import {
  CURRENT_SESSION_ID,
  SESSION_SCHEMA_VERSION,
  startClock,
  startGeneration,
  type SessionClock,
} from '@/core/generation';
import {
  CATAN_COLOR_KEYS,
  GROUP_COLOR_KEYS,
  matchColorsOf,
  parseLocalDate,
  toGameId,
  toGroupId,
  toMatchId,
  toPersonId,
  type CatanColorKey,
  type CustomGame,
  type Group,
  type LocalDate,
  type Match,
  type Person,
  type PersonId,
  type ScoringDirection,
} from '@/core/model';
import { checkResult } from '@/core/results';
import {
  CATAN_DEFAULT_OPTIONS,
  CATAN_GAME_ID,
  CATAN_INITIAL_GAME_STATE,
  openCatanResources,
  type CatanGeneration,
  type CatanOptions,
  type CatanSetup,
} from '@/games/catan';
import { gameCapabilities } from '@/games/registry';
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
  readonly games?: readonly CustomGame[];
  readonly matches?: readonly Match[];
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
  await page.evaluate(async ({ persons, groups, games = [], matches = [], session }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('boardbrain');
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(new Error(String(request.error)));
      };
    });
    const transaction = db.transaction(
      ['persons', 'groups', 'games', 'matches', 'session'],
      'readwrite',
    );
    for (const person of persons) {
      transaction.objectStore('persons').put(person);
    }
    for (const group of groups) {
      transaction.objectStore('groups').put(group);
    }
    for (const game of games) {
      transaction.objectStore('games').put(game);
    }
    for (const match of matches) {
      transaction.objectStore('matches').put(match);
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
  /** The timer of the running match; without it started at the beginning of the seed. */
  readonly clock?: SessionClock;
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
 * a change of the data model shows up here when type checking. Every step drawn is confirmed,
 * and its animation counts as played (FA-AB-07), so nothing moves when the page opens.
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
    generation: withResourcesOpened({
      ...generation,
      steps: generation.steps.map((record) => ({ ...record, isStaged: true })),
    }),
    startedAt: NOW,
    // US-AB-07: a running match has its timer, started when the generation was completed.
    ...(generation.state === 'running' ? { clock: match.clock ?? startClock(NOW) } : {}),
  };
  await writeRecords(page, { persons, groups, session });
  await page.goto('/#/partie');
  const overview = page.getByRole('heading', { name: 'Laufende Partie' });
  await overview.or(page.locator('main[data-page]')).first().waitFor();
}

/**
 * A result of the seeded data. Persons are given by name, points and places in seat order.
 */
export type SeedResult = {
  /** `YYYY-MM-DD` */
  readonly date: string;
  /** `HH:mm` */
  readonly time?: string;
  /** Name of a custom game; without it the result is a Catan match in the base game. */
  readonly game?: string;
  readonly winners: readonly string[];
  /** Victory points in Catan or points of a custom game that counts them (FA-ER-06). */
  readonly scores?: readonly number[];
  /** Ranking entered by hand in a custom game (FA-ER-12). */
  readonly places?: readonly number[];
  readonly durationMinutes?: number;
  readonly notes?: string;
};

// The local day of the machine that runs the tests, like the browser it drives (US-ER-01 AK-8).
function today(): LocalDate {
  const now = new Date();
  const pad = (value: number): string => String(value).padStart(2, '0');
  const day = parseLocalDate(
    `${String(now.getFullYear())}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
  );
  if (!day.ok) throw new Error('no local date');
  return day.value;
}

// A result checked with the rules of the app (Specification 3.6), so seeded data is always valid.
function matchOf(
  result: SeedResult,
  index: number,
  group: Group,
  persons: readonly Person[],
  games: readonly CustomGame[],
): Match {
  const participants = group.members.map((member) => member.personId);
  const idOf = (name: string): PersonId => {
    const person = persons.find((candidate) => candidate.name === name);
    if (person === undefined) throw new Error(`no person ${name}`);
    return person.id;
  };
  const gameId =
    result.game === undefined ? CATAN_GAME_ID : games.find((game) => game.name === result.game)?.id;
  if (gameId === undefined) throw new Error(`no game ${String(result.game)}`);
  const isCatan = gameId === CATAN_GAME_ID;
  const scores: Record<PersonId, number> = {};
  const places: Record<PersonId, number> = {};
  const catanColors: Record<PersonId, CatanColorKey> = {};
  participants.forEach((personId, seat) => {
    const score = result.scores?.[seat];
    if (score !== undefined) scores[personId] = score;
    const place = result.places?.[seat];
    if (place !== undefined) places[personId] = place;
  });
  for (const { personId, catanColor } of isCatan ? matchColorsOf(group) : []) {
    catanColors[personId] = catanColor;
  }
  const checked = checkResult(
    {
      date: result.date,
      ...(result.time === undefined ? {} : { time: result.time }),
      ...(isCatan ? { edition: 'base', catanColors } : {}),
      winnerIds: result.winners.map(idOf),
      ...(result.scores === undefined ? {} : { scores }),
      ...(result.places === undefined ? {} : { places }),
      ...(result.durationMinutes === undefined ? {} : { durationMinutes: result.durationMinutes }),
      ...(result.notes === undefined ? {} : { notes: result.notes }),
    },
    participants,
    gameCapabilities(
      gameId,
      games.find((game) => game.id === gameId),
    ),
    today(),
  );
  if (!checked.ok) throw new Error(`invalid seed result: ${checked.error}`);
  // Recorded one minute apart in the given order (Specification 3.7).
  const recordedAt = new Date(Date.parse(NOW) + index * 60_000).toISOString();
  return {
    id: toMatchId(uuid(1001 + index)),
    groupId: group.id,
    gameId,
    ...checked.value,
    recordedAt,
    updatedAt: recordedAt,
  };
}

/**
 * Writes a table, its custom games and results straight into the database (Development
 * Guidelines 8.3), so a test of lists and statistics does not first enter every result in the
 * user interface; entering is tested by the tests of US-ER-01. The results are checked with the
 * rules of the app, Catan matches get the edition "Basisspiel" and the colours of the table.
 * Afterwards the page shows the start view.
 */
export async function seedResults(
  page: Page,
  table: SeedTable,
  results: readonly SeedResult[],
  /** Custom games that count points, by name (FA-SP-07); the others count none. */
  scoring: Readonly<Record<string, ScoringDirection>> = {},
): Promise<void> {
  const { persons, groups } = recordsOf([table]);
  const [group] = groups;
  if (group === undefined) {
    throw new Error('no table for the results');
  }
  const names = [...new Set(results.flatMap((result) => result.game ?? []))];
  const games: CustomGame[] = names.map((name, index) => ({
    id: toGameId(uuid(201 + index)),
    name,
    archived: false,
    ...(scoring[name] === undefined ? {} : { scoring: scoring[name] }),
    createdAt: NOW,
    updatedAt: NOW,
  }));
  const matches = results.map((result, index) => matchOf(result, index, group, persons, games));
  await writeRecords(page, { persons, groups, games, matches });
}
