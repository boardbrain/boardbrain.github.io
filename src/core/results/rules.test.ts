import { describe, expect, it } from 'vitest';
import { toPersonId, type PersonId } from '@/core/model';
import { InvariantError } from '@/core/shared';
import { checkResult, resultErrors, type ResultInput, type ResultRules } from './rules';

const ANNA = toPersonId('00000000-0000-4000-8000-0000000000a1');
const BEN = toPersonId('00000000-0000-4000-8000-0000000000a2');
const CLARA = toPersonId('00000000-0000-4000-8000-0000000000a3');
const STRANGER = toPersonId('00000000-0000-4000-8000-0000000000a9');
const TABLE: readonly PersonId[] = [ANNA, BEN, CLARA];

// What the Catan module tells; the rules themselves know no game (ADR-028).
const CATAN_LIKE: ResultRules = {
  editions: ['base', 'cities-and-knights'],
  modes: ['standard'],
  hasSingleWinner: true,
  scoring: 'highest-wins',
  allowsNegativeScores: false,
  supportsRanking: false,
  playerColors: ['red', 'blue', 'white', 'orange'],
  tracksDuration: true,
};
// A custom game without points (FA-SP-07: setting "Keine") and one where the fewest points win.
const CUSTOM: ResultRules = {
  editions: [],
  modes: [],
  hasSingleWinner: false,
  scoring: null,
  allowsNegativeScores: true,
  supportsRanking: true,
  playerColors: null,
  tracksDuration: false,
};
const SKYJO_LIKE: ResultRules = { ...CUSTOM, scoring: 'lowest-wins' };

const CATAN_INPUT: ResultInput = { date: '2026-11-15', edition: 'base', winnerIds: [ANNA] };
const CUSTOM_INPUT: ResultInput = { date: '2026-11-15', winnerIds: [BEN] };

describe('US-ER-01 Record a result', () => {
  it('AK-2: date and winner are enough for a custom game', () => {
    expect(checkResult(CUSTOM_INPUT, TABLE, CUSTOM)).toEqual({
      ok: true,
      value: { date: '2026-11-15', winnerIds: [BEN] },
    });
  });

  it('AK-2: with Catan the edition is required as well', () => {
    expect(resultErrors({ date: '2026-11-15', winnerIds: [ANNA] }, TABLE, CATAN_LIKE)).toEqual([
      'edition-missing',
    ]);
    expect(checkResult(CATAN_INPUT, TABLE, CATAN_LIKE).ok).toBe(true);
  });

  it('AK-2: a date that is no calendar day and a missing winner are errors', () => {
    expect(resultErrors({ date: '2026-02-30', winnerIds: [] }, TABLE, CUSTOM)).toEqual([
      'date-invalid',
      'winner-missing',
    ]);
  });

  it('AK-3: the time is optional and must be a time of day', () => {
    expect(checkResult({ ...CUSTOM_INPUT, time: '19:30' }, TABLE, CUSTOM)).toEqual({
      ok: true,
      value: { date: '2026-11-15', time: '19:30', winnerIds: [BEN] },
    });
    expect(checkResult({ ...CUSTOM_INPUT, time: '25:00' }, TABLE, CUSTOM)).toEqual({
      ok: false,
      error: 'time-invalid',
    });
  });

  it('AK-4: with another game several winners are a draw, up to all participants', () => {
    expect(checkResult({ ...CUSTOM_INPUT, winnerIds: TABLE }, TABLE, CUSTOM)).toEqual({
      ok: true,
      value: { date: '2026-11-15', winnerIds: TABLE },
    });
  });

  it('AK-4: with Catan exactly one winner can be chosen (E-42)', () => {
    expect(checkResult({ ...CATAN_INPUT, winnerIds: [ANNA, BEN] }, TABLE, CATAN_LIKE)).toEqual({
      ok: false,
      error: 'winner-not-single',
    });
  });

  it('AK-5: a winner who is not a member of the group is a programming error (E-41)', () => {
    expect(() => checkResult({ ...CUSTOM_INPUT, winnerIds: [STRANGER] }, TABLE, CUSTOM)).toThrow(
      InvariantError,
    );
    expect(() => checkResult({ ...CUSTOM_INPUT, winnerIds: [BEN, BEN] }, TABLE, CUSTOM)).toThrow(
      InvariantError,
    );
  });

  it('AK-6: with Catan the mode defaults to "Standard"; notes are optional and trimmed', () => {
    expect(checkResult({ ...CATAN_INPUT, notes: '  Hafen vergessen ' }, TABLE, CATAN_LIKE)).toEqual(
      {
        ok: true,
        value: {
          date: '2026-11-15',
          edition: 'base',
          mode: 'standard',
          winnerIds: [ANNA],
          notes: 'Hafen vergessen',
        },
      },
    );
    expect(checkResult({ ...CUSTOM_INPUT, notes: '   ' }, TABLE, CUSTOM)).toEqual({
      ok: true,
      value: { date: '2026-11-15', winnerIds: [BEN] },
    });
  });

  it('AK-6: an edition or mode the game does not have is a programming error', () => {
    expect(() => checkResult({ ...CATAN_INPUT, edition: 'seafarers' }, TABLE, CATAN_LIKE)).toThrow(
      InvariantError,
    );
    expect(() => checkResult({ ...CATAN_INPUT, mode: 'turbo' }, TABLE, CATAN_LIKE)).toThrow(
      InvariantError,
    );
    expect(() => checkResult({ ...CUSTOM_INPUT, edition: 'base' }, TABLE, CUSTOM)).toThrow(
      InvariantError,
    );
  });

  it('AK-7: with Catan the duration is whole minutes from 1', () => {
    expect(checkResult({ ...CATAN_INPUT, durationMinutes: 95 }, TABLE, CATAN_LIKE)).toMatchObject({
      ok: true,
      value: { durationMinutes: 95 },
    });
    for (const durationMinutes of [0, -5, 12.5, Number.NaN]) {
      expect(resultErrors({ ...CATAN_INPUT, durationMinutes }, TABLE, CATAN_LIKE)).toEqual([
        'duration-invalid',
      ]);
    }
  });

  it('AK-7: other games have no duration', () => {
    expect(() => checkResult({ ...CUSTOM_INPUT, durationMinutes: 30 }, TABLE, CUSTOM)).toThrow(
      InvariantError,
    );
  });
});

describe('US-ER-02 Record points', () => {
  it('AK-1: a game without points takes none', () => {
    expect(() => checkResult({ ...CUSTOM_INPUT, scores: { [BEN]: 3 } }, TABLE, CUSTOM)).toThrow(
      InvariantError,
    );
  });

  it('AK-1: a custom game that counts points takes them (FA-SP-07)', () => {
    const all = { [ANNA]: 40, [BEN]: 12, [CLARA]: 25 };
    expect(checkResult({ ...CUSTOM_INPUT, scores: all }, TABLE, SKYJO_LIKE)).toEqual({
      ok: true,
      value: { date: '2026-11-15', winnerIds: [BEN], scores: all },
    });
  });

  it('AK-2: points for all participants or for none', () => {
    const all = { [ANNA]: 10, [BEN]: 8, [CLARA]: 0 };
    expect(checkResult({ ...CATAN_INPUT, scores: all }, TABLE, CATAN_LIKE)).toMatchObject({
      ok: true,
      value: { scores: all },
    });
    expect(
      checkResult({ ...CATAN_INPUT, scores: { [ANNA]: 10, [BEN]: 8 } }, TABLE, CATAN_LIKE),
    ).toEqual({ ok: false, error: 'scores-incomplete' });
  });

  it('AK-2: no point entered means no points', () => {
    const result = checkResult({ ...CATAN_INPUT, scores: {} }, TABLE, CATAN_LIKE);

    expect(result.ok && 'scores' in result.value).toBe(false);
  });

  it('AK-3: with Catan only whole numbers from 0', () => {
    for (const wrong of [-1, 7.5, Number.POSITIVE_INFINITY]) {
      expect(
        resultErrors(
          { ...CATAN_INPUT, scores: { [ANNA]: 10, [BEN]: wrong, [CLARA]: 4 } },
          TABLE,
          CATAN_LIKE,
        ),
      ).toEqual(['scores-invalid']);
    }
  });

  it('AK-3: with a custom game also negative whole numbers', () => {
    const negative = { [ANNA]: -3, [BEN]: -12, [CLARA]: 0 };
    expect(checkResult({ ...CUSTOM_INPUT, scores: negative }, TABLE, SKYJO_LIKE).ok).toBe(true);
    for (const wrong of [-1.5, Number.NEGATIVE_INFINITY, Number.NaN]) {
      expect(
        resultErrors(
          { ...CUSTOM_INPUT, scores: { [ANNA]: 3, [BEN]: wrong, [CLARA]: 4 } },
          TABLE,
          SKYJO_LIKE,
        ),
      ).toEqual(['scores-invalid']);
    }
  });

  it('AK-2: points for someone who did not take part are a programming error', () => {
    expect(() =>
      checkResult(
        { ...CATAN_INPUT, scores: { [ANNA]: 10, [BEN]: 8, [CLARA]: 4, [STRANGER]: 2 } },
        TABLE,
        CATAN_LIKE,
      ),
    ).toThrow(InvariantError);
  });

  it('lists every error at once, in the order of the form', () => {
    expect(
      resultErrors(
        {
          date: '',
          time: 'abends',
          winnerIds: [ANNA, BEN],
          scores: { [ANNA]: -1 },
          durationMinutes: 0,
        },
        TABLE,
        CATAN_LIKE,
      ),
    ).toEqual([
      'date-invalid',
      'time-invalid',
      'edition-missing',
      'winner-not-single',
      'scores-incomplete',
      'scores-invalid',
      'duration-invalid',
    ]);
  });
});

describe('US-ER-06 Record a ranking', () => {
  const ranking = { [ANNA]: 2, [BEN]: 1, [CLARA]: 3 };

  it('AK-1: a custom game takes a ranking by hand, also if it counts points', () => {
    expect(checkResult({ ...CUSTOM_INPUT, places: ranking }, TABLE, CUSTOM)).toEqual({
      ok: true,
      value: { date: '2026-11-15', winnerIds: [BEN], places: ranking },
    });
    expect(checkResult({ ...CUSTOM_INPUT, places: ranking }, TABLE, SKYJO_LIKE).ok).toBe(true);
  });

  it('AK-1: Catan takes no ranking by hand (E-42)', () => {
    expect(() =>
      checkResult(
        { ...CATAN_INPUT, places: { [ANNA]: 1, [BEN]: 2, [CLARA]: 3 } },
        TABLE,
        CATAN_LIKE,
      ),
    ).toThrow(InvariantError);
  });

  it('AK-2: places for all participants or for none', () => {
    expect(
      resultErrors({ ...CUSTOM_INPUT, places: { [ANNA]: 2, [BEN]: 1 } }, TABLE, CUSTOM),
    ).toEqual(['places-incomplete']);
    const result = checkResult({ ...CUSTOM_INPUT, places: {} }, TABLE, CUSTOM);
    expect(result.ok && 'places' in result.value).toBe(false);
  });

  it('AK-2: the same place is shared and the following places are skipped', () => {
    const shared = { [ANNA]: 1, [BEN]: 2, [CLARA]: 2 };
    expect(
      checkResult({ ...CUSTOM_INPUT, winnerIds: [ANNA], places: shared }, TABLE, CUSTOM),
    ).toEqual({ ok: true, value: { date: '2026-11-15', winnerIds: [ANNA], places: shared } });
    const sharedFirst = { [ANNA]: 1, [BEN]: 1, [CLARA]: 3 };
    expect(
      checkResult({ ...CUSTOM_INPUT, winnerIds: [ANNA, BEN], places: sharedFirst }, TABLE, CUSTOM)
        .ok,
    ).toBe(true);
  });

  it('AK-2: places that form no ranking are errors', () => {
    const wrong = [
      { [ANNA]: 1, [BEN]: 1, [CLARA]: 2 },
      { [ANNA]: 1, [BEN]: 3, [CLARA]: 3 },
      { [ANNA]: 1, [BEN]: 2, [CLARA]: 4 },
      { [ANNA]: 1, [BEN]: 2.5, [CLARA]: 3 },
      { [ANNA]: 1, [BEN]: 0, [CLARA]: 2 },
    ];
    for (const places of wrong) {
      const winnerIds = TABLE.filter((personId) => places[personId] === 1);
      expect(resultErrors({ ...CUSTOM_INPUT, winnerIds, places }, TABLE, CUSTOM)).toEqual([
        'places-invalid',
      ]);
    }
    expect(
      resultErrors({ ...CUSTOM_INPUT, places: { [ANNA]: 2, [BEN]: 1 } }, TABLE, CUSTOM),
    ).toEqual(['places-incomplete']);
    expect(
      resultErrors({ ...CUSTOM_INPUT, places: { [ANNA]: 7, [BEN]: 1 } }, TABLE, CUSTOM),
    ).toEqual(['places-incomplete', 'places-invalid']);
  });

  it('AK-3: the winners are exactly the persons on place 1', () => {
    expect(() =>
      checkResult({ ...CUSTOM_INPUT, winnerIds: [ANNA], places: ranking }, TABLE, CUSTOM),
    ).toThrow(InvariantError);
    expect(() =>
      checkResult(
        { ...CUSTOM_INPUT, winnerIds: [BEN], places: { [ANNA]: 1, [BEN]: 1, [CLARA]: 3 } },
        TABLE,
        CUSTOM,
      ),
    ).toThrow(InvariantError);
  });

  it('AK-4: points and a ranking by hand together are a programming error', () => {
    expect(() =>
      checkResult(
        { ...CUSTOM_INPUT, scores: { [ANNA]: 5, [BEN]: 2, [CLARA]: 9 }, places: ranking },
        TABLE,
        SKYJO_LIKE,
      ),
    ).toThrow(InvariantError);
  });

  it('AK-1: places for someone who did not take part are a programming error', () => {
    expect(() =>
      checkResult({ ...CUSTOM_INPUT, places: { ...ranking, [STRANGER]: 4 } }, TABLE, CUSTOM),
    ).toThrow(InvariantError);
  });
});

describe('US-ER-03 Catan colours in a result', () => {
  const colors = { [ANNA]: 'red', [BEN]: 'blue', [CLARA]: 'white' } as const;

  it('AK-1: stores one colour per participant', () => {
    expect(checkResult({ ...CATAN_INPUT, catanColors: colors }, TABLE, CATAN_LIKE)).toMatchObject({
      ok: true,
      value: { catanColors: colors },
    });
  });

  it('AK-1: colours twice, missing or for a game without colours are programming errors', () => {
    const twice = { ...colors, [CLARA]: 'red' } as const;
    const missing = { [ANNA]: 'red', [BEN]: 'blue' } as const;
    expect(() => checkResult({ ...CATAN_INPUT, catanColors: twice }, TABLE, CATAN_LIKE)).toThrow(
      InvariantError,
    );
    expect(() => checkResult({ ...CATAN_INPUT, catanColors: missing }, TABLE, CATAN_LIKE)).toThrow(
      InvariantError,
    );
    expect(() => checkResult({ ...CUSTOM_INPUT, catanColors: colors }, TABLE, CUSTOM)).toThrow(
      InvariantError,
    );
  });
});
