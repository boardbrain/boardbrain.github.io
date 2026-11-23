import {
  aCatanSetup,
  CATAN_TEST_PERSONS,
  runCatanGeneration,
} from '@tests/support/catanGeneration';
import { defined } from '@tests/support/defined';
import {
  aCustomGame,
  aGroup,
  fixedClock,
  sequentialIds,
  TEST_NOW,
} from '@tests/support/masterDataFakes';
import { SeededRandomSource } from '@tests/support/seededRandomSource';
import { aStoredSession } from '@tests/support/sessionFakes';
import { createTestDb } from '@tests/support/testDatabase';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createResultService, type ResultService } from '@/app/services/resultService';
import { startClock } from '@/core/generation';
import { CATAN_COLOR_KEYS, toGroupId, type Group } from '@/core/model';
import type { Result } from '@/core/shared';
import { CATAN_GAME_ID } from '@/games/catan';
import type { BoardBrainDb } from '@/infra/db/database';
import { createDexieResultStore } from '@/infra/db/resultStore';

// C-T-1 (code review 16.11.2026): the result service on the real database schema with
// `fake-indexeddb`, one test per way of writing; the service tests use a store in memory.

const ANNA = defined(CATAN_TEST_PERSONS[0], 'Anna');
const BEN = defined(CATAN_TEST_PERSONS[1], 'Ben');
const FOUR: Group = aGroup({
  id: toGroupId('00000000-0000-4000-8000-0000000000c4'),
  name: 'Vier',
  members: CATAN_TEST_PERSONS.map((personId, index) => {
    const color = defined(CATAN_COLOR_KEYS[index], 'colour');
    return { personId, groupColor: color, catanColor: color };
  }),
});
const SKYJO = aCustomGame({ name: 'Skyjo', scoring: 'lowest-wins' });

let db: BoardBrainDb;
let service: ResultService;

async function value<T>(promise: Promise<Result<T, string>>): Promise<T> {
  const result = await promise;
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

beforeEach(async () => {
  db = createTestDb();
  await db.groups.put(FOUR);
  await db.games.put(SKYJO);
  service = createResultService({
    store: createDexieResultStore(db),
    ids: sequentialIds(),
    clock: fixedClock(),
  });
});

afterEach(() => {
  db.close();
});

describe('C-T-1 ResultService on the database (US-ER-01, US-ER-05, US-AB-06)', () => {
  it('record stores a result with points', async () => {
    const scores = Object.fromEntries(
      CATAN_TEST_PERSONS.map((personId, seat) => [personId, seat * 3]),
    );

    const match = await value(
      service.record({
        groupId: FOUR.id,
        gameId: SKYJO.id,
        date: '2026-10-07',
        winnerIds: [ANNA],
        scores,
      }),
    );

    expect(await db.matches.toArray()).toEqual([match]);
  });

  it('recordFromSession stores the result and ends the match together', async () => {
    const setup = aCatanSetup(4, {
      personDraws: { landscapes: true, harbors: false, numbers: false },
      order: { mode: 'none' },
    });
    const generation = runCatanGeneration(setup, new SeededRandomSource(1));
    await db.session.put(
      aStoredSession({ groupId: FOUR.id, setup, generation, clock: startClock(TEST_NOW) }),
    );
    const draft = await value(service.draftFromSession());

    const match = await value(service.recordFromSession({ ...draft.values, winnerIds: [BEN] }));

    expect(match.gameId).toBe(CATAN_GAME_ID);
    expect(await db.matches.toArray()).toEqual([match]);
    expect(await db.session.count()).toBe(0);
  });

  it('edit changes the stored result and keeps the time of recording', async () => {
    const stored = await value(
      service.record({ groupId: FOUR.id, gameId: SKYJO.id, date: '2026-10-07', winnerIds: [ANNA] }),
    );

    const changed = await value(
      service.edit(stored.id, { date: '2026-10-06', winnerIds: [BEN], notes: 'Revanche' }),
    );

    expect(await db.matches.get(stored.id)).toEqual(changed);
    expect(changed.recordedAt).toBe(stored.recordedAt);
  });

  it('draftOf reads a stored result for changing it', async () => {
    const stored = await value(
      service.record({ groupId: FOUR.id, gameId: SKYJO.id, date: '2026-10-07', winnerIds: [ANNA] }),
    );

    const draft = await value(service.draftOf(stored.id));

    expect(draft.values).toEqual({ date: '2026-10-07', winnerIds: [ANNA] });
    expect(draft.groupId).toBe(FOUR.id);
  });

  it('delete removes the result', async () => {
    const stored = await value(
      service.record({ groupId: FOUR.id, gameId: SKYJO.id, date: '2026-10-07', winnerIds: [ANNA] }),
    );

    await value(service.delete(stored.id));

    expect(await db.matches.count()).toBe(0);
  });
});
