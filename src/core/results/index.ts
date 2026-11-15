/**
 * Public interface of the module `core/results`: result rules, plausibility warnings, places
 * from victory points, sorting of matches (FA-ER-*, Specification 3.6, 3.7).
 *
 * Other modules import only through this file (Architecture 4.3). The rules know no game: what a
 * game allows comes as `ResultRules` from its module (ADR-028).
 */
export {
  durationMinutesOf,
  placesOf,
  plausibilityWarnings,
  type PlausibilityWarning,
  type ResultOutcome,
} from './evaluation';
export { compareMatches, sortMatches, type MatchMoment } from './order';
export {
  checkResult,
  resultErrors,
  type ResultContent,
  type ResultError,
  type ResultInput,
  type ResultRules,
} from './rules';
