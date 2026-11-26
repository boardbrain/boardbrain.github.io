import type { GameId, GroupId, Match, MatchId } from '@/core/model';
import { playedGames, sortMatches, type PlayedGame } from '@/core/results';
import type { BoardBrainDb } from './database';

/**
 * All matches of a group in chronological order, oldest first (Specification 3.7); lists show
 * them the other way round (US-ER-04 AK-1). Read through the index `groupId`.
 */
export async function readMatchesOfGroup(
  db: BoardBrainDb,
  groupId: GroupId,
): Promise<readonly Match[]> {
  return sortMatches(await db.matches.where('groupId').equals(groupId).toArray());
}

/**
 * All matches of all groups, grouped by group, each in chronological order (Specification 3.7);
 * for the table cards of the statistics (US-ST-01 AK-7).
 */
export async function readMatchesByGroup(
  db: BoardBrainDb,
): Promise<ReadonlyMap<GroupId, readonly Match[]>> {
  const byGroup = new Map<GroupId, Match[]>();
  for (const match of sortMatches(await db.matches.toArray())) {
    const list = byGroup.get(match.groupId) ?? [];
    list.push(match);
    byGroup.set(match.groupId, list);
  }
  return byGroup;
}

/**
 * One match, or `null` if there is no such match (US-ER-04 AK-2).
 */
export async function readMatch(db: BoardBrainDb, id: MatchId): Promise<Match | null> {
  return (await db.matches.get(id)) ?? null;
}

/**
 * Number of matches and the latest day of every played game, over all tables (design I3-B).
 */
export async function readPlayedGames(db: BoardBrainDb): Promise<ReadonlyMap<GameId, PlayedGame>> {
  return playedGames(await db.matches.toArray());
}

/**
 * How many results of a game have points (US-VW-07 AK-3, AK-4): they keep "Keine" locked and make
 * a change of the direction ask first.
 */
export async function readScoredMatchCount(db: BoardBrainDb, gameId: GameId): Promise<number> {
  return db.matches
    .where('gameId')
    .equals(gameId)
    .filter((match) => match.scores !== undefined)
    .count();
}
