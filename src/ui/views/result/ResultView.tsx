import { useEffect, useEffectEvent, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import type { ResultDraft } from '@/app/services/resultService';
import {
  parseGameId,
  parseGroupId,
  parseMatchId,
  type GroupId,
  type MatchId,
  type Person,
} from '@/core/model';
import type { ResultInput } from '@/core/results';
import { err, ok, type Result } from '@/core/shared';
import { t } from '@/i18n/t';
import { useCustomGames, useGroup, usePersons } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { BackButton } from '@/ui/components/BackButton';
import { useGoBack } from '@/ui/components/useGoBack';
import { localToday } from '@/ui/views/games/dates';
import { gameNameOf, resultHref } from '@/ui/views/management/GroupResults';
import { groupResultsHref } from '@/ui/views/management/ResultDetailView';
import shared from '@/ui/views/match/Match.module.css';
import { ResultForm, type SavedNote } from './ResultForm';
import type { ResultPerson } from './ResultRows';
import { useGameName } from './ResultTableView';

type Loaded =
  { readonly draft: ResultDraft } | { readonly failed: true } | { readonly error: unknown };

/**
 * What the start shows after storing (design I3-B R3, I3-C NB1): who won, game and table, and
 * where the card leads: the result in the list of its table.
 */
export type SavedResult = SavedNote & { readonly groupId: GroupId; readonly matchId: MatchId };

// External system: the starting values come from the result service (Architecture 4.4), read
// again when group or game change.
function useDraft(
  load: () => Promise<Result<ResultDraft, string>>,
  key: string,
): Exclude<Loaded, { readonly error: unknown }> | null {
  const [loaded, setLoaded] = useState<{ readonly key: string; readonly value: Loaded } | null>(
    null,
  );
  const read = useEffectEvent(load);
  useEffect(() => {
    let isCurrent = true;
    read().then(
      (result) => {
        if (isCurrent) {
          setLoaded({ key, value: result.ok ? { draft: result.value } : { failed: true } });
        }
      },
      (error: unknown) => {
        if (isCurrent) {
          setLoaded({ key, value: { error } });
        }
      },
    );
    return () => {
      isCurrent = false;
    };
  }, [key]);
  const value = loaded?.key === key ? loaded.value : null;
  // ADR-025: an unexpected error is thrown while drawing, so the error view of the routes shows it.
  if (value !== null && 'error' in value) {
    throw value.error;
  }
  return value;
}

function personsOf(
  draft: ResultDraft,
  persons: readonly Person[],
  groupColors: ReadonlyMap<string, ResultPerson['groupColor']>,
): ResultPerson[] {
  return draft.participants.flatMap((id) => {
    const person = persons.find((candidate) => candidate.id === id);
    const groupColor = groupColors.get(id);
    return person === undefined || groupColor === undefined
      ? []
      : [{ id, name: person.name, groupColor }];
  });
}

type FormPageProps = {
  readonly draft: ResultDraft;
  readonly gameName: string;
  readonly title: string;
  readonly isFromMatch: boolean;
  /** Stores the result: its id, otherwise why not, as a text. */
  readonly save: (input: ResultInput) => Promise<Result<MatchId, string>>;
  readonly onSaved: (note: SavedNote, matchId: MatchId) => void;
  readonly onUnchanged?: (() => void) | undefined;
  readonly backFallback: string;
};

function FormPage({
  draft,
  gameName,
  title,
  isFromMatch,
  save,
  onSaved,
  onUnchanged,
  backFallback,
}: FormPageProps): React.JSX.Element | null {
  const { db } = useAppDependencies();
  const group = useGroup(db, draft.groupId);
  const persons = usePersons(db);
  if (group === undefined || group === null || persons === undefined) {
    return null;
  }
  const colors = new Map(group.members.map((member) => [member.personId, member.groupColor]));
  const subtitle = isFromMatch
    ? t('ergebnis.ausDerPartie', { spiel: gameName, tisch: group.name })
    : t('ergebnis.unterzeile', { spiel: gameName, tisch: group.name });
  return (
    <main className={shared.main}>
      <div className={shared.pageHead}>
        <BackButton fallback={backFallback} />
        <div className={shared.titles}>
          <h1 className={shared.title}>{title}</h1>
          <div className={shared.sub}>{subtitle}</div>
        </div>
      </div>
      <ResultForm
        draft={draft}
        persons={personsOf(draft, persons, colors)}
        gameName={gameName}
        tableName={group.name}
        today={localToday()}
        save={save}
        onSaved={onSaved}
        onUnchanged={onUnchanged}
      />
    </main>
  );
}

/**
 * Result form `#/ergebnis/neu/‹spiel›/‹tisch›` (US-ER-01 AK-1, design I3-B): game and table are
 * fixed, the form starts with today and the defaults of the game. Entered from the table page
 * (`?von=tisch`) it returns there with the new result lit up (design I3-C); otherwise the start
 * shows who won, and the card leads to the result (NM3, NB1).
 */
export function ResultView(): React.JSX.Element | null {
  const { results } = useAppDependencies();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFromTable = searchParams.get('von') === 'tisch';
  const { gameId = '', groupId = '' } = useParams();
  const game = parseGameId(gameId);
  const group = parseGroupId(groupId);
  const name = useGameName(game.ok ? game.value : null);
  const loaded = useDraft(
    () =>
      game.ok && group.ok
        ? results.draft(group.value, game.value)
        : Promise.resolve({ ok: false, error: 'invalid' }),
    `${gameId}/${groupId}`,
  );
  if (!game.ok || !group.ok || name === null || (loaded !== null && 'failed' in loaded)) {
    return <Navigate to={game.ok ? `/ergebnis/neu/${gameId}` : '/partie/neu'} replace />;
  }
  if (loaded === null || name === undefined) {
    return null;
  }
  return (
    <FormPage
      key={`${gameId}/${groupId}`}
      draft={loaded.draft}
      gameName={name}
      title={t('ergebnis.titel')}
      isFromMatch={false}
      backFallback={
        isFromTable ? `/verwaltung/gruppen/${group.value}/ergebnis` : `/ergebnis/neu/${gameId}`
      }
      save={async (input) => {
        const stored = await results.record({ ...input, groupId: group.value, gameId: game.value });
        if (stored.ok) {
          return ok(stored.value.id);
        }
        // The table was archived or rebound, or the game archived, while the form was open.
        return err(
          stored.error === 'group-not-eligible' || stored.error === 'game-not-eligible'
            ? t('ergebnis.tischNichtMehr')
            : t('ergebnis.nichtGespeichert'),
        );
      }}
      onSaved={(note, matchId) => {
        if (isFromTable) {
          void navigate(groupResultsHref(group.value), {
            replace: true,
            state: { highlight: matchId },
          });
          return;
        }
        const saved: SavedResult = { ...note, groupId: group.value, matchId };
        void navigate('/', { replace: true, state: { saved } });
      }}
    />
  );
}

/**
 * Result of the running match `#/partie/ergebnis` (US-AB-06 AK-2, US-AB-07 AK-4): filled in from
 * the match; storing ends it. Without a running match it leads to `#/partie`.
 */
export function MatchResultView(): React.JSX.Element | null {
  const { results } = useAppDependencies();
  const navigate = useNavigate();
  const loaded = useDraft(() => results.draftFromSession(), 'session');
  const name = useGameName(loaded !== null && 'draft' in loaded ? loaded.draft.gameId : null);
  if (loaded !== null && 'failed' in loaded) {
    return <Navigate to="/partie" replace />;
  }
  if (loaded === null || name === undefined) {
    return null;
  }
  if (name === null) {
    return <Navigate to="/partie" replace />;
  }
  const { groupId } = loaded.draft;
  return (
    <FormPage
      draft={loaded.draft}
      gameName={name}
      title={t('ergebnis.titel')}
      isFromMatch
      backFallback="/partie/uebersicht"
      save={async (input) => {
        const stored = await results.recordFromSession(input);
        if (stored.ok) {
          return ok(stored.value.id);
        }
        // The match was ended meanwhile, e.g. on another device or tab.
        return err(
          stored.error === 'no-session' ||
            stored.error === 'session-not-running' ||
            stored.error === 'session-unsupported'
            ? t('ergebnis.partieBeendet')
            : t('ergebnis.nichtGespeichert'),
        );
      }}
      onSaved={(note, matchId) => {
        const saved: SavedResult = { ...note, groupId, matchId };
        void navigate('/', { replace: true, state: { saved } });
      }}
    />
  );
}

/**
 * Changing a result `#/verwaltung/gruppen/‹tisch›/ergebnisse/‹ergebnis›/bearbeiten` (US-ER-05,
 * design I3-C): the result form with the stored values; group and game stay fixed (AK-4), a
 * change asks before it is stored (AK-1). Afterwards, or without a change, back to the result.
 */
export function ResultEditView(): React.JSX.Element | null {
  const { db, results } = useAppDependencies();
  const { groupId = '', matchId = '' } = useParams();
  const match = parseMatchId(matchId);
  const customGames = useCustomGames(db);
  const goBack = useGoBack(resultHref(groupId, matchId));
  const loaded = useDraft(
    () =>
      match.ok ? results.draftOf(match.value) : Promise.resolve({ ok: false, error: 'invalid' }),
    matchId,
  );
  if (!match.ok || (loaded !== null && 'failed' in loaded)) {
    return <Navigate to={groupResultsHref(groupId)} replace />;
  }
  if (loaded === null || customGames === undefined) {
    return null;
  }
  return (
    <FormPage
      draft={loaded.draft}
      gameName={gameNameOf(loaded.draft.gameId, customGames)}
      title={t('ergebnisse.bearbeitenTitel')}
      isFromMatch={false}
      backFallback={resultHref(groupId, matchId)}
      save={async (input) => {
        const stored = await results.edit(match.value, input);
        return stored.ok ? ok(stored.value.id) : err(t('ergebnisse.nichtGeaendert'));
      }}
      onSaved={goBack}
      onUnchanged={goBack}
    />
  );
}
