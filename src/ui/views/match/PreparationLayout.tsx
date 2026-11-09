import { useState, useTransition } from 'react';
import { Navigate, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router';
import { t } from '@/i18n/t';
import { useCurrentSession, useGroup } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { MatchDialog } from './MatchDialog';
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
 * generation or running, the game choice asks first (US-AB-05 AK-2, design I2-D, Q1): "Zur
 * Partie" leads back to it, "Neu beginnen" ends it without a result. This also covers the back
 * button and old links landing on the game choice; the later pages lead to the match.
 */
export function PreparationLayout(): React.JSX.Element | null {
  const { db, session: sessions } = useAppDependencies();
  const current = useCurrentSession(db);
  const group = useGroup(db, current?.status === 'active' ? current.session.groupId : null);
  const [preparation, setPreparation] = useState<MatchPreparation | null>(null);
  const [isEnding, startTransition] = useTransition();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (current === undefined) {
    return null;
  }
  if (current.status === 'unsupported') {
    return <Navigate to="/partie" replace />;
  }
  const context: PreparationContext = { preparation, setPreparation };
  if (current.status === 'none') {
    return <Outlet context={context} />;
  }
  // The question stands over the game choice. The later pages lead to the match, as right after
  // "Generierung starten" (the match is stored before the flow opens).
  if (pathname !== '/partie/neu') {
    return <Navigate to="/partie" replace />;
  }
  const toMatch = (): void => {
    void navigate('/partie', { replace: true, state: { from: 'start' } });
  };
  return (
    <>
      <Outlet context={context} />
      {group !== undefined && group !== null && !isEnding && (
        <MatchDialog
          title={t('partie.spieltGerade', { tisch: group.name })}
          lines={[t('partie.neuBeendetSie')]}
          cancelLabel={t('partie.neuBeginnen')}
          isCancelDanger
          onCancel={() => {
            startTransition(async () => {
              await sessions.endWithoutResult();
            });
          }}
          onDismiss={toMatch}
          confirmLabel={t('partie.zurPartie')}
          onConfirm={toMatch}
        />
      )}
    </>
  );
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
