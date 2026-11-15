import type { Match } from '@/core/model';

/**
 * What the order of matches looks at (Specification 3.7).
 */
export type MatchMoment = Pick<Match, 'id' | 'date' | 'time' | 'recordedAt'>;

function compareText(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

/**
 * Compares two matches in chronological order (Specification 3.7, FA-ER-08): by date, within a
 * day by time; matches without a time follow those with a time, among each other in the order
 * of recording. The id breaks a remaining tie, so the order never depends on how the matches
 * were read. Lists show the newest first; series and charts count from the oldest.
 */
export function compareMatches(a: MatchMoment, b: MatchMoment): number {
  const byDate = compareText(a.date, b.date);
  if (byDate !== 0) {
    return byDate;
  }
  if (a.time !== b.time) {
    if (a.time === undefined) {
      return 1;
    }
    if (b.time === undefined) {
      return -1;
    }
    return compareText(a.time, b.time);
  }
  return compareText(a.recordedAt, b.recordedAt) || compareText(a.id, b.id);
}

/**
 * The matches in chronological order, oldest first (Specification 3.7).
 */
export function sortMatches<M extends MatchMoment>(matches: readonly M[]): M[] {
  return [...matches].sort(compareMatches);
}
