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
  SettableClock,
  TEST_NOW,
} from '@tests/support/masterDataFakes';
import { aMatch, InMemoryResultStore, TEST_CUSTOM_GAME_ID } from '@tests/support/resultFakes';
import { SeededRandomSource } from '@tests/support/seededRandomSource';
import { aStoredSession } from '@tests/support/sessionFakes';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Clock, StoredSession } from '@/app/ports';
import { pauseClock, startClock } from '@/core/generation';
import {
  CATAN_COLOR_KEYS,
  toGameId,
  toGroupId,
  toMatchId,
  toPersonId,
  type Group,
} from '@/core/model';
import { InvariantError, type Result } from '@/core/shared';
import { CATAN_GAME_ID, type CatanOptions } from '@/games/catan';
import { gameCapabilities } from '@/games/registry';
import { createResultService, type ResultService } from './resultService';

const ANNA = defined(CATAN_TEST_PERSONS[0], 'Anna');
const BEN = defined(CATAN_TEST_PERSONS[1], 'Ben');
const CLARA = defined(CATAN_TEST_PERSONS[2], 'Clara');
const DAVID = defined(CATAN_TEST_PERSONS[3], 'David');
const FOUR: Group = aGroup({
  id: toGroupId('00000000-0000-4000-8000-0000000000c4'),
  name: 'Vier',
  members: CATAN_TEST_PERSONS.map((personId, index) => {
    const color = defined(CATAN_COLOR_KEYS[index], 'colour');
    return { personId, groupColor: color, catanColor: color };
  }),
});
const FIVE: Group = aGroup({
  id: toGroupId('00000000-0000-4000-8000-0000000000c5'),
  name: 'Fünf',
  members: [...CATAN_TEST_PERSONS, toPersonId('00000000-0000-4000-8000-0000000000a5')].map(
    (personId) => ({ personId, groupColor: 'red' }),
  ),
});
const UNO = aCustomGame();
const ARCHIVED_GAME = aCustomGame({
  id: toGameId('00000000-0000-4000-8000-0000000000b2'),
  name: 'Mau-Mau',
  archived: true,
});
const NEW_ID = '00000000-0000-4000-8000-000000000001';

let store: InMemoryResultStore;

function launch(clock: Clock = fixedClock()): ResultService {
  return createResultService({ store, ids: sequentialIds(), clock });
}

async function value<T>(promise: Promise<Result<T, string>>): Promise<T> {
  const result = await promise;
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

// A running Catan match of FOUR: one draw, no placement; its timer started at `TEST_NOW`.
function runningSession(options: Partial<CatanOptions> = {}): StoredSession {
  const setup = aCatanSetup(4, {
    personDraws: { landscapes: true, harbors: false, numbers: false },
    order: { mode: 'none' },
    edition: 'cities-and-knights',
    ...options,
  });
  const generation = runCatanGeneration(setup, new SeededRandomSource(1));
  expect(generation.state).toBe('running');
  return aStoredSession({
    groupId: FOUR.id,
    setup: {
      ...setup,
      colors: setup.colors.map((color, index) => ({
        ...color,
        catanColor: defined(CATAN_COLOR_KEYS[3 - index], 'colour'),
      })),
    },
    generation,
    clock: startClock(TEST_NOW),
  });
}

beforeEach(() => {
  store = new InMemoryResultStore([aGroup(), FOUR, FIVE], [UNO, ARCHIVED_GAME]);
});

describe('US-ER-01 Record a result (service)', () => {
  it('AK-1, AK-2: records a result of a custom game without a generation', async () => {
    const service = launch();

    const match = await value(
      service.record({
        groupId: aGroup().id,
        gameId: TEST_CUSTOM_GAME_ID,
        date: '2026-10-07',
        winnerIds: [ANNA],
      }),
    );

    expect(match).toEqual({
      id: NEW_ID,
      groupId: aGroup().id,
      gameId: TEST_CUSTOM_GAME_ID,
      date: '2026-10-07',
      winnerIds: [ANNA],
      recordedAt: TEST_NOW,
      updatedAt: TEST_NOW,
    });
    expect(store.matches).toEqual([match]);
    expect(store.changes).toEqual([TEST_NOW]);
  });

  it('AK-2: stores nothing for an invalid result', async () => {
    const service = launch();

    expect(
      await service.record({
        groupId: FOUR.id,
        gameId: CATAN_GAME_ID,
        date: '2026-10-07',
        winnerIds: [ANNA],
      }),
    ).toEqual({ ok: false, error: 'edition-missing' });
    expect(store.matches).toEqual([]);
  });

  it('AK-4: with Catan only one winner, with other games a draw', async () => {
    const service = launch();

    expect(
      await service.record({
        groupId: FOUR.id,
        gameId: CATAN_GAME_ID,
        date: '2026-10-07',
        edition: 'base',
        winnerIds: [ANNA, BEN],
      }),
    ).toEqual({ ok: false, error: 'winner-not-single' });
    const draw = await value(
      service.record({
        groupId: FOUR.id,
        gameId: TEST_CUSTOM_GAME_ID,
        date: '2026-10-07',
        winnerIds: [ANNA, BEN, CLARA, DAVID],
      }),
    );
    expect(draw.winnerIds).toEqual([ANNA, BEN, CLARA, DAVID]);
  });

  it('AK-5: the participants are the members of the group (E-41)', async () => {
    const service = launch();

    await expect(
      service.record({
        groupId: aGroup().id,
        gameId: TEST_CUSTOM_GAME_ID,
        date: '2026-10-07',
        winnerIds: [DAVID],
      }),
    ).rejects.toThrow(InvariantError);
  });

  it('AK-5: rejects a group that cannot play the game and a group that is archived', async () => {
    store.groups = [
      ...store.groups,
      aGroup({ id: toGroupId('00000000-0000-4000-8000-0000000000c9'), archived: true }),
    ];
    const service = launch();
    const result = { date: '2026-10-07', edition: 'base', winnerIds: [ANNA] };

    expect(await service.record({ ...result, groupId: FIVE.id, gameId: CATAN_GAME_ID })).toEqual({
      ok: false,
      error: 'group-not-eligible',
    });
    expect(
      await service.record({
        date: '2026-10-07',
        winnerIds: [ANNA],
        groupId: toGroupId('00000000-0000-4000-8000-0000000000c9'),
        gameId: TEST_CUSTOM_GAME_ID,
      }),
    ).toEqual({ ok: false, error: 'group-not-eligible' });
    expect(store.matches).toEqual([]);
  });

  it('AK-5: rejects a custom game that is archived or does not exist', async () => {
    const service = launch();
    const result = { groupId: aGroup().id, date: '2026-10-07', winnerIds: [ANNA] };

    expect(await service.record({ ...result, gameId: ARCHIVED_GAME.id })).toEqual({
      ok: false,
      error: 'game-not-eligible',
    });
    expect(
      await service.record({
        ...result,
        gameId: toGameId('00000000-0000-4000-8000-0000000000b9'),
      }),
    ).toEqual({ ok: false, error: 'game-not-eligible' });
  });

  it('AK-6, AK-7, US-ER-02, US-ER-03: stores mode, points, colours, duration and notes of Catan', async () => {
    const service = launch();
    const scores = { [ANNA]: 10, [BEN]: 8, [CLARA]: 8, [DAVID]: 6 };
    const catanColors = {
      [ANNA]: 'red',
      [BEN]: 'blue',
      [CLARA]: 'white',
      [DAVID]: 'orange',
    } as const;

    const match = await value(
      service.record({
        groupId: FOUR.id,
        gameId: CATAN_GAME_ID,
        date: '2026-10-07',
        time: '19:30',
        edition: 'base',
        winnerIds: [ANNA],
        scores,
        catanColors,
        durationMinutes: 95,
        notes: 'Räuber vergessen',
      }),
    );

    expect(match).toMatchObject({
      time: '19:30',
      edition: 'base',
      mode: 'standard',
      scores,
      catanColors,
      durationMinutes: 95,
      notes: 'Räuber vergessen',
    });
  });

  it('rejects a group that no longer exists, e.g. from an old address', async () => {
    const gone = toGroupId('00000000-0000-4000-8000-0000000000cf');
    expect(
      await launch().record({
        groupId: gone,
        gameId: TEST_CUSTOM_GAME_ID,
        date: '2026-10-07',
        winnerIds: [ANNA],
      }),
    ).toEqual({ ok: false, error: 'group-not-eligible' });
    expect(await launch().draft(gone, TEST_CUSTOM_GAME_ID)).toEqual({
      ok: false,
      error: 'group-not-eligible',
    });
  });
});

describe('US-ER-02 and US-ER-06 Points and ranking of custom games (service)', () => {
  const SKYJO = aCustomGame({
    id: toGameId('00000000-0000-4000-8000-0000000000b3'),
    name: 'Skyjo',
    scoring: 'lowest-wins',
  });

  beforeEach(() => {
    store.customGames = [UNO, ARCHIVED_GAME, SKYJO];
  });

  it('FA-SP-07: the rules of a custom game follow its setting for points', async () => {
    const skyjo = await value(launch().draft(aGroup().id, SKYJO.id));
    const uno = await value(launch().draft(aGroup().id, UNO.id));

    expect(skyjo.rules).toMatchObject({
      scoring: 'lowest-wins',
      allowsNegativeScores: true,
      supportsRanking: true,
    });
    expect(uno.rules).toMatchObject({ scoring: null, supportsRanking: true });
  });

  it('US-ER-02 AK-1, AK-3: records points of a custom game that counts them, also below 0', async () => {
    const scores = { [ANNA]: -4, [BEN]: 31 };

    const match = await value(
      launch().record({
        groupId: aGroup().id,
        gameId: SKYJO.id,
        date: '2026-10-07',
        winnerIds: [ANNA],
        scores,
      }),
    );

    expect(match.scores).toEqual(scores);
  });

  it('US-ER-02 AK-1: points for a custom game without points are a programming error', async () => {
    await expect(
      launch().record({
        groupId: aGroup().id,
        gameId: UNO.id,
        date: '2026-10-07',
        winnerIds: [ANNA],
        scores: { [ANNA]: 3, [BEN]: 1 },
      }),
    ).rejects.toThrow(InvariantError);
    expect(store.matches).toEqual([]);
  });

  it('US-ER-06 AK-1: records a ranking by hand, also for a game that counts points', async () => {
    const service = launch();
    for (const game of [UNO, SKYJO]) {
      const match = await value(
        service.record({
          groupId: aGroup().id,
          gameId: game.id,
          date: '2026-10-07',
          winnerIds: [BEN],
          places: { [ANNA]: 2, [BEN]: 1 },
        }),
      );

      expect(match.places).toEqual({ [ANNA]: 2, [BEN]: 1 });
    }
  });

  it('US-ER-05 AK-1: a change is checked with the current setting of the game', async () => {
    const stored = aMatch({ gameId: SKYJO.id });
    store.matches = [stored];

    const changed = await value(
      launch().edit(stored.id, {
        date: '2026-10-07',
        winnerIds: [BEN],
        scores: { [ANNA]: 40, [BEN]: 12 },
      }),
    );

    expect(changed.scores).toEqual({ [ANNA]: 40, [BEN]: 12 });
  });
});

describe('US-ER-01 and US-ER-03 Starting values of a new result', () => {
  it('AK-2: today as date; US-ER-03 AK-1: the Catan colours of the group; the default mode', async () => {
    const draft = await value(
      launch(fixedClock('2026-11-15T21:40:00.000Z')).draft(FOUR.id, CATAN_GAME_ID),
    );

    expect(draft).toMatchObject({
      groupId: FOUR.id,
      gameId: CATAN_GAME_ID,
      participants: CATAN_TEST_PERSONS,
      values: {
        date: '2026-11-15',
        mode: 'standard',
        winnerIds: [],
        catanColors: { [ANNA]: 'red', [BEN]: 'blue', [CLARA]: 'white', [DAVID]: 'orange' },
      },
    });
    expect(draft.rules.hasSingleWinner).toBe(true);
    expect(draft.values.time).toBeUndefined();
  });

  it('a custom game starts without mode and colours', async () => {
    const draft = await value(launch().draft(aGroup().id, TEST_CUSTOM_GAME_ID));

    expect(draft.values).toEqual({ date: '2026-10-07', winnerIds: [] });
    expect(draft.rules.tracksDuration).toBe(false);
  });

  it('AK-5: no starting values for a group that cannot play the game', async () => {
    expect(await launch().draft(FIVE.id, CATAN_GAME_ID)).toEqual({
      ok: false,
      error: 'group-not-eligible',
    });
    expect(await launch().draft(aGroup().id, ARCHIVED_GAME.id)).toEqual({
      ok: false,
      error: 'game-not-eligible',
    });
  });
});

describe('US-AB-06 End a match with a result (service)', () => {
  it('AK-2: the form is filled from the match; US-AB-07 AK-4: with its beginning and duration', async () => {
    const clock = new SettableClock();
    store.session = runningSession();
    clock.advance(95.4);

    const draft = await value(launch(clock).draftFromSession());

    expect(draft).toEqual({
      groupId: FOUR.id,
      gameId: CATAN_GAME_ID,
      participants: CATAN_TEST_PERSONS,
      rules: gameCapabilities(CATAN_GAME_ID),
      values: {
        date: '2026-10-07',
        time: '18:30',
        edition: 'cities-and-knights',
        mode: 'standard',
        winnerIds: [],
        catanColors: { [ANNA]: 'orange', [BEN]: 'white', [CLARA]: 'blue', [DAVID]: 'red' },
        durationMinutes: 95,
      },
    });
  });

  it('US-AB-07 AK-4: a paused timer gives the time until the pause, at least 1 minute', async () => {
    const clock = new SettableClock();
    const paused = pauseClock(startClock(TEST_NOW), TEST_NOW);
    if (!paused.ok) throw new Error(paused.error);
    store.session = { ...runningSession(), clock: paused.value };
    clock.advance(30);

    const draft = await value(launch(clock).draftFromSession());

    expect(draft.values.durationMinutes).toBe(1);
  });

  it('AK-2: after storing, the match is ended in the same transaction', async () => {
    store.session = runningSession();
    const service = launch();
    const draft = await value(service.draftFromSession());

    const match = await value(service.recordFromSession({ ...draft.values, winnerIds: [CLARA] }));

    expect(store.session).toBeUndefined();
    expect(store.matches).toEqual([match]);
    expect(match).toMatchObject({
      groupId: FOUR.id,
      gameId: CATAN_GAME_ID,
      date: '2026-10-07',
      time: '18:30',
      edition: 'cities-and-knights',
      winnerIds: [CLARA],
    });
  });

  it('AK-2: an invalid result keeps the match running', async () => {
    const running = runningSession();
    store.session = running;
    const service = launch();
    const draft = await value(service.draftFromSession());

    expect(await service.recordFromSession(draft.values)).toEqual({
      ok: false,
      error: 'winner-missing',
    });
    expect(store.session).toEqual(running);
    expect(store.matches).toEqual([]);
  });

  it('AK-2: if storing fails, the match keeps running', async () => {
    const running = runningSession();
    store.session = running;
    const service = launch();
    store.matches = [aMatch({ id: toMatchId(NEW_ID) })];

    await expect(
      service.recordFromSession({ date: '2026-10-07', edition: 'base', winnerIds: [ANNA] }),
    ).rejects.toThrow(InvariantError);
    expect(store.session).toEqual(running);
  });

  it('AK-1: only a running match has a result; none, unknown or in generation is rejected', async () => {
    const service = launch();
    const result = { date: '2026-10-07', edition: 'base', winnerIds: [ANNA] };

    expect(await service.draftFromSession()).toEqual({ ok: false, error: 'no-session' });
    expect(await service.recordFromSession(result)).toEqual({ ok: false, error: 'no-session' });

    store.session = { ...runningSession(), schemaVersion: 3 };
    expect(await service.draftFromSession()).toEqual({ ok: false, error: 'session-unsupported' });

    store.session = aStoredSession({ groupId: FOUR.id });
    expect(await service.draftFromSession()).toEqual({ ok: false, error: 'session-not-running' });
    expect(await service.recordFromSession(result)).toEqual({
      ok: false,
      error: 'session-not-running',
    });
    expect(store.session).toBeDefined();
  });
});

describe('US-ER-05 Change and delete a result (service)', () => {
  it('AK-1: changes a result and keeps id, group, game and time of recording', async () => {
    const stored = aMatch({ notes: 'alt' });
    store.matches = [stored];

    const changed = await value(
      launch(fixedClock('2026-10-09T08:00:00.000Z')).edit(stored.id, {
        date: '2026-10-06',
        time: '20:15',
        winnerIds: [BEN],
      }),
    );

    expect(changed).toEqual({
      id: stored.id,
      groupId: stored.groupId,
      gameId: stored.gameId,
      date: '2026-10-06',
      time: '20:15',
      winnerIds: [BEN],
      recordedAt: stored.recordedAt,
      updatedAt: '2026-10-09T08:00:00.000Z',
    });
    expect(store.matches).toEqual([changed]);
    expect(store.changes).toEqual(['2026-10-09T08:00:00.000Z']);
  });

  it('AK-1: checks the changed result like a new one and keeps the stored one if invalid', async () => {
    const stored = aMatch();
    store.matches = [stored];

    expect(await launch().edit(stored.id, { date: '2026-10-07', winnerIds: [] })).toEqual({
      ok: false,
      error: 'winner-missing',
    });
    expect(store.matches).toEqual([stored]);
  });

  it('AK-4: a result of a group archived since can still be changed', async () => {
    const stored = aMatch();
    store.matches = [stored];
    store.groups = [aGroup({ archived: true })];
    store.customGames = [aCustomGame({ archived: true })];

    const changed = await value(launch().edit(stored.id, { date: '2026-10-07', winnerIds: [BEN] }));

    expect(changed.winnerIds).toEqual([BEN]);
  });

  it('AK-2 (without snapshot until I4), AK-3: deletes a result', async () => {
    const stored = aMatch();
    store.matches = [stored];

    expect(await launch(fixedClock('2026-10-09T08:00:00.000Z')).delete(stored.id)).toEqual({
      ok: true,
      value: undefined,
    });
    expect(store.matches).toEqual([]);
    expect(store.changes).toEqual(['2026-10-09T08:00:00.000Z']);
  });

  it('rejects changing or deleting a result that does not exist', async () => {
    const missing = toMatchId('00000000-0000-4000-8000-0000000000d9');

    expect(await launch().edit(missing, { date: '2026-10-07', winnerIds: [ANNA] })).toEqual({
      ok: false,
      error: 'match-not-found',
    });
    expect(await launch().delete(missing)).toEqual({ ok: false, error: 'match-not-found' });
  });
});
