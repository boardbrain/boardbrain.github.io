import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { findGroups, parseGameId, type GameId, type Group } from '@/core/model';
import { CATAN_GAME_ID } from '@/games/catan';
import { canGroupPlay } from '@/games/registry';
import { t } from '@/i18n/t';
import { useCurrentScorePad, useCustomGame, useGroups, usePersons } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { BackButton } from '@/ui/components/BackButton';
import { PlusIcon } from '@/ui/components/Icons';
import { PressableLink } from '@/ui/components/Pressable';
import { SearchButton, SearchRow } from '@/ui/components/SearchControls';
import { cx } from '@/ui/components/classNames';
import { MatchDialog } from '@/ui/views/match/MatchDialog';
import {
  namesOf,
  TABLE_SEARCH_LABELS,
  TableCard,
  TableDetails,
} from '@/ui/views/match/TableChoiceView';
import shared from '@/ui/views/match/Match.module.css';
import tables from '@/ui/views/match/TableChoiceView.module.css';
import styles from './Result.module.css';

const PLUS_SIZE = 14;

/**
 * The name of a game from the address: Catan or an active custom game; `undefined` while loading,
 * `null` for an unknown or archived game.
 */
export function useGameName(gameId: GameId | null): string | null | undefined {
  const { db } = useAppDependencies();
  const isCatan = gameId === CATAN_GAME_ID;
  const custom = useCustomGame(db, isCatan ? null : gameId);
  if (isCatan) {
    return t('spiele.namen.catan');
  }
  if (custom === undefined) {
    return undefined;
  }
  return custom === null || custom.archived ? null : custom.name;
}

function boundTo(group: Group, gameId: GameId): boolean {
  return group.binding.kind === 'game' && group.binding.gameId === gameId;
}

/**
 * Table choice of a result `#/ergebnis/neu/‹spiel›` (US-ER-01 AK-1, AK-5, design I3-B F2): the
 * active tables that can play the game, as for a new match; holding shows the details. With only
 * one such table the form opens at once; without one the page says what is missing (LZ2).
 *
 * For a score pad `#/notizblock/neu/‹spiel›` (US-NB-01 AK-1) the same choice leads to the score
 * pad instead of the form.
 */
export function ResultTableView({
  isForPad = false,
}: {
  readonly isForPad?: boolean;
}): React.JSX.Element | null {
  const { db } = useAppDependencies();
  const { gameId = '' } = useParams();
  const parsed = parseGameId(gameId);
  const game = parsed.ok ? parsed.value : null;
  const name = useGameName(game);
  const groups = useGroups(db);
  const persons = usePersons(db);
  const current = useCurrentScorePad(db);
  const navigate = useNavigate();
  const [details, setDetails] = useState<Group | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const start = isForPad ? '/notizblock/neu' : '/partie/neu';
  const hrefOf = (gameId: GameId, group: Group): string =>
    isForPad ? `/notizblock/neu/${gameId}/${group.id}` : `/ergebnis/neu/${gameId}/${group.id}`;
  if (game === null || name === null) {
    return <Navigate to={start} replace />;
  }
  if (
    name === undefined ||
    groups === undefined ||
    persons === undefined ||
    current === undefined
  ) {
    return null;
  }
  // E-51: while a score pad runs, choosing a table for one changes nothing; e.g. the back key
  // leads here from the running score pad.
  if (isForPad && current.status !== 'none') {
    return <Navigate to="/" replace />;
  }
  const active = groups.filter((group) => !group.archived);
  const fitting = active.filter((group) => canGroupPlay(group, game));
  if (fitting.length === 1 && fitting[0] !== undefined) {
    return <Navigate to={hrefOf(game, fitting[0])} replace />;
  }
  const byId = new Map(persons.map((person) => [person.id, person]));
  const left = active.length - fitting.length;
  const shown = findGroups(fitting, persons, query).map((match) => match.group);
  const trimmedQuery = query.trim();
  const toggleSearch = (): void => {
    setIsSearchOpen(!isSearchOpen);
    setQuery('');
  };
  const choose = (group: Group): void => {
    setDetails(null);
    void navigate(hrefOf(game, group));
  };
  return (
    <main className={shared.main}>
      <div className={shared.pageHead}>
        <BackButton fallback={start} />
        <div className={shared.titles}>
          <h1 className={shared.title}>{t('ergebnis.tischTitel')}</h1>
          <div className={shared.sub}>
            {t(isForPad ? 'notizblock.tischUnterzeile' : 'ergebnis.tischUnterzeile', {
              spiel: name,
            })}
          </div>
        </div>
        {fitting.length > 0 && (
          <SearchButton
            labels={TABLE_SEARCH_LABELS}
            isOpen={isSearchOpen}
            className={shared.iconBtn}
            onToggle={toggleSearch}
          />
        )}
      </div>
      <SearchRow
        isOpen={isSearchOpen}
        labels={TABLE_SEARCH_LABELS}
        query={query}
        closeClassName={shared.iconBtn}
        onQuery={setQuery}
        onClose={toggleSearch}
      />
      {trimmedQuery !== '' && shown.length === 0 && (
        <p className={cx(shared.small, shared.muted)}>
          {t('ergebnis.keinTischGefunden', { suche: trimmedQuery })}
        </p>
      )}
      {fitting.length === 0 ? (
        <div className={styles.emptyBox}>
          <strong>{t('ergebnis.keinTisch', { spiel: name })}</strong>
          <span className={styles.emptyText}>{t('ergebnis.keinTischText')}</span>
          <PressableLink to="/verwaltung/gruppen" className={shared.pill}>
            <PlusIcon size={PLUS_SIZE} />
            {t('ergebnis.neuerTisch')}
          </PressableLink>
        </div>
      ) : (
        <>
          <div className={tables.roomGrid}>
            {shown.map((group) => (
              <TableCard
                key={group.id}
                group={group}
                names={namesOf(group, byId)}
                boundTag={boundTo(group, game) ? t('partie.nurSpiel', { spiel: name }) : undefined}
                isSelected={false}
                onChoose={() => {
                  choose(group);
                }}
                onHold={() => {
                  setDetails(group);
                }}
              />
            ))}
          </div>
          <p className={shared.hint}>
            {t('ergebnis.tischHinweis')}
            {left === 1 && t('ergebnis.ohneSpielEiner', { spiel: name })}
            {left > 1 && t('ergebnis.ohneSpielMehrere', { anzahl: left, spiel: name })}
          </p>
        </>
      )}
      {details !== null && (
        <MatchDialog
          cancelLabel={t('partie.schliessen')}
          confirmLabel={t('partie.tischWaehlen')}
          onCancel={() => {
            setDetails(null);
          }}
          onConfirm={() => {
            choose(details);
          }}
        >
          <TableDetails
            group={details}
            persons={byId}
            binding={
              boundTo(details, game)
                ? t('partie.nurSpiel', { spiel: name })
                : t('partie.alleSpiele')
            }
          />
        </MatchDialog>
      )}
    </main>
  );
}
