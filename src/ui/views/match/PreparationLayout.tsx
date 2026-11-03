import { useState } from 'react';
import { Navigate, Outlet, useOutletContext } from 'react-router';
import { useCurrentSession } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import type { MatchPreparation } from './preparation';

/**
 * What the pages of the preparation share (ADR-029): the preparation, once a table is chosen.
 */
export type PreparationContext = {
  readonly preparation: MatchPreparation | null;
  readonly setPreparation: (preparation: MatchPreparation) => void;
};

/**
 * Layout route `#/partie/neu` (Architecture 13.1, 13.2): holds the preparation in memory for
 * the game choice, table, options and colours (Specification 3.5). While a match is in
 * generation or running, it leads to that match, also when the back button lands here.
 */
export function PreparationLayout(): React.JSX.Element | null {
  const { db } = useAppDependencies();
  const current = useCurrentSession(db);
  const [preparation, setPreparation] = useState<MatchPreparation | null>(null);
  if (current === undefined) {
    return null;
  }
  if (current.status !== 'none') {
    return <Navigate to="/partie" replace />;
  }
  const context: PreparationContext = { preparation, setPreparation };
  return <Outlet context={context} />;
}

/**
 * The shared preparation of the pages below `#/partie/neu`.
 */
export function usePreparationContext(): PreparationContext {
  return useOutletContext<PreparationContext>();
}

/**
 * The preparation of a page that needs a chosen table; `null` leads to the table choice, e.g.
 * after reloading the page (the preparation is not stored, Specification 3.5).
 */
export function useChosenPreparation(): {
  readonly preparation: MatchPreparation | null;
  readonly setPreparation: (preparation: MatchPreparation) => void;
  readonly redirect: React.JSX.Element | null;
} {
  const { preparation, setPreparation } = usePreparationContext();
  return {
    preparation,
    setPreparation,
    redirect: preparation === null ? <Navigate to="/partie/neu/tisch" replace /> : null,
  };
}
