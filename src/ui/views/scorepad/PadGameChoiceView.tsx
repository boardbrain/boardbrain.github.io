import { sortByName, type CustomGame } from '@/core/model';
import { t } from '@/i18n/t';
import { Navigate } from 'react-router';
import { useCurrentScorePad, useCustomGames, usePlayedGames } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { BackButton } from '@/ui/components/BackButton';
import { PlusIcon } from '@/ui/components/Icons';
import { PressableLink } from '@/ui/components/Pressable';
import { cx } from '@/ui/components/classNames';
import { CustomGameCard, GameGrid } from '@/ui/views/games/GameCards';
import { localToday } from '@/ui/views/games/dates';
import shared from '@/ui/views/match/Match.module.css';
import styles from './ScorePadView.module.css';

const PLUS_SIZE = 14;

/**
 * Game choice of the score pad `#/notizblock/neu` (US-NB-01 AK-1, design I3-C2 SL4): the active
 * custom games that count points, the last played first, as cards of the game list; a card leads
 * to the table. Games without points enter their result as before.
 */
export function PadGameChoiceView(): React.JSX.Element | null {
  const { db } = useAppDependencies();
  const customGames = useCustomGames(db);
  const played = usePlayedGames(db);
  const current = useCurrentScorePad(db);
  if (customGames === undefined || played === undefined || current === undefined) {
    return null;
  }
  // E-51: while a score pad runs, its choice changes nothing; e.g. the back key leads here.
  if (current.status !== 'none') {
    return <Navigate to="/" replace />;
  }
  const today = localToday();
  const last = (game: CustomGame): string => played.get(game.id)?.lastDate ?? '';
  const games = sortByName(
    customGames.filter((game) => !game.archived && game.scoring !== undefined),
  ).toSorted((a, b) => (last(a) === last(b) ? 0 : last(a) < last(b) ? 1 : -1));
  return (
    <main className={shared.main}>
      <div className={shared.pageHead}>
        <BackButton fallback="/" />
        <div className={shared.titles}>
          <h1 className={shared.title}>{t('notizblock.titel')}</h1>
          <div className={shared.sub}>{t('notizblock.spielwahl')}</div>
        </div>
      </div>
      {games.length === 0 ? (
        <div className={styles.empty}>
          <strong>{t('notizblock.keinSpiel')}</strong>
          <span className={cx(shared.muted, shared.small)}>{t('notizblock.keinSpielText')}</span>
          <PressableLink to="/verwaltung/spiele" className={shared.pill}>
            <PlusIcon size={PLUS_SIZE} />
            {t('verwaltung.spiele')}
          </PressableLink>
        </div>
      ) : (
        <GameGrid label={t('spiele.karten')} hint={t('notizblock.spielwahlHinweis')}>
          {games.map((game) => (
            <CustomGameCard
              key={game.id}
              game={game}
              played={played.get(game.id)}
              today={today}
              target={{ to: `/notizblock/neu/${game.id}` }}
            />
          ))}
        </GameGrid>
      )}
    </main>
  );
}
