import type { StoredSession } from '@/app/ports';
import { confirmStep, revealedStepIndex } from '@/core/generation';
import type { PersonId } from '@/core/model';
import { CATAN_GENERATION, canSkipCatanPlacement, catanPlacementOrder } from '@/games/catan';

/**
 * Index of the step the flow shows: the one waiting for confirmation, otherwise the newest;
 * `null` without any step.
 */
export function shownStepIndex(session: StoredSession): number | null {
  const { steps } = session.generation;
  return revealedStepIndex(session.generation) ?? (steps.length > 0 ? steps.length - 1 : null);
}

/**
 * What the forward button does on the step shown (US-AB-02 AK-1): "Losen" draws the next step,
 * "Zur Übersicht" follows the last one. "Blättern" comes with the look back (I2-D).
 */
export function forwardAction(session: StoredSession): 'draw' | 'overview' {
  return CATAN_GENERATION.isComplete(session.setup, session.generation) ? 'overview' : 'draw';
}

/**
 * Whether "Platzierung überspringen" is offered (US-PL-05 AK-1): on the last spin of the order,
 * as long as no building is placed.
 */
export function canOfferSkip(session: StoredSession): boolean {
  const confirmed = confirmStep(CATAN_GENERATION, session.setup, session.generation);
  return confirmed.ok && canSkipCatanPlacement(session.setup, confirmed.value);
}

/**
 * The placement order, once it stands; without an order the seats of the table (FA-LS-07,
 * US-SR-01 AK-1).
 */
export function orderOrSeats(session: StoredSession): readonly PersonId[] {
  const steps = session.generation.steps.map((record) => record.step);
  return catanPlacementOrder(session.setup, steps) ?? session.setup.participants;
}
