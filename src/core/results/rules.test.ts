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
  supportsVictoryPoints: true,
  playerColors: ['red', 'blue', 'white', 'orange'],
  tracksDuration: true,
};
const CUSTOM: ResultRules = {
  editions: [],
  modes: [],
  hasSingleWinner: false,
  supportsVictoryPoints: false,
  playerColors: null,
  tracksDuration: false,
};

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

describe('US-ER-02 Record victory points', () => {
  it('AK-1: a game without victory points takes none', () => {
    expect(() =>
      checkResult({ ...CUSTOM_INPUT, victoryPoints: { [BEN]: 3 } }, TABLE, CUSTOM),
    ).toThrow(InvariantError);
  });

  it('AK-2: points for all participants or for none', () => {
    const all = { [ANNA]: 10, [BEN]: 8, [CLARA]: 0 };
    expect(checkResult({ ...CATAN_INPUT, victoryPoints: all }, TABLE, CATAN_LIKE)).toMatchObject({
      ok: true,
      value: { victoryPoints: all },
    });
    expect(
      checkResult({ ...CATAN_INPUT, victoryPoints: { [ANNA]: 10, [BEN]: 8 } }, TABLE, CATAN_LIKE),
    ).toEqual({ ok: false, error: 'victory-points-incomplete' });
  });

  it('AK-2: no point entered means no victory points', () => {
    const result = checkResult({ ...CATAN_INPUT, victoryPoints: {} }, TABLE, CATAN_LIKE);

    expect(result.ok && 'victoryPoints' in result.value).toBe(false);
  });

  it('AK-3: only whole numbers from 0', () => {
    for (const wrong of [-1, 7.5, Number.POSITIVE_INFINITY]) {
      expect(
        resultErrors(
          { ...CATAN_INPUT, victoryPoints: { [ANNA]: 10, [BEN]: wrong, [CLARA]: 4 } },
          TABLE,
          CATAN_LIKE,
        ),
      ).toEqual(['victory-points-invalid']);
    }
  });

  it('AK-2: points for someone who did not take part are a programming error', () => {
    expect(() =>
      checkResult(
        { ...CATAN_INPUT, victoryPoints: { [ANNA]: 10, [BEN]: 8, [CLARA]: 4, [STRANGER]: 2 } },
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
          victoryPoints: { [ANNA]: -1 },
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
      'victory-points-incomplete',
      'victory-points-invalid',
      'duration-invalid',
    ]);
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
