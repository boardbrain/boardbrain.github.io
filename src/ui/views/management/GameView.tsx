import { useState } from 'react';
import { useParams } from 'react-router';
import { cleanName, containsName, parseGameId, type CustomGame, type Group } from '@/core/model';
import { SUPPORTED_GAMES } from '@/games/registry';
import { formatDate } from '@/i18n/format';
import { t } from '@/i18n/t';
import { useCustomGame, useCustomGames, useGroups } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { ChevronIcon, DiceIcon, PenIcon } from '@/ui/components/Icons';
import { MiniTable } from '@/ui/components/MiniTable';
import { Page } from '@/ui/components/Page';
import { PillButton } from '@/ui/components/PillButton';
import overview from './Overview.module.css';
import styles from './Profile.module.css';
import { useRenameForm } from './RenameForm';
import { PressableLink } from '@/ui/components/Pressable';

const DICE_SIZE = 28;
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

type GameRenameProps = {
  readonly game: CustomGame;
  /** Names of all other games, the supported ones included. */
  readonly otherNames: readonly string[];
  readonly card: React.JSX.Element;
  readonly actions: React.JSX.Element;
  readonly onClose: () => void;
};

// US-VW-07 AK-1: renamed in place like a person; the name must stay unique among all games.
function GameRename({
  game,
  otherNames,
  card,
  actions,
  onClose,
}: GameRenameProps): React.JSX.Element {
  const { masterData } = useAppDependencies();
  const { form, notices } = useRenameForm({
    initialName: game.name,
    fieldLabel: t('spiele.neuerName'),
    // AK-1: checked while typing against Catan and the other custom games.
    liveError: (name) =>
      containsName(otherNames, name) ? t('spiele.gleicherName', { name: cleanName(name) }) : null,
    save: (name) => masterData.renameCustomGame({ gameId: game.id, name }),
    // Only if a game was created in the meantime; the live check shows it right after.
    messageFor: (error, name) =>
      error === 'name-duplicate' ? t('spiele.gleicherName', { name }) : t('verwaltung.nameLeer'),
    onClose,
  });
  return (
    <>
      <div className={styles.profile}>
        {card}
        <div className={styles.facts}>{form}</div>
      </div>
      {actions}
      {notices}
    </>
  );
}

/**
 * Page of a custom game `#/verwaltung/spiele/‹id›` (US-VW-07, design I1-F): a small playing
 * card with a die, name and date, renaming in place and the tables that play only this game.
 * Supported games such as Catan have no page (AK-2: they cannot be renamed).
 */
export function GameView(): React.JSX.Element | null {
  const { db } = useAppDependencies();
  const { gameId = '' } = useParams();
  const parsed = parseGameId(gameId);
  const game = useCustomGame(db, parsed.ok ? parsed.value : null);
  const groups = useGroups(db);
  const customGames = useCustomGames(db);
  const [isRenaming, setIsRenaming] = useState(false);

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
  const card = (
    <div className={styles.card} aria-hidden="true">
      <span className={styles.corner}>{tables.length}</span>
      <span className={styles.gameIcon}>
        <DiceIcon size={DICE_SIZE} />
      </span>
      <strong className={styles.cardName}>{game.name}</strong>
      <span className={styles.cornerBottom}>{tables.length}</span>
    </div>
  );
  const actions = (
    <div className={styles.actions}>
      <PillButton
        icon={<PenIcon size={PILL_ICON_SIZE} />}
        onClick={() => {
          setIsRenaming(true);
        }}
      >
        {t('spiele.umbenennen')}
      </PillButton>
    </div>
  );
  return (
    <Page title={game.name} backFallback="/verwaltung/spiele">
      {isRenaming ? (
        <GameRename
          game={game}
          otherNames={[
            ...SUPPORTED_GAMES.map((supported) => t(supported.nameKey)),
            ...(customGames ?? [])
              .filter((other) => other.id !== game.id)
              .map((other) => other.name),
          ]}
          card={card}
          actions={actions}
          onClose={() => {
            setIsRenaming(false);
          }}
        />
      ) : (
        <>
          <div className={styles.profile}>
            {card}
            <div className={styles.facts}>
              <strong className={styles.name}>{game.name}</strong>
              <span className={styles.since}>
                {t('spiele.angelegtAm', { datum: formatDate(game.createdAt) })}
              </span>
              <div className={overview.facts}>
                <span className={overview.fact}>
                  <b>{tables.length}</b>
                  <span className={overview.factLabel}>
                    {t(tables.length === 1 ? 'spiele.tisch' : 'spiele.tische')}
                  </span>
                </span>
              </div>
            </div>
          </div>
          {actions}
        </>
      )}
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
    </Page>
  );
}
