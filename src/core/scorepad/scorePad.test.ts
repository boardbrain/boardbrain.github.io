import { describe, expect, it } from 'vitest';
import { toGameId, toGroupId, toPersonId, type PersonId } from '@/core/model';
import { InvariantError } from '@/core/shared';
import {
  addRound,
  changeEntry,
  createScorePad,
  DEFAULT_SCORE_PAD_SETTINGS,
  deleteRound,
  isScorePadNumber,
  isTargetReached,
  isValidTarget,
  personsAtTarget,
  placesOfStanding,
  roundOfEntries,
  SCORE_PAD_SCHEMA_VERSION,
  standingsOf,
  totalsOf,
  withChanges,
  type ScoreRound,
} from './index';

const ANNA = toPersonId('00000000-0000-4000-8000-0000000000a1');
const BEN = toPersonId('00000000-0000-4000-8000-0000000000a2');
const CLARA = toPersonId('00000000-0000-4000-8000-0000000000a3');
const TABLE: readonly PersonId[] = [ANNA, BEN, CLARA];
const SKYJO = toGameId('00000000-0000-4000-8000-0000000000c1');
const FRIDAY = toGroupId('00000000-0000-4000-8000-0000000000b1');

function round(anna: number, ben: number, clara: number): ScoreRound {
  return { [ANNA]: anna, [BEN]: ben, [CLARA]: clara };
}

const ROUNDS = [round(12, 25, -2), round(8, 14, 21)];

function newPad(): ReturnType<typeof createScorePad> {
  return createScorePad({
    gameId: SKYJO,
    groupId: FRIDAY,
    participants: TABLE,
    startedAt: '2026-11-24T19:15:00.000Z',
    settings: DEFAULT_SCORE_PAD_SETTINGS,
  });
}

function rounds(result: ReturnType<typeof addRound>): ScoreRound[] {
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

describe('US-NB-01 Start a score pad', () => {
  it('AK-3: a new score pad has no round, no target and the app adds up', () => {
    expect(newPad()).toEqual({
      id: 'current',
      schemaVersion: SCORE_PAD_SCHEMA_VERSION,
      gameId: SKYJO,
      groupId: FRIDAY,
      participants: TABLE,
      startedAt: '2026-11-24T19:15:00.000Z',
      settings: { target: null, calculation: 'app' },
      rounds: [],
      isTargetNoticed: false,
    });
  });

  it('AK-3: a score pad without participants or with an invalid target is a programming error', () => {
    const base = {
      gameId: SKYJO,
      groupId: FRIDAY,
      startedAt: '2026-11-24T19:15:00.000Z',
    };
    expect(() =>
      createScorePad({ ...base, participants: [], settings: DEFAULT_SCORE_PAD_SETTINGS }),
    ).toThrow(InvariantError);
    expect(() =>
      createScorePad({
        ...base,
        participants: TABLE,
        settings: { target: { kind: 'points', value: 0 }, calculation: 'app' },
      }),
    ).toThrow(InvariantError);
  });
});

describe('US-NB-02 Enter and correct rounds', () => {
  it('AK-1: every cell shows the standing after the round', () => {
    expect(standingsOf(ROUNDS, TABLE)).toEqual([round(12, 25, -2), round(20, 39, 19)]);
    expect(totalsOf(ROUNDS, TABLE)).toEqual(round(20, 39, 19));
    expect(totalsOf([], TABLE)).toEqual(round(0, 0, 0));
  });

  it('AK-1: places follow the standing, shared places skip the next one', () => {
    const places = placesOfStanding(round(10, 8, 10), TABLE, 'highest-wins');
    expect([...places.entries()]).toEqual([
      [ANNA, 1],
      [BEN, 3],
      [CLARA, 1],
    ]);
    const fewest = placesOfStanding(round(20, 39, 19), TABLE, 'lowest-wins');
    expect([ANNA, BEN, CLARA].map((personId) => fewest.get(personId))).toEqual([2, 3, 1]);
  });

  it('AK-3: a complete round is added with the points as typed', () => {
    expect(rounds(addRound(ROUNDS, round(15, 30, 6), TABLE, 'app'))).toEqual([
      ...ROUNDS,
      round(15, 30, 6),
    ]);
  });

  it('AK-3: a round without a number for every participant is a programming error', () => {
    expect(() => roundOfEntries({ [ANNA]: 3 }, ROUNDS, TABLE, 'app')).toThrow(InvariantError);
  });

  it('AK-4: a number of a stored round can be changed, the standings follow', () => {
    const changed = rounds(changeEntry(ROUNDS, 0, BEN, 20, TABLE, 'app'));
    expect(changed).toEqual([round(12, 20, -2), round(8, 14, 21)]);
    expect(totalsOf(changed, TABLE)[BEN]).toBe(34);
  });

  it('AK-4: a round can be deleted, the later rounds keep their points', () => {
    expect(deleteRound(ROUNDS, 0)).toEqual([round(8, 14, 21)]);
    expect(() => deleteRound(ROUNDS, 2)).toThrow(InvariantError);
  });

  it('AK-4: changing a round or person that does not exist is a programming error', () => {
    expect(() => changeEntry(ROUNDS, 5, ANNA, 1, TABLE, 'app')).toThrow(InvariantError);
    expect(() =>
      changeEntry(ROUNDS, 0, toPersonId('00000000-0000-4000-8000-0000000000a9'), 1, TABLE, 'app'),
    ).toThrow(InvariantError);
  });

  it('AK-5: only whole numbers up to 99 999 either way, as points and as standing', () => {
    expect(isScorePadNumber(99_999)).toBe(true);
    expect(isScorePadNumber(-99_999)).toBe(true);
    expect(isScorePadNumber(100_000)).toBe(false);
    expect(isScorePadNumber(1.5)).toBe(false);
    expect(addRound(ROUNDS, round(1.5, 0, 0), TABLE, 'app')).toEqual({
      ok: false,
      error: 'entry-invalid',
    });
    // 20 + 99 999 would be a standing beyond the limit.
    expect(addRound(ROUNDS, round(99_999, 0, 0), TABLE, 'app')).toEqual({
      ok: false,
      error: 'entry-invalid',
    });
    expect(changeEntry(ROUNDS, 0, ANNA, 100_000, TABLE, 'app').ok).toBe(false);
  });
});

describe('US-NB-03 Target and calculation', () => {
  it('AK-2: a target is a whole number from 1 to 99 999', () => {
    expect(isValidTarget({ kind: 'points', value: 100 })).toBe(true);
    expect(isValidTarget({ kind: 'rounds', value: 0 })).toBe(false);
    expect(isValidTarget({ kind: 'rounds', value: 100_000 })).toBe(false);
    expect(isValidTarget({ kind: 'points', value: 2.5 })).toBe(false);
  });

  it('AK-3: with "Selbst rechnen" the new standing is typed and the difference stored', () => {
    expect(roundOfEntries(round(35, 69, 25), ROUNDS, TABLE, 'self')).toEqual(round(15, 30, 6));
    expect(rounds(addRound(ROUNDS, round(35, 69, 25), TABLE, 'self')).at(-1)).toEqual(
      round(15, 30, 6),
    );
  });

  it('AK-3: correcting a standing keeps the later standings, the next round balances', () => {
    const three = [...ROUNDS, round(15, 30, 6)];
    const changed = rounds(changeEntry(three, 1, ANNA, 22, TABLE, 'self'));
    expect(changed).toEqual([round(12, 25, -2), round(10, 14, 21), round(13, 30, 6)]);
    expect(standingsOf(changed, TABLE).map((standing) => standing[ANNA])).toEqual([12, 22, 35]);
    // The last round has no following round: only its standing changes.
    const last = rounds(changeEntry(three, 2, BEN, 70, TABLE, 'self'));
    expect(totalsOf(last, TABLE)[BEN]).toBe(70);
  });

  it('AK-4: a target in points is reached at or above it, whichever score wins', () => {
    const target = { kind: 'points', value: 39 } as const;
    expect(isTargetReached(target, ROUNDS, TABLE)).toBe(true);
    expect(personsAtTarget(target, ROUNDS, TABLE)).toEqual([BEN]);
    expect(isTargetReached({ kind: 'points', value: 40 }, ROUNDS, TABLE)).toBe(false);
    expect(personsAtTarget({ kind: 'rounds', value: 2 }, ROUNDS, TABLE)).toEqual([]);
  });

  it('AK-4: a target in rounds is reached with as many rounds, no target never', () => {
    expect(isTargetReached({ kind: 'rounds', value: 2 }, ROUNDS, TABLE)).toBe(true);
    expect(isTargetReached({ kind: 'rounds', value: 3 }, ROUNDS, TABLE)).toBe(false);
    expect(isTargetReached(null, ROUNDS, TABLE)).toBe(false);
  });

  it('AK-4: "Ziel erreicht" is noticed once, a new target anew', () => {
    const pad = {
      ...newPad(),
      settings: { target: { kind: 'rounds', value: 2 }, calculation: 'app' },
    } as const;
    const one = withChanges(pad, { rounds: [round(1, 2, 3)] });
    expect(one.isTargetReachedNow).toBe(false);
    const two = withChanges(one.pad, { rounds: [round(1, 2, 3), round(1, 2, 3)] });
    expect(two.isTargetReachedNow).toBe(true);
    expect(two.pad.isTargetNoticed).toBe(true);
    const three = withChanges(two.pad, { rounds: [...two.pad.rounds, round(1, 1, 1)] });
    expect(three.isTargetReachedNow).toBe(false);
    const changedTarget = withChanges(three.pad, {
      settings: { target: { kind: 'rounds', value: 3 }, calculation: 'app' },
    });
    expect(changedTarget.isTargetReachedNow).toBe(true);
    const noTarget = withChanges(three.pad, { settings: DEFAULT_SCORE_PAD_SETTINGS });
    expect(noTarget).toEqual({
      pad: { ...three.pad, settings: DEFAULT_SCORE_PAD_SETTINGS, isTargetNoticed: false },
      isTargetReachedNow: false,
    });
  });

  it('AK-1: an invalid target is a programming error', () => {
    expect(() =>
      withChanges(newPad(), {
        settings: { target: { kind: 'points', value: -1 }, calculation: 'app' },
      }),
    ).toThrow(InvariantError);
  });
});
