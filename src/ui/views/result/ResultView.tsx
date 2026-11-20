import { useEffect, useEffectEvent, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import type { ResultDraft } from '@/app/services/resultService';
import { parseGameId, parseGroupId, type Person } from '@/core/model';
import type { ResultInput } from '@/core/results';
import type { Result } from '@/core/shared';
import { t } from '@/i18n/t';
import { useGroup, usePersons } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { BackButton } from '@/ui/components/BackButton';
import { localToday } from '@/ui/views/games/dates';
import shared from '@/ui/views/match/Match.module.css';
import { ResultForm, type SavedNote } from './ResultForm';
import type { ResultPerson } from './ResultRows';
import { useGameName } from './ResultTableView';

type Loaded = { readonly draft: ResultDraft } | { readonly failed: true };

// External system: the starting values come from the result service (Architecture 4.4), read
// again when group or game change.
function useDraft(load: () => Promise<Result<ResultDraft, string>>, key: string): Loaded | null {
  const [loaded, setLoaded] = useState<{ readonly key: string; readonly value: Loaded } | null>(
    null,
  );
  const read = useEffectEvent(load);
  useEffect(() => {
    let isCurrent = true;
    void read().then((result) => {
      if (isCurrent) {
        setLoaded({ key, value: result.ok ? { draft: result.value } : { failed: true } });
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [key]);
  return loaded?.key === key ? loaded.value : null;
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
  readonly isFromMatch: boolean;
  readonly save: (input: ResultInput) => Promise<boolean>;
  readonly backFallback: string;
};

function FormPage({
  draft,
  gameName,
  isFromMatch,
  save,
  backFallback,
}: FormPageProps): React.JSX.Element | null {
  const { db } = useAppDependencies();
  const group = useGroup(db, draft.groupId);
  const persons = usePersons(db);
  const navigate = useNavigate();
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
          <h1 className={shared.title}>{t('ergebnis.titel')}</h1>
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
        onSaved={(note: SavedNote) => {
          // R3: back to the start, which shows who won (the table page follows with I3-C).
          void navigate('/', { replace: true, state: { saved: note } });
        }}
      />
    </main>
  );
}

/**
 * Result form `#/ergebnis/neu/‹spiel›/‹tisch›` (US-ER-01 AK-1, design I3-B): game and table are
 * fixed, the form starts with today and the defaults of the game.
 */
export function ResultView(): React.JSX.Element | null {
  const { results } = useAppDependencies();
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
      isFromMatch={false}
      backFallback={`/ergebnis/neu/${gameId}`}
      save={async (input) => {
        const stored = await results.record({ ...input, groupId: group.value, gameId: game.value });
        return stored.ok;
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
  return (
    <FormPage
      draft={loaded.draft}
      gameName={name}
      isFromMatch
      backFallback="/partie/uebersicht"
      save={async (input) => (await results.recordFromSession(input)).ok}
    />
  );
}
