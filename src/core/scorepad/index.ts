/**
 * Public interface of the module `core/scorepad`: the score pad that writes down the points of a
 * custom game round by round (FA-NB-*, Architecture 10.5). Standings, places, the target and
 * "Selbst rechnen" are calculated here; the places follow the rules of `core/results`.
 *
 * Other modules import only through this file (Architecture 4.3).
 */
export {
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
  SCORE_PAD_ID,
  SCORE_PAD_SCHEMA_VERSION,
  standingsOf,
  totalsOf,
  withChanges,
  type EntryInvalidError,
  type ScorePad,
  type ScorePadCalculation,
  type ScorePadSettings,
  type ScoreRound,
} from './scorePad';
