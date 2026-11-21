import { aGroup } from '@tests/support/masterDataFakes';
import { aMatch } from '@tests/support/resultFakes';
import { createTestDb } from '@tests/support/testDatabase';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseLocalDate, toGroupId, toMatchId, type LocalDate } from '@/core/model';
import type { BoardBrainDb } from './database';
import {
  readMatch,
  readMatchesOfGroup,
  readPlayedGames,
  readScoredMatchCount,
} from './matchQueries';

let db: BoardBrainDb;

beforeEach(() => {
  db = createTestDb();
});

afterEach(() => {
  db.close();
});

function day(text: string): LocalDate {
  const date = parseLocalDate(text);
  if (!date.ok) throw new Error(text);
  return date.value;
}

describe('US-ER-04 Results of a group (queries)', () => {
  it('AK-1: reads only the matches of the group, in the order of Specification 3.7', async () => {
    const later = aMatch({
      id: toMatchId('00000000-0000-4000-8000-0000000000d1'),
      date: day('2026-11-15'),
    });
    const earlier = aMatch({
      id: toMatchId('00000000-0000-4000-8000-0000000000d2'),
      date: day('2026-11-14'),
    });
    const otherGroup = aMatch({
      id: toMatchId('00000000-0000-4000-8000-0000000000d3'),
      groupId: toGroupId('00000000-0000-4000-8000-0000000000c9'),
    });
    await db.matches.bulkAdd([later, otherGroup, earlier]);

    expect(await readMatchesOfGroup(db, aGroup().id)).toEqual([earlier, later]);
  });

  it('AK-2: reads one match, or null if there is none', async () => {
    const match = aMatch();
    await db.matches.add(match);

    expect(await readMatch(db, match.id)).toEqual(match);
    expect(await readMatch(db, toMatchId('00000000-0000-4000-8000-0000000000d9'))).toBeNull();
  });
});

describe('US-SP-01 played games over all tables (query)', () => {
  it('counts the matches of every game and keeps its latest day', async () => {
    await db.matches.bulkAdd([
      aMatch({ id: toMatchId('00000000-0000-4000-8000-0000000000d1'), date: day('2026-11-15') }),
      aMatch({
        id: toMatchId('00000000-0000-4000-8000-0000000000d2'),
        groupId: toGroupId('00000000-0000-4000-8000-0000000000c9'),
        date: day('2026-11-17'),
      }),
    ]);

    expect([...(await readPlayedGames(db)).values()]).toEqual([
      { matches: 2, lastDate: '2026-11-17' },
    ]);
  });
});

describe('US-VW-07 AK-4 results with points (query)', () => {
  it('counts only the results of the game that have points', async () => {
    const game = aMatch().gameId;
    await db.matches.bulkAdd([
      aMatch({ id: toMatchId('00000000-0000-4000-8000-0000000000d1') }),
      aMatch({
        id: toMatchId('00000000-0000-4000-8000-0000000000d2'),
        scores: { [aGroup().members[0]?.personId ?? '']: 3 },
      }),
    ]);

    expect(await readScoredMatchCount(db, game)).toBe(1);
  });
});
