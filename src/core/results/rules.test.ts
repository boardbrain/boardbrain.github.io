import { describe, expect, it } from 'vitest';
import { parseLocalDate, toPersonId, type LocalDate, type PersonId } from '@/core/model';
import { InvariantError } from '@/core/shared';
import { checkResult, resultErrors, type ResultInput, type ResultRules } from './rules';

const ANNA = toPersonId('00000000-0000-4000-8000-0000000000a1');
const BEN = toPersonId('00000000-0000-4000-8000-0000000000a2');
const CLARA = toPersonId('00000000-0000-4000-8000-0000000000a3');
const STRANGER = toPersonId('00000000-0000-4000-8000-0000000000a9');
const TABLE: readonly PersonId[] = [ANNA, BEN, CLARA];

function localDate(value: string): LocalDate {
  const parsed = parseLocalDate(value);
  if (!parsed.ok) throw new Error(value);
  return parsed.value;
}
const TODAY = localDate('2026-11-18');

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
    expect(checkResult(CUSTOM_INPUT, TABLE, CUSTOM, TODAY)).toEqual({
      ok: true,
      value: { date: '2026-11-15', winnerIds: [BEN] },
    });
  });

  it('AK-2: with Catan the edition is required as well', () => {
    expect(
      resultErrors({ date: '2026-11-15', winnerIds: [ANNA] }, TABLE, CATAN_LIKE, TODAY),
    ).toEqual(['edition-missing']);
    expect(checkResult(CATAN_INPUT, TABLE, CATAN_LIKE, TODAY).ok).toBe(true);
  });

  it('AK-2: a date that is no calendar day and a missing winner are errors', () => {
    expect(resultErrors({ date: '2026-02-30', winnerIds: [] }, TABLE, CUSTOM, TODAY)).toEqual([
      'date-invalid',
      'winner-missing',
    ]);
  });

  it('AK-3: the time is optional and must be a time of day', () => {
    expect(checkResult({ ...CUSTOM_INPUT, time: '19:30' }, TABLE, CUSTOM, TODAY)).toEqual({
      ok: true,
      value: { date: '2026-11-15', time: '19:30', winnerIds: [BEN] },
    });
    expect(checkResult({ ...CUSTOM_INPUT, time: '25:00' }, TABLE, CUSTOM, TODAY)).toEqual({
      ok: false,
      error: 'time-invalid',
    });
  });

  it('AK-4: with another game several winners are a draw, up to all participants', () => {
    expect(checkResult({ ...CUSTOM_INPUT, winnerIds: TABLE }, TABLE, CUSTOM, TODAY)).toEqual({
      ok: true,
      value: { date: '2026-11-15', winnerIds: TABLE },
    });
  });

  it('AK-4: with Catan exactly one winner can be chosen (E-42)', () => {
    expect(
      checkResult({ ...CATAN_INPUT, winnerIds: [ANNA, BEN] }, TABLE, CATAN_LIKE, TODAY),
    ).toEqual({
      ok: false,
      error: 'winner-not-single',
    });
  });

  it('AK-5: a winner who is not a member of the group is a programming error (E-41)', () => {
    expect(() =>
      checkResult({ ...CUSTOM_INPUT, winnerIds: [STRANGER] }, TABLE, CUSTOM, TODAY),
    ).toThrow(InvariantError);
    expect(() =>
      checkResult({ ...CUSTOM_INPUT, winnerIds: [BEN, BEN] }, TABLE, CUSTOM, TODAY),
    ).toThrow(InvariantError);
  });

  it('AK-6: with Catan the mode defaults to "Standard"; notes are optional and trimmed', () => {
    expect(
      checkResult({ ...CATAN_INPUT, notes: '  Hafen vergessen ' }, TABLE, CATAN_LIKE, TODAY),
    ).toEqual({
      ok: true,
      value: {
        date: '2026-11-15',
        edition: 'base',
        mode: 'standard',
        winnerIds: [ANNA],
        notes: 'Hafen vergessen',
      },
    });
    expect(checkResult({ ...CUSTOM_INPUT, notes: '   ' }, TABLE, CUSTOM, TODAY)).toEqual({
      ok: true,
      value: { date: '2026-11-15', winnerIds: [BEN] },
    });
  });

  it('AK-6: an edition or mode the game does not have is a programming error', () => {
    expect(() =>
      checkResult({ ...CATAN_INPUT, edition: 'seafarers' }, TABLE, CATAN_LIKE, TODAY),
    ).toThrow(InvariantError);
    expect(() => checkResult({ ...CATAN_INPUT, mode: 'turbo' }, TABLE, CATAN_LIKE, TODAY)).toThrow(
      InvariantError,
    );
    expect(() => checkResult({ ...CUSTOM_INPUT, edition: 'base' }, TABLE, CUSTOM, TODAY)).toThrow(
      InvariantError,
    );
  });

  it('AK-7: with Catan the duration is whole minutes from 1', () => {
    expect(
      checkResult({ ...CATAN_INPUT, durationMinutes: 95 }, TABLE, CATAN_LIKE, TODAY),
    ).toMatchObject({
      ok: true,
      value: { durationMinutes: 95 },
    });
    for (const durationMinutes of [0, -5, 12.5, Number.NaN]) {
      expect(resultErrors({ ...CATAN_INPUT, durationMinutes }, TABLE, CATAN_LIKE, TODAY)).toEqual([
        'duration-invalid',
      ]);
    }
  });

  it('AK-8: a date in the future is an error, today and earlier days are fine', () => {
    expect(resultErrors({ ...CUSTOM_INPUT, date: '2026-11-19' }, TABLE, CUSTOM, TODAY)).toEqual([
      'date-in-future',
    ]);
    expect(resultErrors({ ...CUSTOM_INPUT, date: '2027-01-01' }, TABLE, CUSTOM, TODAY)).toEqual([
      'date-in-future',
    ]);
    for (const date of ['2026-11-18', '2026-11-17', '2025-12-31']) {
      expect(resultErrors({ ...CUSTOM_INPUT, date }, TABLE, CUSTOM, TODAY)).toEqual([]);
    }
  });

  it('AK-8: notes up to 1000 characters', () => {
    expect(
      resultErrors({ ...CUSTOM_INPUT, notes: 'x'.repeat(1000) }, TABLE, CUSTOM, TODAY),
    ).toEqual([]);
    expect(
      resultErrors({ ...CUSTOM_INPUT, notes: 'x'.repeat(1001) }, TABLE, CUSTOM, TODAY),
    ).toEqual(['notes-too-long']);
    // A character outside the basic plane counts once, as the person sees it.
    expect(
      resultErrors({ ...CUSTOM_INPUT, notes: '🎲'.repeat(1000) }, TABLE, CUSTOM, TODAY),
    ).toEqual([]);
  });

  it('AK-7: other games have no duration', () => {
    expect(() =>
      checkResult({ ...CUSTOM_INPUT, durationMinutes: 30 }, TABLE, CUSTOM, TODAY),
    ).toThrow(InvariantError);
  });
});

describe('US-ER-02 Record points', () => {
  it('AK-1: a game without points takes none', () => {
    expect(() =>
      checkResult({ ...CUSTOM_INPUT, scores: { [BEN]: 3 } }, TABLE, CUSTOM, TODAY),
    ).toThrow(InvariantError);
  });

  it('AK-1: a custom game that counts points takes them (FA-SP-07)', () => {
    const all = { [ANNA]: 40, [BEN]: 12, [CLARA]: 25 };
    expect(checkResult({ ...CUSTOM_INPUT, scores: all }, TABLE, SKYJO_LIKE, TODAY)).toEqual({
      ok: true,
      value: { date: '2026-11-15', winnerIds: [BEN], scores: all },
    });
  });

  it('AK-2: points for all participants or for none', () => {
    const all = { [ANNA]: 10, [BEN]: 8, [CLARA]: 0 };
    expect(checkResult({ ...CATAN_INPUT, scores: all }, TABLE, CATAN_LIKE, TODAY)).toMatchObject({
      ok: true,
      value: { scores: all },
    });
    expect(
      checkResult({ ...CATAN_INPUT, scores: { [ANNA]: 10, [BEN]: 8 } }, TABLE, CATAN_LIKE, TODAY),
    ).toEqual({ ok: false, error: 'scores-incomplete' });
  });

  it('AK-2: no point entered means no points', () => {
    const result = checkResult({ ...CATAN_INPUT, scores: {} }, TABLE, CATAN_LIKE, TODAY);

    expect(result.ok && 'scores' in result.value).toBe(false);
  });

  it('AK-3: with Catan only whole numbers from 0', () => {
    for (const wrong of [-1, 7.5, Number.POSITIVE_INFINITY]) {
      expect(
        resultErrors(
          { ...CATAN_INPUT, scores: { [ANNA]: 10, [BEN]: wrong, [CLARA]: 4 } },
          TABLE,
          CATAN_LIKE,
          TODAY,
        ),
      ).toEqual(['scores-invalid']);
    }
  });

  it('AK-3: with a custom game also negative whole numbers', () => {
    const negative = { [ANNA]: -3, [BEN]: -12, [CLARA]: 0 };
    expect(checkResult({ ...CUSTOM_INPUT, scores: negative }, TABLE, SKYJO_LIKE, TODAY).ok).toBe(
      true,
    );
    for (const wrong of [-1.5, Number.NEGATIVE_INFINITY, Number.NaN]) {
      expect(
        resultErrors(
          { ...CUSTOM_INPUT, scores: { [ANNA]: 3, [BEN]: wrong, [CLARA]: 4 } },
          TABLE,
          SKYJO_LIKE,
          TODAY,
        ),
      ).toEqual(['scores-invalid']);
    }
  });

  it('AK-3: points up to 99 999, below 0 down to −99 999 (US-ER-01 AK-8)', () => {
    const edge = { [ANNA]: -99_999, [BEN]: -99_999, [CLARA]: 99_999 };
    expect(
      resultErrors(
        { ...CUSTOM_INPUT, winnerIds: [ANNA, BEN], scores: edge },
        TABLE,
        SKYJO_LIKE,
        TODAY,
      ),
    ).toEqual([]);
    for (const wrong of [100_000, -100_000]) {
      expect(
        resultErrors(
          { ...CUSTOM_INPUT, scores: { [ANNA]: 3, [BEN]: wrong, [CLARA]: 4 } },
          TABLE,
          SKYJO_LIKE,
          TODAY,
        ),
      ).toEqual(['scores-invalid']);
    }
    expect(
      resultErrors(
        { ...CATAN_INPUT, scores: { [ANNA]: 100_000, [BEN]: 8, [CLARA]: 4 } },
        TABLE,
        CATAN_LIKE,
        TODAY,
      ),
    ).toEqual(['scores-invalid']);
  });

  it('AK-6: with every score the winners have the best score (E-47)', () => {
    const scores = { [ANNA]: 10, [BEN]: 8, [CLARA]: 4 };
    expect(
      resultErrors({ ...CATAN_INPUT, winnerIds: [BEN], scores }, TABLE, CATAN_LIKE, TODAY),
    ).toEqual(['winner-not-best']);
    expect(
      resultErrors({ ...CUSTOM_INPUT, winnerIds: [ANNA], scores }, TABLE, SKYJO_LIKE, TODAY),
    ).toEqual(['winner-not-best']);
    expect(
      resultErrors({ ...CUSTOM_INPUT, winnerIds: [CLARA], scores }, TABLE, SKYJO_LIKE, TODAY),
    ).toEqual([]);
  });

  it('AK-6: at a tie at the top some or all of the best may win', () => {
    const tie = { [ANNA]: 10, [BEN]: 10, [CLARA]: 4 };
    const custom = { ...CUSTOM, scoring: 'highest-wins' as const };
    for (const winnerIds of [[ANNA], [BEN], [ANNA, BEN]]) {
      expect(
        resultErrors({ ...CUSTOM_INPUT, winnerIds, scores: tie }, TABLE, custom, TODAY),
      ).toEqual([]);
    }
    expect(
      resultErrors(
        { ...CUSTOM_INPUT, winnerIds: [ANNA, CLARA], scores: tie },
        TABLE,
        custom,
        TODAY,
      ),
    ).toEqual(['winner-not-best']);
    expect(
      resultErrors({ ...CATAN_INPUT, winnerIds: [BEN], scores: tie }, TABLE, CATAN_LIKE, TODAY),
    ).toEqual([]);
  });

  it('AK-2: points for someone who did not take part are a programming error', () => {
    expect(() =>
      checkResult(
        { ...CATAN_INPUT, scores: { [ANNA]: 10, [BEN]: 8, [CLARA]: 4, [STRANGER]: 2 } },
        TABLE,
        CATAN_LIKE,
        TODAY,
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
        TODAY,
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
    expect(checkResult({ ...CUSTOM_INPUT, places: ranking }, TABLE, CUSTOM, TODAY)).toEqual({
      ok: true,
      value: { date: '2026-11-15', winnerIds: [BEN], places: ranking },
    });
    expect(checkResult({ ...CUSTOM_INPUT, places: ranking }, TABLE, SKYJO_LIKE, TODAY).ok).toBe(
      true,
    );
  });

  it('AK-1: a game without a ranking by hand takes none', () => {
    expect(() =>
      checkResult(
        { ...CATAN_INPUT, places: { [ANNA]: 1, [BEN]: 2, [CLARA]: 3 } },
        TABLE,
        CATAN_LIKE,
        TODAY,
      ),
    ).toThrow(InvariantError);
  });

  it('AK-1, AK-3: a game with exactly one winner takes a ranking with one person on place 1 (E-49)', () => {
    const catan = { ...CATAN_LIKE, supportsRanking: true };
    const ranking = { [ANNA]: 1, [BEN]: 2, [CLARA]: 2 };
    expect(checkResult({ ...CATAN_INPUT, places: ranking }, TABLE, catan, TODAY).ok).toBe(true);
    expect(
      resultErrors(
        { ...CATAN_INPUT, winnerIds: [ANNA, BEN], places: { [ANNA]: 1, [BEN]: 1, [CLARA]: 3 } },
        TABLE,
        catan,
        TODAY,
      ),
    ).toEqual(['winner-not-single']);
  });

  it('AK-2: places for all participants or for none', () => {
    expect(
      resultErrors({ ...CUSTOM_INPUT, places: { [ANNA]: 2, [BEN]: 1 } }, TABLE, CUSTOM, TODAY),
    ).toEqual(['places-incomplete']);
    const result = checkResult({ ...CUSTOM_INPUT, places: {} }, TABLE, CUSTOM, TODAY);
    expect(result.ok && 'places' in result.value).toBe(false);
  });

  it('AK-2: the same place is shared and the following places are skipped', () => {
    const shared = { [ANNA]: 1, [BEN]: 2, [CLARA]: 2 };
    expect(
      checkResult({ ...CUSTOM_INPUT, winnerIds: [ANNA], places: shared }, TABLE, CUSTOM, TODAY),
    ).toEqual({ ok: true, value: { date: '2026-11-15', winnerIds: [ANNA], places: shared } });
    const sharedFirst = { [ANNA]: 1, [BEN]: 1, [CLARA]: 3 };
    expect(
      checkResult(
        { ...CUSTOM_INPUT, winnerIds: [ANNA, BEN], places: sharedFirst },
        TABLE,
        CUSTOM,
        TODAY,
      ).ok,
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
      expect(resultErrors({ ...CUSTOM_INPUT, winnerIds, places }, TABLE, CUSTOM, TODAY)).toEqual([
        'places-invalid',
      ]);
    }
    expect(
      resultErrors({ ...CUSTOM_INPUT, places: { [ANNA]: 2, [BEN]: 1 } }, TABLE, CUSTOM, TODAY),
    ).toEqual(['places-incomplete']);
    expect(
      resultErrors({ ...CUSTOM_INPUT, places: { [ANNA]: 7, [BEN]: 1 } }, TABLE, CUSTOM, TODAY),
    ).toEqual(['places-incomplete', 'places-invalid']);
  });

  it('AK-3: the winners are exactly the persons on place 1', () => {
    expect(() =>
      checkResult({ ...CUSTOM_INPUT, winnerIds: [ANNA], places: ranking }, TABLE, CUSTOM, TODAY),
    ).toThrow(InvariantError);
    expect(() =>
      checkResult(
        { ...CUSTOM_INPUT, winnerIds: [BEN], places: { [ANNA]: 1, [BEN]: 1, [CLARA]: 3 } },
        TABLE,
        CUSTOM,
        TODAY,
      ),
    ).toThrow(InvariantError);
  });

  it('AK-4: points and a ranking by hand together are a programming error', () => {
    expect(() =>
      checkResult(
        { ...CUSTOM_INPUT, scores: { [ANNA]: 5, [BEN]: 2, [CLARA]: 9 }, places: ranking },
        TABLE,
        SKYJO_LIKE,
        TODAY,
      ),
    ).toThrow(InvariantError);
  });

  it('AK-1: places for someone who did not take part are a programming error', () => {
    expect(() =>
      checkResult({ ...CUSTOM_INPUT, places: { ...ranking, [STRANGER]: 4 } }, TABLE, CUSTOM, TODAY),
    ).toThrow(InvariantError);
  });
});

describe('US-ER-03 Catan colours in a result', () => {
  const colors = { [ANNA]: 'red', [BEN]: 'blue', [CLARA]: 'white' } as const;

  it('AK-1: stores one colour per participant', () => {
    expect(
      checkResult({ ...CATAN_INPUT, catanColors: colors }, TABLE, CATAN_LIKE, TODAY),
    ).toMatchObject({
      ok: true,
      value: { catanColors: colors },
    });
  });

  it('AK-1: colours twice, missing or for a game without colours are programming errors', () => {
    const twice = { ...colors, [CLARA]: 'red' } as const;
    const missing = { [ANNA]: 'red', [BEN]: 'blue' } as const;
    expect(() =>
      checkResult({ ...CATAN_INPUT, catanColors: twice }, TABLE, CATAN_LIKE, TODAY),
    ).toThrow(InvariantError);
    expect(() =>
      checkResult({ ...CATAN_INPUT, catanColors: missing }, TABLE, CATAN_LIKE, TODAY),
    ).toThrow(InvariantError);
    expect(() =>
      checkResult({ ...CUSTOM_INPUT, catanColors: colors }, TABLE, CUSTOM, TODAY),
    ).toThrow(InvariantError);
  });
});

describe('US-NB-04 Rounds and target of a score pad in the result', () => {
  const ROUNDS = [
    { [ANNA]: 12, [BEN]: 25, [CLARA]: -2 },
    { [ANNA]: 8, [BEN]: 14, [CLARA]: 21 },
  ];
  const FROM_PAD: ResultInput = {
    date: '2026-11-15',
    winnerIds: [CLARA],
    scores: { [ANNA]: 20, [BEN]: 39, [CLARA]: 19 },
    rounds: ROUNDS,
    target: { kind: 'points', value: 100 },
  };

  it('AK-2: rounds and target are stored with the points as their sums', () => {
    expect(checkResult(FROM_PAD, TABLE, SKYJO_LIKE, TODAY)).toEqual({
      ok: true,
      value: {
        date: '2026-11-15',
        winnerIds: [CLARA],
        scores: { [ANNA]: 20, [BEN]: 39, [CLARA]: 19 },
        rounds: ROUNDS,
        target: { kind: 'points', value: 100 },
      },
    });
  });

  it('AK-2: points that are not the sums of the rounds are a programming error', () => {
    expect(() =>
      resultErrors(
        { ...FROM_PAD, scores: { [ANNA]: 21, [BEN]: 39, [CLARA]: 19 } },
        TABLE,
        SKYJO_LIKE,
        TODAY,
      ),
    ).toThrow(InvariantError);
    const { scores: _scores, ...withoutScores } = FROM_PAD;
    expect(() => resultErrors(withoutScores, TABLE, SKYJO_LIKE, TODAY)).toThrow(InvariantError);
  });

  it('AK-2: rounds need a game with points, every participant and at least one round', () => {
    expect(() => resultErrors(FROM_PAD, TABLE, CUSTOM, TODAY)).toThrow(InvariantError);
    expect(() =>
      resultErrors({ ...FROM_PAD, rounds: [{ [ANNA]: 20, [BEN]: 39 }] }, TABLE, SKYJO_LIKE, TODAY),
    ).toThrow(InvariantError);
    expect(() =>
      resultErrors(
        { date: '2026-11-15', winnerIds: [CLARA], scores: FROM_PAD.scores ?? {}, rounds: [] },
        TABLE,
        SKYJO_LIKE,
        TODAY,
      ),
    ).toThrow(InvariantError);
  });

  it('AK-2: a target needs rounds and is a whole number from 1', () => {
    const { rounds: _rounds, ...withoutRounds } = FROM_PAD;
    expect(() => resultErrors(withoutRounds, TABLE, SKYJO_LIKE, TODAY)).toThrow(InvariantError);
    expect(() =>
      resultErrors({ ...FROM_PAD, target: { kind: 'rounds', value: 0 } }, TABLE, SKYJO_LIKE, TODAY),
    ).toThrow(InvariantError);
  });

  it('US-NB-02 AK-5: points of a round beyond 99 999 are an error', () => {
    const big = [{ [ANNA]: 100_000, [BEN]: 0, [CLARA]: 0 }];
    expect(
      resultErrors(
        {
          ...FROM_PAD,
          rounds: big,
          scores: { [ANNA]: 100_000, [BEN]: 0, [CLARA]: 0 },
          winnerIds: [BEN, CLARA],
        },
        TABLE,
        SKYJO_LIKE,
        TODAY,
      ),
    ).toEqual(['scores-invalid', 'rounds-invalid']);
  });
});
