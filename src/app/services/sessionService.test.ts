import { CATAN_TEST_PERSONS } from '@tests/support/catanGeneration';
import { defined } from '@tests/support/defined';
import {
  aGroup,
  fixedClock,
  InMemoryMasterDataStore,
  sequentialIds,
  TEST_NOW,
} from '@tests/support/masterDataFakes';
import { SeededRandomSource } from '@tests/support/seededRandomSource';
import { InMemorySessionStore } from '@tests/support/sessionFakes';
import { beforeEach, describe, expect, it } from 'vitest';
import type { StoredSession } from '@/app/ports';
import { stepsDiscardedBy } from '@/core/generation';
import { CATAN_COLOR_KEYS, toGroupId, type Group, type MemberColors } from '@/core/model';
import { InvariantError, type Result } from '@/core/shared';
import {
  CATAN_DEFAULT_OPTIONS,
  CATAN_GAME_ID,
  CATAN_GENERATION,
  catanSummary,
  type CatanOptions,
} from '@/games/catan';
import { createMasterDataService, type MasterDataService } from './masterDataService';
import { createSessionService, type SessionService } from './sessionService';

const FOUR_COLORS: MemberColors[] = CATAN_COLOR_KEYS.map((key) => ({
  groupColor: key,
  catanColor: key,
}));
const FOUR: Group = aGroup({
  id: toGroupId('00000000-0000-4000-8000-0000000000c4'),
  name: 'Vier',
  members: CATAN_TEST_PERSONS.map((personId, index) => ({
    personId,
    ...defined(FOUR_COLORS[index], 'colours'),
  })),
});
const UNO_GROUP: Group = aGroup({
  id: toGroupId('00000000-0000-4000-8000-0000000000c5'),
  name: 'Uno-Runde',
  binding: { kind: 'global', excludesCatan: true },
  members: CATAN_TEST_PERSONS.slice(0, 2).map((personId) => ({ personId, groupColor: 'red' })),
});
const ALL_ON: CatanOptions = {
  ...CATAN_DEFAULT_OPTIONS,
  edition: 'cities-and-knights',
  startingResources: { count: 2, replacement: 'with' },
};

let store: InMemorySessionStore;

// One "launch" of the app: a new service on the same storage, so nothing survives in memory.
// Infra tests show that the Dexie storage itself survives reopening (sessionStore.test.ts).
function launch(seed = 1): { service: SessionService; store: InMemorySessionStore } {
  const service = createSessionService({
    store,
    clock: fixedClock(),
    rng: new SeededRandomSource(seed),
  });
  return { service, store };
}

async function value<T>(promise: Promise<Result<T, string>>): Promise<T> {
  const result = await promise;
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

async function startFour(service: SessionService, options = ALL_ON): Promise<StoredSession> {
  const preparation = await value(service.prepare(FOUR.id));
  return value(service.start({ groupId: FOUR.id, options, colors: preparation.colors }));
}

// Draws and confirms `count` steps.
async function advance(service: SessionService, count: number): Promise<StoredSession> {
  let session: StoredSession | undefined;
  for (let step = 0; step < count; step++) {
    await value(service.drawNextStep());
    session = await value(service.confirmStep());
  }
  return defined(session, 'session');
}

function stored(): StoredSession | undefined {
  return store.session;
}

beforeEach(() => {
  store = new InMemorySessionStore([FOUR, UNO_GROUP]);
});

describe('US-AB-01 Prepare and start a match', () => {
  it('AK-2, US-SP-04, US-PG-04: prepares all members, default options and the group colours', async () => {
    const { service } = launch();

    expect(await service.prepare(FOUR.id)).toEqual({
      ok: true,
      value: {
        groupId: FOUR.id,
        participants: CATAN_TEST_PERSONS,
        options: CATAN_DEFAULT_OPTIONS,
        colors: FOUR.members.map(({ personId, catanColor }) => ({ personId, catanColor })),
      },
    });
  });

  it('AK-1: rejects a group that cannot play Catan', async () => {
    const { service } = launch();

    expect(await service.prepare(UNO_GROUP.id)).toEqual({ ok: false, error: 'group-not-eligible' });
    expect(await service.start({ groupId: UNO_GROUP.id, options: ALL_ON, colors: [] })).toEqual({
      ok: false,
      error: 'group-not-eligible',
    });
    expect(await service.isSessionActive()).toBe(false);
  });

  it('Specification 3.5: stores the generation without a step, with setup and colours', async () => {
    const { service } = launch();
    const colors = FOUR.members.map(({ personId }, index) => ({
      personId,
      catanColor: defined((['orange', 'white', 'blue', 'red'] as const)[index], 'colour'),
    }));

    const session = await value(service.start({ groupId: FOUR.id, options: ALL_ON, colors }));

    expect(session).toEqual({
      id: 'current',
      schemaVersion: 1,
      gameId: CATAN_GAME_ID,
      groupId: FOUR.id,
      setup: { participants: CATAN_TEST_PERSONS, options: ALL_ON, colors },
      generation: {
        state: 'generation',
        steps: [],
        gameState: { hiddenPlan: null, placementSkipped: false },
      },
      startedAt: TEST_NOW,
    });
    expect(stored()).toEqual(session);
    expect(await service.isSessionActive()).toBe(true);
    // US-PG-04 AK-1: the colours of the group stay unchanged.
    expect(store.groups).toEqual([FOUR, UNO_GROUP]);
  });

  it('throws for options or colours that do not fit, and for an unknown group', async () => {
    const { service } = launch();
    const { colors } = await value(service.prepare(FOUR.id));

    await expect(
      service.start({
        groupId: FOUR.id,
        options: { ...ALL_ON, startingResources: { count: 9, replacement: 'with' } },
        colors,
      }),
    ).rejects.toThrow(InvariantError);
    await expect(
      service.start({ groupId: FOUR.id, options: ALL_ON, colors: colors.slice(1) }),
    ).rejects.toThrow(InvariantError);
    await expect(
      service.prepare(toGroupId('00000000-0000-4000-8000-0000000000c9')),
    ).rejects.toThrow(InvariantError);
    expect(await service.isSessionActive()).toBe(false);
  });

  it('AK-5: runs the active phases in the order of Specification 3.1, 26 steps', async () => {
    const { service } = launch();
    await startFour(service);

    const session = await advance(service, 26);

    expect(session.generation.state).toBe('running');
    expect(session.generation.steps).toHaveLength(26);
    expect(await service.drawNextStep()).toEqual({ ok: false, error: 'generation-complete' });
  });
});

describe('US-AB-05 The running match survives a restart', () => {
  it('AK-2: a new match is rejected while one is in generation or running', async () => {
    const { service } = launch();
    await startFour(service);

    const { colors } = await value(service.prepare(FOUR.id));
    expect(await service.start({ groupId: FOUR.id, options: ALL_ON, colors })).toEqual({
      ok: false,
      error: 'session-active',
    });
  });

  it('ADR-014, AK-3: a revealed step is stored before it is shown and stays after a restart', async () => {
    const first = launch(5);
    await startFour(first.service);
    await advance(first.service, 7);
    const revealed = await value(first.service.drawNextStep());
    expect(stored()).toEqual(revealed);

    const second = launch(6);

    expect(await second.service.current()).toEqual({ ok: true, value: revealed });
    expect(revealed.generation.steps.at(-1)?.status).toBe('revealed');
    // The same result is shown again, nothing is drawn anew; the step waits for confirmation.
    expect(await second.service.drawNextStep()).toEqual({ ok: false, error: 'step-pending' });
    const confirmed = await value(second.service.confirmStep());
    expect(confirmed.generation.steps.map((record) => record.step)).toEqual(
      revealed.generation.steps.map((record) => record.step),
    );
  });

  it('AK-1: after a confirmation a restart opens exactly the same state', async () => {
    const first = launch(7);
    await startFour(first.service);
    const confirmed = await advance(first.service, 12);

    const second = launch(8);

    expect(await second.service.current()).toEqual({ ok: true, value: confirmed });
    const next = await value(second.service.drawNextStep());
    expect(next.generation.steps.slice(0, 12)).toEqual(confirmed.generation.steps);
  });

  it('ADR-010: the hidden plan is part of the stored session', async () => {
    const first = launch(9);
    await startFour(first.service);
    const afterFirstBuilding = await advance(first.service, 7);
    const plan = afterFirstBuilding.generation.gameState.hiddenPlan ?? [];
    expect(plan).toHaveLength(7);

    const second = launch(10);
    const next = await advance(second.service, 2);

    expect(next.generation.steps[8]?.step).toMatchObject({ kind: 'building', result: plan[0] });
  });

  it('Architecture 10.3: a session of unknown version gives a message and can be ended', async () => {
    const { service } = launch();
    const session = await startFour(service);
    store.session = { ...session, schemaVersion: 99 };

    expect(await service.current()).toEqual({ ok: false, error: 'session-unsupported' });
    expect(await service.drawNextStep()).toEqual({ ok: false, error: 'session-unsupported' });
    expect(await service.isSessionActive()).toBe(true);
    await service.endWithoutResult();
    expect(await service.current()).toEqual({ ok: true, value: null });
  });
});

describe('US-AB-02 and US-AB-03 Confirm and repeat steps (service)', () => {
  it('US-AB-02 AK-1: confirms only a revealed step and stores the confirmation at once', async () => {
    const { service } = launch();
    await startFour(service);

    expect(await service.confirmStep()).toEqual({ ok: false, error: 'no-step-revealed' });
    await value(service.drawNextStep());
    const confirmed = await value(service.confirmStep());
    expect(stored()).toEqual(confirmed);
  });

  it('AK-1, AK-4: stores the repeated step as revealed and discards the dependent steps', async () => {
    const { service } = launch(11);
    await startFour(service);
    const before = await advance(service, 26);
    const building = before.generation.steps.findIndex(
      ({ step }) => step.kind === 'building' && step.index === 6,
    );
    const discarded = stepsDiscardedBy(CATAN_GENERATION, before.setup, before.generation, building);

    const repeated = await value(service.repeatStep(building));

    expect(discarded).toHaveLength(3);
    expect(repeated.generation.steps).toHaveLength(26 - 3);
    expect(repeated.generation.steps[building]).toMatchObject({
      step: { kind: 'building', index: 6 },
      status: 'revealed',
    });
    expect(repeated.generation.state).toBe('generation');
    expect(stored()).toEqual(repeated);
  });

  it('AK-6: a step of a running match can be repeated; afterwards it is running again', async () => {
    const { service } = launch(12);
    await startFour(service);
    await advance(service, 26);

    await value(service.repeatStep(0));
    const confirmed = await value(service.confirmStep());

    expect(confirmed.generation.state).toBe('running');
  });

  it('AK-7: a repetition is recorded nowhere', async () => {
    const { service } = launch(13);
    await startFour(service);
    const before = await advance(service, 26);

    await value(service.repeatStep(25));
    const after = await value(service.confirmStep());

    expect(Object.keys(after)).toEqual(Object.keys(before));
    expect(Object.keys(after.generation)).toEqual(Object.keys(before.generation));
    expect(after.generation.steps).toHaveLength(26);
  });

  it('rejects repeating another step while one waits for confirmation', async () => {
    const { service } = launch();
    await startFour(service);
    await advance(service, 2);
    await value(service.drawNextStep());

    expect(await service.repeatStep(0)).toEqual({ ok: false, error: 'step-pending' });
  });
});

describe('US-PL-05 Skip the placement (service)', () => {
  it('AK-2: stores the skipped placement and continues with the starting resources', async () => {
    const { service } = launch(14);
    await startFour(service);
    expect(await service.skipPlacement()).toEqual({ ok: false, error: 'placement-not-skippable' });
    await advance(service, 6);

    const skipped = await value(service.skipPlacement());
    expect(stored()).toEqual(skipped);

    const finished = await advance(service, 4);
    const summary = catanSummary(finished.setup, finished.generation);
    expect(finished.generation.state).toBe('running');
    expect(summary.placementSkipped).toBe(true);
    expect(summary.buildings).toEqual([]);
    expect(summary.startingResources).toHaveLength(4);
  });
});

describe('US-AB-06 End a match', () => {
  it('AK-3, AK-4: ends without result; the generation is discarded and no longer available', async () => {
    const { service } = launch();
    await startFour(service);
    await advance(service, 3);

    await service.endWithoutResult();

    expect(stored()).toBeUndefined();
    expect(await service.current()).toEqual({ ok: true, value: null });
    expect(await service.isSessionActive()).toBe(false);
    expect(await service.drawNextStep()).toEqual({ ok: false, error: 'no-session' });
  });

  it('AK-3: can end a match that is already running', async () => {
    const { service } = launch();
    await startFour(service);
    await advance(service, 26);

    await service.endWithoutResult();

    expect(await service.isSessionActive()).toBe(false);
  });
});

describe('US-VW-02 AK-5 The binding of a group in a match is locked', () => {
  // Master data on the same groups, seeing the session the session service stored.
  function masterData(): { service: MasterDataService; groups: () => readonly Group[] } {
    const masterStore = new InMemoryMasterDataStore();
    masterStore.groups = store.groups;
    masterStore.session = store.session;
    const service = createMasterDataService({
      store: masterStore,
      ids: sequentialIds(),
      clock: fixedClock(),
      supportedGameNames: ['Catan'],
    });
    return { service, groups: () => masterStore.groups };
  }

  it('rejects a changed binding while the group is in generation or running', async () => {
    const { service } = launch();
    await startFour(service);

    const master = masterData();

    const result = await master.service.editGroup({
      groupId: FOUR.id,
      name: FOUR.name,
      binding: { kind: 'game', gameId: CATAN_GAME_ID },
      colors: FOUR_COLORS,
    });

    expect(result).toEqual({ ok: false, error: 'group-in-session' });
    expect(master.groups()).toEqual([FOUR, UNO_GROUP]);
  });

  it('keeps name and colours changeable during the match', async () => {
    const { service } = launch();
    await startFour(service);
    await advance(service, 26);

    const result = await masterData().service.editGroup({
      groupId: FOUR.id,
      name: 'Vierer',
      binding: FOUR.binding,
      colors: FOUR_COLORS,
    });

    expect(result.ok && result.value.name).toBe('Vierer');
  });

  it('allows the change again once the match has ended', async () => {
    const { service } = launch();
    await startFour(service);
    await service.endWithoutResult();

    const result = await masterData().service.editGroup({
      groupId: FOUR.id,
      name: FOUR.name,
      binding: { kind: 'global', excludesCatan: true },
      colors: FOUR_COLORS.map(({ groupColor }) => ({ groupColor })),
    });

    expect(result.ok).toBe(true);
  });
});
