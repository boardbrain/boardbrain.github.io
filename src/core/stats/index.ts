/**
 * Public interface of the module `core/stats`: filter, key figures, winning streaks, drought,
 * places, ranking, records and favourite games of a group (FA-ST-*, Specification 3.8).
 *
 * Other modules import only through this file (Architecture 4.3). The statistics know no game:
 * what a game counts comes as `StatsGame` (ADR-028).
 */
export {
  ALL_TIME,
  isInPeriod,
  lastMonthsStart,
  periodBounds,
  periodRangeError,
  type PeriodRangeError,
  type StatsPeriod,
} from './period';
export {
  criterionValue,
  leadersOf,
  podiumOf,
  rankingCriteria,
  rankPersons,
  winsPodiumOf,
  type PodiumStep,
  type RankedPerson,
  type RankingCriterion,
} from './ranking';
export {
  QUICK_YEAR_COUNT,
  selectMatches,
  type GameMatchCount,
  type StatsRequest,
  type StatsSelection,
} from './selection';
export {
  computeStatistics,
  RECORD_RUN_MIN,
  FAVORITE_GAME_MIN_MATCHES,
  FORM_LENGTH,
  matchesPerGame,
  SHOWN_STREAK_MIN,
  type FavoriteGame,
  type FormEntry,
  type FormResult,
  type GroupStatistics,
  type MatchRecord,
  type MatchRun,
  type PersonStatistics,
  type RunRecord,
  type StatsGame,
  type StatsRecords,
} from './statistics';
