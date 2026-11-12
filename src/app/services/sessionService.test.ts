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
import { revealedStepIndex, stepsDiscardedBy } from '@/core/generation';
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

// Taps "Losen" `count` times: `count` steps are drawn, the last one waits for confirmation.
// (Where the flow shows "Weiter", it confirms first; "Losen" does the same in one transaction.)
async function draw(service: SessionService, count: number): Promise<StoredSession> {
  let session: StoredSession | undefined;
  for (let step = 0; step < count; step++) {
    session = await value(service.draw(shown()));
  }
  return defined(session, 'session');
}

// Draws all `count` steps and confirms the last one ("Zur Übersicht").
async function finish(service: SessionService, count: number): Promise<StoredSession> {
  await draw(service, count);
  const revealed = shown();
  if (revealed === null) throw new Error('no step revealed');
  return value(service.confirm(revealed));
}

function stored(): StoredSession | undefined {
  return store.session;
}

// The step the person sees: the one waiting for confirmation, if any.
function shown(): number | null {
  const session = store.session;
  return session === undefined ? null : (revealedStepIndex(session.generation) ?? null);
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

  it('Specification 3.5, US-AB-02 AK-3: stores the generation; the first step is not drawn yet', async () => {
    const { service } = launch();
    const colors = FOUR.members.map(({ personId }, index) => ({
      personId,
      catanColor: defined((['orange', 'white', 'blue', 'red'] as const)[index], 'colour'),
    }));

    const session = await value(service.start({ groupId: FOUR.id, options: ALL_ON, colors }));

    expect(session).toEqual({
      id: 'current',
      schemaVersion: 3,
      gameId: CATAN_GAME_ID,
      groupId: FOUR.id,
      setup: { participants: CATAN_TEST_PERSONS, options: ALL_ON, colors },
      generation: {
        state: 'generation',
        steps: [],
        gameState: { hiddenPlan: null, placementSkipped: false, openedResources: [] },
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

    const session = await finish(service, 26);

    expect(session.generation.state).toBe('running');
    expect(session.generation.steps).toHaveLength(26);
    expect(session.generation.steps.every((record) => record.status === 'confirmed')).toBe(true);
    expect(await service.draw(shown())).toEqual({ ok: false, error: 'generation-complete' });
  });

  it('FA-LS-07: an order set by hand has no spins; the placement follows it', async () => {
    const { service } = launch(3);
    const order = [...CATAN_TEST_PERSONS].reverse();
    await startFour(service, { ...ALL_ON, order: { mode: 'manual', order } });

    const session = await finish(service, 23);
    const summary = catanSummary(session.setup, session.generation);

    expect(session.generation.state).toBe('running');
    expect(summary.orderSpins).toEqual([]);
    expect(summary.buildings.slice(0, 4).map((line) => line.personId)).toEqual(order);
  });

  it('a match without any step is running at once', async () => {
    const { service } = launch();

    const session = await startFour(service, {
      ...CATAN_DEFAULT_OPTIONS,
      personDraws: { landscapes: false, harbors: false, numbers: false },
      order: { mode: 'none' },
    });

    expect(session.generation).toMatchObject({ state: 'running', steps: [] });
  });

  it('throws for an order set by hand that does not contain every member once', async () => {
    const { service } = launch();

    await expect(
      startFour(service, {
        ...ALL_ON,
        order: { mode: 'manual', order: CATAN_TEST_PERSONS.slice(0, 3) },
      }),
    ).rejects.toThrow(InvariantError);
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

  it('ADR-014, AK-1, AK-3: a revealed step is stored before it is shown and stays after a restart', async () => {
    const first = launch(5);
    await startFour(first.service);
    const revealed = await draw(first.service, 8);
    expect(stored()).toEqual(revealed);
    expect(revealed.generation.steps.at(-1)?.status).toBe('revealed');

    const second = launch(6);

    expect(await second.service.current()).toEqual({ ok: true, value: revealed });
    // The same result is shown again, nothing is drawn anew; "Losen" confirms it.
    const next = await value(second.service.draw(shown()));
    expect(next.generation.steps.slice(0, 8).map((record) => record.step)).toEqual(
      revealed.generation.steps.map((record) => record.step),
    );
    expect(next.generation.steps[7]?.status).toBe('confirmed');
  });

  it('ADR-010: the hidden plan is part of the stored session', async () => {
    const first = launch(9);
    await startFour(first.service);
    const afterFirstBuilding = await draw(first.service, 7);
    const plan = afterFirstBuilding.generation.gameState.hiddenPlan ?? [];
    expect(plan).toHaveLength(7);

    const second = launch(10);
    const next = await draw(second.service, 2);

    expect(next.generation.steps[8]?.step).toMatchObject({ kind: 'building', result: plan[0] });
  });

  it('Architecture 10.3: a session of unknown version gives a message and can be ended', async () => {
    const { service } = launch();
    const session = await startFour(service);
    store.session = { ...session, schemaVersion: 99 };

    expect(await service.current()).toEqual({ ok: false, error: 'session-unsupported' });
    expect(await service.draw(shown())).toEqual({ ok: false, error: 'session-unsupported' });
    expect(await service.isSessionActive()).toBe(true);
    await service.endWithoutResult();
    expect(await service.current()).toEqual({ ok: true, value: null });
  });
});

describe('US-AB-02 and US-AB-03 Confirm and repeat steps (service)', () => {
  it('US-AB-02 AK-1, AK-3: "Losen" draws the step shown without a result', async () => {
    const { service } = launch();
    await startFour(service);

    const first = await value(service.draw(null));

    expect(first.generation.steps).toMatchObject([
      { step: { kind: 'person-draw', draw: 'landscapes' }, status: 'revealed' },
    ]);
    expect(stored()).toEqual(first);
  });

  it('US-AB-02 AK-1: "Losen" on a drawn step confirms it and draws the next one at once', async () => {
    const { service } = launch();
    await startFour(service);
    const first = await value(service.draw(null));

    const next = await value(service.draw(0));

    expect(next.generation.steps.map((record) => record.status)).toEqual(['confirmed', 'revealed']);
    expect(next.generation.steps[0]?.step).toEqual(first.generation.steps[0]?.step);
    expect(stored()).toEqual(next);
  });

  it('US-AB-02 AK-1, AK-3: "Weiter" confirms without drawing; the next step waits without a result', async () => {
    const { service } = launch();
    await startFour(service);
    await value(service.draw(null));

    const confirmed = await value(service.confirm(0));

    expect(confirmed.generation.steps.map((record) => record.status)).toEqual(['confirmed']);
    expect(revealedStepIndex(confirmed.generation)).toBeUndefined();
    expect(await service.confirm(0)).toEqual({ ok: false, error: 'nothing-to-confirm' });
  });

  it('US-AB-02 AK-1: a second quick tap on the step already confirmed changes nothing', async () => {
    const { service } = launch();
    await startFour(service);
    await value(service.draw(null));

    const [first, second] = await Promise.all([service.draw(0), service.draw(0)]);
    const [third, fourth] = await Promise.all([service.confirm(1), service.confirm(0)]);

    expect(first.ok).toBe(true);
    expect(second).toEqual({ ok: false, error: 'step-changed' });
    expect(third.ok).toBe(true);
    expect(fourth).toEqual({ ok: false, error: 'nothing-to-confirm' });
    expect(stored()?.generation.steps).toHaveLength(2);
    expect(await service.draw(1)).toEqual({ ok: false, error: 'step-changed' });
  });

  it('AK-1, AK-4: discards the repeated step and the dependent steps; "Losen" draws it again', async () => {
    const { service } = launch(11);
    await startFour(service);
    const before = await finish(service, 26);
    const building = before.generation.steps.findIndex(
      ({ step }) => step.kind === 'building' && step.index === 6,
    );
    const discarded = stepsDiscardedBy(CATAN_GENERATION, before.setup, before.generation, building);

    const repeated = await value(service.repeatStep(building));

    expect(discarded).toHaveLength(3);
    // E-35: the repeated step is shown without a result first.
    expect(repeated.generation.steps).toHaveLength(26 - 4);
    expect(revealedStepIndex(repeated.generation)).toBeUndefined();
    expect(repeated.generation.state).toBe('generation');
    expect(stored()).toEqual(repeated);
    const drawn = await value(service.draw(null));
    expect(drawn.generation.steps[building]).toMatchObject({
      step: { kind: 'building', index: 6 },
      status: 'revealed',
    });
  });

  it('AK-6: a step of a running match can be repeated; afterwards it is running again', async () => {
    const { service } = launch(12);
    await startFour(service);
    await finish(service, 26);

    await value(service.repeatStep(0));
    await value(service.draw(null));
    const confirmed = await value(service.confirm(0));

    expect(confirmed.generation.state).toBe('running');
  });

  it('AK-7: a repetition is recorded nowhere', async () => {
    const { service } = launch(13);
    await startFour(service);
    const before = await finish(service, 26);

    await value(service.repeatStep(25));
    await value(service.draw(null));
    const after = await value(service.confirm(25));

    expect(Object.keys(after)).toEqual(Object.keys(before));
    expect(Object.keys(after.generation)).toEqual(Object.keys(before.generation));
    expect(after.generation.steps).toHaveLength(26);
  });

  it('US-AB-04 AK-4: repeating an earlier step confirms the step that waits for confirmation', async () => {
    const { service } = launch();
    await startFour(service);
    await draw(service, 3);

    const repeated = await value(service.repeatStep(0));

    expect(repeated.generation.steps.map(({ step, status }) => `${step.kind} ${status}`)).toEqual([
      'person-draw confirmed',
      'person-draw confirmed',
    ]);
    expect((await value(service.draw(null))).generation.steps).toHaveLength(3);
  });
});

describe('US-SR-01 AK-6 Turn over the starting resources (service)', () => {
  it('FA-SR-05: stores the cards turned over; nothing is drawn and they stay after a restart', async () => {
    const first = launch(15);
    await startFour(first.service);
    const drawn = await draw(first.service, 23);
    const step = defined(drawn.generation.steps[22], 'resources').step;
    if (step.kind !== 'starting-resources') throw new Error(step.kind);

    await value(first.service.openResources(step.personId, [1]));
    const opened = await value(first.service.openResources(step.personId, [0, 1]));

    expect(opened.generation.steps).toEqual(drawn.generation.steps);
    expect(opened.generation.gameState.openedResources).toEqual([
      { personId: step.personId, cards: [0, 1] },
    ]);
    expect(await launch(16).service.current()).toEqual({ ok: true, value: opened });
  });

  it('US-AB-03: starting resources drawn again lie face down again', async () => {
    const { service } = launch(15);
    await startFour(service);
    await draw(service, 23);
    const index = 22;
    const step = defined(stored()?.generation.steps[index], 'resources').step;
    if (step.kind !== 'starting-resources') throw new Error(step.kind);
    await value(service.openResources(step.personId, [0, 1]));

    const repeated = await value(service.repeatStep(index));

    expect(repeated.generation.gameState.openedResources).toEqual([]);
  });

  it('throws for a person without starting resources drawn and for a card that does not exist', async () => {
    const { service } = launch(15);
    await startFour(service);
    await draw(service, 23);
    const step = defined(stored()?.generation.steps[22], 'resources').step;
    if (step.kind !== 'starting-resources') throw new Error(step.kind);
    const other = defined(
      CATAN_TEST_PERSONS.find((personId) => personId !== step.personId),
      'other person',
    );

    await expect(service.openResources(other, [0])).rejects.toThrow(InvariantError);
    await expect(service.openResources(step.personId, [2])).rejects.toThrow(InvariantError);
  });
});

describe('US-PL-05 Skip the placement (service)', () => {
  it('AK-2: confirms the last spin and skips; the starting resources start without a result', async () => {
    const { service } = launch(14);
    const started = await startFour(service);
    expect(await service.skipPlacement()).toEqual({ ok: false, error: 'placement-not-skippable' });
    expect(stored()).toEqual(started);
    await draw(service, 6);

    const skipped = await value(service.skipPlacement());
    expect(stored()).toEqual(skipped);
    expect(
      skipped.generation.steps.slice(5).map(({ step, status }) => `${step.kind} ${status}`),
    ).toEqual(['order-spin confirmed']);

    const finished = await finish(service, 4);
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
    await draw(service, 4);

    await service.endWithoutResult();

    expect(stored()).toBeUndefined();
    expect(await service.current()).toEqual({ ok: true, value: null });
    expect(await service.isSessionActive()).toBe(false);
    expect(await service.draw(shown())).toEqual({ ok: false, error: 'no-session' });
    expect(await service.openResources(defined(CATAN_TEST_PERSONS[0], 'person'), [0])).toEqual({
      ok: false,
      error: 'no-session',
    });
  });

  it('AK-3: can end a match that is already running', async () => {
    const { service } = launch();
    await startFour(service);
    await finish(service, 26);

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
    await finish(service, 26);

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

describe('FA-AB-07 and US-IN-04 Animation played once (service)', () => {
  it('stores that the animation of the step drawn last has played; after a restart it stays so', async () => {
    const first = launch(17);
    await startFour(first.service);
    const drawn = await value(first.service.draw(null));
    expect(drawn.generation.steps[0]?.isStaged).toBe(false);

    const staged = await value(first.service.markStaged(0));

    expect(staged.generation.steps[0]).toMatchObject({ status: 'revealed', isStaged: true });
    expect(await launch(18).service.current()).toEqual({ ok: true, value: staged });
  });

  it('a step drawn after it is not staged yet', async () => {
    const { service } = launch(17);
    await startFour(service);
    await value(service.draw(null));
    await value(service.markStaged(0));

    const next = await value(service.draw(0));

    expect(next.generation.steps.map((record) => record.isStaged)).toEqual([true, false]);
  });

  it('reports a step that no longer exists, e.g. repeated meanwhile', async () => {
    const { service } = launch(17);
    await startFour(service);
    await value(service.draw(null));
    await value(service.repeatStep(0));

    expect(await service.markStaged(0)).toEqual({ ok: false, error: 'no-such-step' });
  });
});
