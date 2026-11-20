import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { parseGameId, type GameId, type Group } from '@/core/model';
import { CATAN_GAME_ID } from '@/games/catan';
import { canGroupPlay } from '@/games/registry';
import { t } from '@/i18n/t';
import { useCustomGame, useGroups, usePersons } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { BackButton } from '@/ui/components/BackButton';
import { PlusIcon } from '@/ui/components/Icons';
import { PressableLink } from '@/ui/components/Pressable';
import { MatchDialog } from '@/ui/views/match/MatchDialog';
import { namesOf, TableCard, TableDetails } from '@/ui/views/match/TableChoiceView';
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
 */
export function ResultTableView(): React.JSX.Element | null {
  const { db } = useAppDependencies();
  const { gameId = '' } = useParams();
  const parsed = parseGameId(gameId);
  const game = parsed.ok ? parsed.value : null;
  const name = useGameName(game);
  const groups = useGroups(db);
  const persons = usePersons(db);
  const navigate = useNavigate();
  const [details, setDetails] = useState<Group | null>(null);
  if (game === null || name === null) {
    return <Navigate to="/partie/neu" replace />;
  }
  if (name === undefined || groups === undefined || persons === undefined) {
    return null;
  }
  const active = groups.filter((group) => !group.archived);
  const fitting = active.filter((group) => canGroupPlay(group, game));
  if (fitting.length === 1 && fitting[0] !== undefined) {
    return <Navigate to={`/ergebnis/neu/${game}/${fitting[0].id}`} replace />;
  }
  const byId = new Map(persons.map((person) => [person.id, person]));
  const left = active.length - fitting.length;
  const choose = (group: Group): void => {
    setDetails(null);
    void navigate(`/ergebnis/neu/${game}/${group.id}`);
  };
  return (
    <main className={shared.main}>
      <div className={shared.pageHead}>
        <BackButton fallback="/partie/neu" />
        <div className={shared.titles}>
          <h1 className={shared.title}>{t('ergebnis.tischTitel')}</h1>
          <div className={shared.sub}>{t('ergebnis.tischUnterzeile', { spiel: name })}</div>
        </div>
      </div>
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
            {fitting.map((group) => (
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
