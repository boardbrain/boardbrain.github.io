import type { StoredSession } from '@/app/ports';
import { revealedStepIndex } from '@/core/generation';
import type { PersonId } from '@/core/model';
import {
  canSkipCatanPlacement,
  catanNextSlot,
  catanOpenedResources,
  catanPlacementOrder,
  type CatanSlot,
  type CatanStep,
} from '@/games/catan';

/**
 * What the flow `#/partie` shows (design I2-D): a step with its stored result, or the next step
 * without a result before "Losen" (US-AB-02 AK-3, E-35).
 */
export type FlowPage =
  | { readonly kind: 'step'; readonly index: number }
  | { readonly kind: 'pending'; readonly slot: CatanSlot; readonly at: number };

/**
 * What the forward button does (US-AB-02 AK-1, US-AB-04 AK-4, US-SR-01 AK-6): "Losen" draws,
 * "Weiter" confirms and leads to the next view, "Zur Übersicht" confirms the last step,
 * "Blättern" goes one step forward without drawing, "Alle umdrehen" turns over the starting
 * resources.
 */
export type ForwardAction = 'draw' | 'next' | 'overview' | 'browse' | 'turn-all';

/**
 * The current page of the flow: the step waiting for confirmation, otherwise the next missing
 * step without a result; `null` once the match is running.
 */
export function currentPage(session: StoredSession): FlowPage | null {
  const revealed = revealedStepIndex(session.generation);
  if (revealed !== undefined) {
    return { kind: 'step', index: revealed };
  }
  const next = catanNextSlot(session.setup, session.generation);
  return next === null ? null : { kind: 'pending', ...next };
}

/**
 * The page for the address `#/partie?schritt=N` (US-AB-04 AK-3): step N in the look back, or the
 * current page without a valid N or once N is the current step.
 */
export function pageAt(session: StoredSession, lookBack: number | null): FlowPage | null {
  const current = currentPage(session);
  if (
    lookBack === null ||
    !Number.isInteger(lookBack) ||
    lookBack < 0 ||
    lookBack >= lastReachable(session)
  ) {
    return current;
  }
  return { kind: 'step', index: shownRange(session, lookBack).start };
}

/**
 * The steps a page of step `index` shows (PO 10.11.2026). Normally just this step: a look back
 * shows the match as it was right after it. After a repetition, though, the later steps are
 * kept, not drawn again: a view with several steps (the order, the placement) then shows all
 * its kept steps at once, so they neither vanish nor seem to be drawn again one by one.
 */
export function shownRange(
  session: StoredSession,
  index: number,
): { readonly start: number; readonly end: number } {
  const revealed = revealedStepIndex(session.generation);
  const steps = session.generation.steps;
  const kind = steps[index]?.step.kind;
  if (revealed === undefined || index < revealed || kind === undefined) {
    return { start: index, end: index };
  }
  // A missing step lies between two kept ones where it would be inserted.
  const missingAt = catanNextSlot(session.setup, session.generation)?.at;
  const sameView = (other: number): boolean => {
    const otherKind = steps[other]?.step.kind;
    return otherKind !== undefined && isSameView(kind, otherKind);
  };
  let start = index;
  while (start - 1 > revealed && start !== missingAt && sameView(start - 1)) {
    start--;
  }
  let end = index;
  while (end + 1 !== missingAt && sameView(end + 1)) {
    end++;
  }
  return { start, end };
}

/**
 * Whether the page shows a step kept from before a repetition, together with the rest of its
 * view: it marks no piece as new and offers no "Wiederholen" (the overview does).
 */
export function isKeptView(session: StoredSession, page: FlowPage): boolean {
  const revealed = revealedStepIndex(session.generation);
  return page.kind === 'step' && revealed !== undefined && page.index > revealed;
}

// Steps up to this index can be looked at; with a step waiting without a result, only those
// before it (the later ones are reached again after drawing it).
function lastReachable(session: StoredSession): number {
  const current = currentPage(session);
  return current?.kind === 'pending' ? current.at : session.generation.steps.length;
}

/**
 * Whether the page is a look back at an earlier step (US-AB-04 AK-3): it shows the note
 * "Rückblick". The current page is none, and neither is the newest step while an earlier,
 * repeated step waits for confirmation (I2-D: browsing ends there).
 */
export function isLookBack(session: StoredSession, page: FlowPage): boolean {
  if (page.kind === 'pending') {
    return false;
  }
  const revealed = revealedStepIndex(session.generation);
  if (revealed === undefined) {
    return true;
  }
  return page.index !== revealed && page.index !== session.generation.steps.length - 1;
}

/**
 * Where the note "Rückblick" leads (PO 10.11.2026): back to the current step, or, on a kept view
 * after a repetition with nothing left to draw (a repetition from the overview), on to the
 * overview, so browsing never leads backwards.
 */
export function lookBackTarget(session: StoredSession, page: FlowPage): 'current' | 'overview' {
  return isKeptView(session, page) && catanNextSlot(session.setup, session.generation) === null
    ? 'overview'
    : 'current';
}

/**
 * The page "Zurück" leads to (US-AB-04 AK-3), or `null` on the first step: there is no back
 * button there. Kept views after a repetition are passed as a whole (`shownRange`).
 */
export function previousPage(session: StoredSession, page: FlowPage): FlowPage | null {
  const index = page.kind === 'pending' ? page.at - 1 : shownRange(session, page.index).start - 1;
  return index >= 0 ? { kind: 'step', index: shownRange(session, index).start } : null;
}

/**
 * The page "Blättern" leads to (US-AB-04 AK-4): one step forward, at the end the current page.
 */
export function nextPage(session: StoredSession, page: FlowPage): FlowPage | null {
  if (page.kind === 'pending') {
    return null;
  }
  const target = shownRange(session, page.index).end + 1;
  const revealed = revealedStepIndex(session.generation);
  return target >= lastReachable(session) || target === revealed
    ? currentPage(session)
    : { kind: 'step', index: target };
}

/**
 * Whether two steps are shown in the same view (E-35): the spins of the order, or the pieces of
 * the placement. Every draw of a person and every person's starting resources have a view of
 * their own.
 */
export function isSameView(a: CatanStep['kind'], b: CatanStep['kind']): boolean {
  const view = (kind: CatanStep['kind']): string =>
    kind === 'road' ? 'building' : kind === 'order-spin' || kind === 'building' ? kind : '';
  return view(a) !== '' && view(a) === view(b);
}

/**
 * The slot that follows step `index` in the flow: the next step if it is drawn already,
 * otherwise the next missing one (`null` at the end). The band of the placement announces it
 * (N1).
 */
export function followingSlot(session: StoredSession, index: number): CatanSlot | null {
  const next = catanNextSlot(session.setup, session.generation);
  // A missing step right after it comes first, even if later steps are drawn already, e.g. the
  // placement after repeating the order before the starting resources (PO 10.11.2026).
  if (next !== null && next.at === index + 1) {
    return next.slot;
  }
  const after = session.generation.steps[index + 1]?.step;
  if (after !== undefined && index + 1 < lastReachable(session)) {
    return after;
  }
  return next?.slot ?? null;
}

/**
 * What the forward button does on a page (US-AB-02 AK-1, US-AB-04 AK-4, US-SR-01 AK-6).
 */
export function forwardAction(session: StoredSession, page: FlowPage): ForwardAction {
  if (page.kind === 'pending') {
    return 'draw';
  }
  const revealed = revealedStepIndex(session.generation);
  const step = session.generation.steps[page.index]?.step;
  if (
    page.index === revealed &&
    step?.kind === 'starting-resources' &&
    !areResourcesOpen(session, page.index)
  ) {
    return 'turn-all';
  }
  const next = catanNextSlot(session.setup, session.generation);
  const end = shownRange(session, page.index).end;
  // The step just drawn, or the kept view after it, goes on with the missing steps first,
  // before the later steps drawn already are browsed (PO 10.11.2026: after repeating the order,
  // "Blättern" led into the starting resources and back).
  if (revealed !== undefined && end >= revealed && next?.at === end + 1) {
    return step !== undefined && isSameView(step.kind, next.slot.kind) ? 'draw' : 'next';
  }
  if (revealed === undefined || end < session.generation.steps.length - 1) {
    return 'browse';
  }
  if (next === null) {
    return 'overview';
  }
  return step !== undefined && isSameView(step.kind, next.slot.kind) ? 'draw' : 'next';
}

/**
 * Whether every card of the starting resources at step `index` is turned over (FA-SR-05).
 */
export function areResourcesOpen(session: StoredSession, index: number): boolean {
  const step = session.generation.steps[index]?.step;
  if (step?.kind !== 'starting-resources') {
    return true;
  }
  return catanOpenedResources(session.generation, step.personId).length === step.result.length;
}

/**
 * Whether "Platzierung überspringen" is offered (US-PL-05 AK-1): on the empty board before the
 * first building, as long as no building is placed.
 */
export function canOfferSkip(session: StoredSession, page: FlowPage): boolean {
  return (
    page.kind === 'pending' &&
    page.slot.kind === 'building' &&
    canSkipCatanPlacement(session.setup, session.generation)
  );
}

/**
 * The match as it was right after step `index`, for showing that step (look back): the later
 * steps are left out.
 */
export function sessionUpTo(session: StoredSession, index: number): StoredSession {
  return {
    ...session,
    generation: {
      ...session.generation,
      steps: session.generation.steps.slice(0, index + 1),
    },
  };
}

/**
 * Index of the first step that `matches`, or `null`, e.g. for a row of the overview (US-AB-03
 * AK-6).
 */
export function stepIndexWhere(
  session: StoredSession,
  matches: (step: CatanStep) => boolean,
): number | null {
  const index = session.generation.steps.findIndex((record) => matches(record.step));
  return index === -1 ? null : index;
}

/**
 * The placement order, once it stands; without an order the seats of the table (FA-LS-07,
 * US-SR-01 AK-1).
 */
export function orderOrSeats(session: StoredSession): readonly PersonId[] {
  const steps = session.generation.steps.map((record) => record.step);
  return catanPlacementOrder(session.setup, steps) ?? session.setup.participants;
}
