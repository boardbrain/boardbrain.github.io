import type { GroupId, Match, MatchId } from '@/core/model';
import { sortMatches } from '@/core/results';
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
 * One match, or `null` if there is no such match (US-ER-04 AK-2).
 */
export async function readMatch(db: BoardBrainDb, id: MatchId): Promise<Match | null> {
  return (await db.matches.get(id)) ?? null;
}
