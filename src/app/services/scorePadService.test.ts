import { aCustomGame, aGroup, fixedClock, TEST_NOW } from '@tests/support/masterDataFakes';
import { InMemoryScorePadStore } from '@tests/support/scorePadFakes';
import { aStoredSession } from '@tests/support/sessionFakes';
import { beforeEach, describe, expect, it } from 'vitest';
import { toGameId, toGroupId, toPersonId, type Group } from '@/core/model';
import { DEFAULT_SCORE_PAD_SETTINGS, type ScoreRound } from '@/core/scorepad';
import { InvariantError, type Result } from '@/core/shared';
import { CATAN_GAME_ID } from '@/games/catan';
import { createScorePadService, type ScorePadService } from './scorePadService';

const ANNA = toPersonId('00000000-0000-4000-8000-0000000000a1');
const BEN = toPersonId('00000000-0000-4000-8000-0000000000a2');
const TABLE: Group = aGroup();
const SKYJO = aCustomGame({ name: 'Skyjo', scoring: 'lowest-wins' });
const UNO = aCustomGame({ id: toGameId('00000000-0000-4000-8000-0000000000b2'), name: 'Uno' });
const OLD = aCustomGame({
  id: toGameId('00000000-0000-4000-8000-0000000000b3'),
  name: 'Wizard',
  scoring: 'highest-wins',
  archived: true,
});
const BOUND: Group = aGroup({
  id: toGroupId('00000000-0000-4000-8000-0000000000c2'),
  name: 'Nur Uno',
  binding: { kind: 'game', gameId: UNO.id },
});

let store: InMemoryScorePadStore;
let service: ScorePadService;

function round(anna: number, ben: number): ScoreRound {
  return { [ANNA]: anna, [BEN]: ben };
}

async function value<T>(promise: Promise<Result<T, string>>): Promise<T> {
  const result = await promise;
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

async function started(): Promise<void> {
  await value(
    service.start({ gameId: SKYJO.id, groupId: TABLE.id, settings: DEFAULT_SCORE_PAD_SETTINGS }),
  );
}

beforeEach(() => {
  store = new InMemoryScorePadStore([TABLE, BOUND], [SKYJO, UNO, OLD]);
  service = createScorePadService({ store, clock: fixedClock() });
});

describe('US-NB-01 Start a score pad', () => {
  it('AK-3: "Starten" stores an empty score pad of the table and game', async () => {
    const pad = await value(
      service.start({
        gameId: SKYJO.id,
        groupId: TABLE.id,
        settings: { target: { kind: 'points', value: 100 }, calculation: 'self' },
      }),
    );
    expect(pad).toMatchObject({
      gameId: SKYJO.id,
      groupId: TABLE.id,
      participants: [ANNA, BEN],
      startedAt: TEST_NOW,
      settings: { target: { kind: 'points', value: 100 }, calculation: 'self' },
      rounds: [],
    });
    expect(store.scorePad).toEqual(pad);
  });

  it('AK-1: only an active custom game with points', async () => {
    for (const gameId of [
      UNO.id,
      OLD.id,
      CATAN_GAME_ID,
      toGameId('00000000-0000-4000-8000-00000000ffff'),
    ]) {
      expect(
        await service.start({ gameId, groupId: TABLE.id, settings: DEFAULT_SCORE_PAD_SETTINGS }),
      ).toEqual({ ok: false, error: 'game-not-eligible' });
    }
  });

  it('AK-1: only a table that can play the game', async () => {
    for (const groupId of [BOUND.id, toGroupId('00000000-0000-4000-8000-00000000ffff')]) {
      expect(
        await service.start({ gameId: SKYJO.id, groupId, settings: DEFAULT_SCORE_PAD_SETTINGS }),
      ).toEqual({ ok: false, error: 'group-not-eligible' });
    }
  });

  it('AK-4: no score pad next to a running match or another score pad (E-51)', async () => {
    store.session = aStoredSession();
    const input = { gameId: SKYJO.id, groupId: TABLE.id, settings: DEFAULT_SCORE_PAD_SETTINGS };
    expect(await service.start(input)).toEqual({ ok: false, error: 'session-active' });
    store.session = undefined;
    await started();
    expect(await service.start(input)).toEqual({ ok: false, error: 'session-active' });
  });

  it('AK-3: an invalid target is a programming error', async () => {
    await expect(
      service.start({
        gameId: SKYJO.id,
        groupId: TABLE.id,
        settings: { target: { kind: 'rounds', value: 0 }, calculation: 'app' },
      }),
    ).rejects.toThrow(InvariantError);
  });
});

describe('US-NB-02 Enter and correct rounds', () => {
  beforeEach(started);

  it('AK-3: a complete round is stored', async () => {
    const change = await value(service.addRound(0, round(12, 25)));
    expect(change.pad.rounds).toEqual([round(12, 25)]);
    expect(store.scorePad?.rounds).toEqual([round(12, 25)]);
  });

  it('AK-3: a second quick tap does not store the round twice', async () => {
    await value(service.addRound(0, round(12, 25)));
    expect(await service.addRound(0, round(12, 25))).toEqual({
      ok: false,
      error: 'round-changed',
    });
    expect(store.scorePad?.rounds).toHaveLength(1);
  });

  it('AK-5: a number beyond 99 999 is not stored', async () => {
    expect(await service.addRound(0, round(100_000, 0))).toEqual({
      ok: false,
      error: 'entry-invalid',
    });
    expect(store.scorePad?.rounds).toEqual([]);
  });

  it('AK-4: a number can be changed and a round deleted', async () => {
    await value(service.addRound(0, round(12, 25)));
    await value(service.addRound(1, round(8, 14)));
    expect((await value(service.changeEntry(0, BEN, 20))).pad.rounds).toEqual([
      round(12, 20),
      round(8, 14),
    ]);
    expect(await service.changeEntry(0, BEN, 1.5)).toEqual({ ok: false, error: 'entry-invalid' });
    expect((await value(service.deleteRound(0))).pad.rounds).toEqual([round(8, 14)]);
    expect(store.scorePad?.rounds).toEqual([round(8, 14)]);
  });

  it('AK-4: without a score pad nothing changes', async () => {
    await service.endWithoutResult();
    expect(await service.addRound(0, round(1, 2))).toEqual({ ok: false, error: 'no-score-pad' });
    expect(await service.changeEntry(0, ANNA, 1)).toEqual({ ok: false, error: 'no-score-pad' });
    expect(await service.deleteRound(0)).toEqual({ ok: false, error: 'no-score-pad' });
    expect(await service.changeSettings(DEFAULT_SCORE_PAD_SETTINGS)).toEqual({
      ok: false,
      error: 'no-score-pad',
    });
  });

  it('US-NB-01 AK-5: a score pad of unknown version is reported, not used', async () => {
    const stored = store.scorePad;
    if (stored === undefined) throw new Error('started');
    store.scorePad = { ...stored, schemaVersion: 99 };
    expect(await service.addRound(0, round(1, 2))).toEqual({
      ok: false,
      error: 'score-pad-unsupported',
    });
    await service.endWithoutResult();
    expect(store.scorePad).toBeUndefined();
  });
});

describe('US-NB-03 Target and calculation', () => {
  beforeEach(started);

  it('AK-3: with "Selbst rechnen" the new standing is typed', async () => {
    await value(service.changeSettings({ target: null, calculation: 'self' }));
    await value(service.addRound(0, round(12, 25)));
    const change = await value(service.addRound(1, round(20, 39)));
    expect(change.pad.rounds).toEqual([round(12, 25), round(8, 14)]);
  });

  it('AK-4: reaching the target is reported once', async () => {
    await value(
      service.changeSettings({ target: { kind: 'points', value: 30 }, calculation: 'app' }),
    );
    expect((await value(service.addRound(0, round(12, 25)))).isTargetReachedNow).toBe(false);
    expect((await value(service.addRound(1, round(8, 14)))).isTargetReachedNow).toBe(true);
    expect((await value(service.addRound(2, round(1, 1)))).isTargetReachedNow).toBe(false);
    expect(store.scorePad?.isTargetNoticed).toBe(true);
  });
});

describe('US-NB-04 End a score pad', () => {
  it('AK-3: "Beenden ohne Ergebnis" discards the score pad', async () => {
    await started();
    await value(service.addRound(0, round(12, 25)));
    await service.endWithoutResult();
    expect(store.scorePad).toBeUndefined();
  });
});
