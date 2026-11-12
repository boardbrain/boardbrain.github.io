/**
 * Public interface of the module `core/generation`: steps, flow control, repetition and session model (FA-AB-*).
 *
 * Other modules import only through this file (Architecture 4.3). The flow control is
 * independent of the game: the kinds of steps and the flow of a game lie in its module
 * (ADR-028).
 */
export {
  confirmStep,
  drawNextStep,
  markStaged,
  repeatStep,
  revealedStepIndex,
  startGeneration,
  stepsDiscardedBy,
  unstagedStepIndex,
  withGameState,
  type GenerationCompleteError,
  type NoStepRevealedError,
  type NoSuchStepError,
  type StepPendingError,
} from './flow';
export { CURRENT_SESSION_ID, SESSION_SCHEMA_VERSION, type Session } from './session';
export type {
  DrawnStep,
  Generation,
  GenerationDefinition,
  GenerationState,
  StepRecord,
  StepStatus,
} from './types';
