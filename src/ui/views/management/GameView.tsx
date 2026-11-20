import { useParams } from 'react-router';
import { parseGameId, type CustomGame, type Group } from '@/core/model';
import { formatDate } from '@/i18n/format';
import { t } from '@/i18n/t';
import {
  useCustomGame,
  useCustomGames,
  useGroups,
  useScoredMatchCount,
} from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { EditorDialog } from '@/ui/components/EditorDialog';
import { ChevronIcon, PenIcon } from '@/ui/components/Icons';
import { MiniTable } from '@/ui/components/MiniTable';
import { Page } from '@/ui/components/Page';
import { PillButton } from '@/ui/components/PillButton';
import { PressableLink } from '@/ui/components/Pressable';
import { useGoBack } from '@/ui/components/useGoBack';
import { GameLetter } from '@/ui/views/games/GameCards';
import { GameEditor } from '@/ui/views/games/GameEditor';
import { otherGameNames } from './GamesView';
import overview from './Overview.module.css';
import styles from './Profile.module.css';

const PILL_ICON_SIZE = 15;
const ROW_TABLE_DIAMETER = 44;
const CHEVRON_SIZE = 18;

/**
 * Tables bound to exactly this game, in the order of `groups` (US-VW-07, design I1-F).
 */
function tablesOfGame(groups: readonly Group[], game: CustomGame): Group[] {
  return groups.filter(
    (group) => group.binding.kind === 'game' && group.binding.gameId === game.id,
  );
}

function ScoringFact({ game }: { readonly game: CustomGame }): React.JSX.Element {
  if (game.scoring === undefined) {
    return (
      <span className={overview.fact}>
        <b>{t('spiele.wertungPille.keine')}</b>
        <span className={overview.factLabel}>{t('spiele.wertungPille.punkte')}</span>
      </span>
    );
  }
  return (
    <span className={overview.fact}>
      <b>
        {t(
          game.scoring === 'highest-wins'
            ? 'spiele.wertungPille.meiste'
            : 'spiele.wertungPille.wenigste',
        )}
      </b>
      <span className={overview.factLabel}>{t('spiele.wertungPille.gewinnen')}</span>
    </span>
  );
}

/**
 * Page of a custom game `#/verwaltung/spiele/‹id›` (US-VW-07, design I3-B): a small playing card
 * with its letter, name, date, scoring and tables, "Bearbeiten" and the tables that play only
 * this game. Under `…/bearbeiten` the editor lies over the page, as for tables (AK-1, AK-3).
 * Supported games such as Catan have no page (AK-2).
 */
export function GameView({
  isEditing = false,
}: {
  readonly isEditing?: boolean;
}): React.JSX.Element | null {
  const { db } = useAppDependencies();
  const { gameId = '' } = useParams();
  const parsed = parseGameId(gameId);
  const game = useCustomGame(db, parsed.ok ? parsed.value : null);
  const groups = useGroups(db);
  const customGames = useCustomGames(db);
  const scoredCount = useScoredMatchCount(db, parsed.ok ? parsed.value : null);
  const closeEditor = useGoBack(`/verwaltung/spiele/${gameId}`);

  if (game === undefined || groups === undefined) {
    return null;
  }
  if (game === null) {
    return (
      <Page title={t('spiele.spiel')} backFallback="/verwaltung/spiele">
        <p className={overview.hint}>{t('spiele.nichtGefunden')}</p>
      </Page>
    );
  }

  const tables = tablesOfGame(groups, game);
  return (
    <Page title={game.name} backFallback="/verwaltung/spiele">
      <div className={styles.profile}>
        <div className={styles.card} aria-hidden="true">
          <GameLetter name={game.name} />
          <strong className={styles.gameName}>{game.name}</strong>
        </div>
        <div className={styles.facts}>
          <strong className={styles.name}>{game.name}</strong>
          <span className={styles.since}>
            {t('spiele.angelegtAm', { datum: formatDate(game.createdAt) })}
          </span>
          <div className={overview.facts}>
            <ScoringFact game={game} />
            <span className={overview.fact}>
              <b>{tables.length}</b>
              <span className={overview.factLabel}>
                {t(tables.length === 1 ? 'spiele.tisch' : 'spiele.tische')}
              </span>
            </span>
          </div>
        </div>
      </div>
      <div className={styles.actions}>
        <PillButton
          icon={<PenIcon size={PILL_ICON_SIZE} />}
          to={`/verwaltung/spiele/${game.id}/bearbeiten`}
        >
          {t('spiele.bearbeiten')}
        </PillButton>
      </div>
      <section className={overview.section}>
        <h2 className={overview.sectionTitle}>
          {t('spiele.tischeUeberschrift', { spiel: game.name, anzahl: tables.length })}
        </h2>
        {tables.length === 0 ? (
          <p className={overview.hint}>{t('spiele.keinTisch', { spiel: game.name })}</p>
        ) : (
          <ul className={overview.rows} aria-label={t('spiele.tischeListe', { spiel: game.name })}>
            {tables.map((group) => (
              <li key={group.id}>
                <PressableLink to={`/verwaltung/gruppen/${group.id}`} className={overview.row}>
                  <MiniTable seats={group.members} diameter={ROW_TABLE_DIAMETER} />
                  <span className={overview.rowText}>
                    <strong className={overview.rowTitle}>{group.name}</strong>
                    <span className={overview.rowNote}>
                      {t('spiele.personenAnzahl', { anzahl: group.members.length })}
                    </span>
                  </span>
                  <span className={overview.chevron}>
                    <ChevronIcon size={CHEVRON_SIZE} />
                  </span>
                </PressableLink>
              </li>
            ))}
          </ul>
        )}
      </section>
      {isEditing && customGames !== undefined && scoredCount !== undefined && (
        <EditorDialog title={t('spiele.bearbeitenTitel')} isNarrow onClose={closeEditor}>
          <GameEditor
            game={game}
            otherNames={otherGameNames(customGames, game)}
            scoredCount={scoredCount}
            onSaved={closeEditor}
          />
        </EditorDialog>
      )}
    </Page>
  );
}
