import { useRef, useState } from 'react';
import { Navigate } from 'react-router';
import { findByName } from '@/core/model';
import { t } from '@/i18n/t';
import { useCurrentScorePad, useCustomGames, usePlayedGames } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { BackButton } from '@/ui/components/BackButton';
import { PlusIcon } from '@/ui/components/Icons';
import { PressableLink } from '@/ui/components/Pressable';
import { SearchButton, SearchRow } from '@/ui/components/SearchControls';
import { cx } from '@/ui/components/classNames';
import { CustomGameCard, GameGrid } from '@/ui/views/games/GameCards';
import gameStyles from '@/ui/views/games/GameCards.module.css';
import {
  GAME_SEARCH_LABELS,
  SortButton,
  sortGames,
  useGameOrder,
  useSortGlide,
} from '@/ui/views/games/GameListTools';
import { localToday } from '@/ui/views/games/dates';
import shared from '@/ui/views/match/Match.module.css';
import styles from './ScorePadView.module.css';

const PLUS_SIZE = 14;

/**
 * Game choice of the score pad `#/notizblock/neu` (US-NB-01 AK-1, design I3-C2 SL4): the active
 * custom games that count points as cards of the game list, with its search and its order (the
 * last played first or A–Z, PO 25.11.2026); a card leads to the table. Games without points enter
 * their result as before.
 */
export function PadGameChoiceView(): React.JSX.Element | null {
  const { db } = useAppDependencies();
  const customGames = useCustomGames(db);
  const played = usePlayedGames(db);
  const current = useCurrentScorePad(db);
  const { order, orderWord, otherWord, toggle } = useGameOrder();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLUListElement>(null);
  const withPoints = (customGames ?? []).filter(
    (game) => !game.archived && game.scoring !== undefined,
  );
  const games = findByName(sortGames(withPoints, played ?? new Map(), order), query);
  useSortGlide(listRef, order, games.map((game) => game.id).join(' '));
  if (customGames === undefined || played === undefined || current === undefined) {
    return null;
  }
  // E-51: while a score pad runs, its choice changes nothing; e.g. the back key leads here.
  if (current.status !== 'none') {
    return <Navigate to="/" replace />;
  }
  const today = localToday();
  const trimmedQuery = query.trim();
  const toggleSearch = (): void => {
    setIsSearchOpen(!isSearchOpen);
    setQuery('');
  };
  return (
    <main className={shared.main}>
      <div className={shared.pageHead}>
        <BackButton fallback="/" />
        <div className={shared.titles}>
          <h1 className={shared.title}>{t('notizblock.titel')}</h1>
          <div className={shared.sub}>{t('notizblock.spielwahl')}</div>
        </div>
        {withPoints.length > 0 && (
          <span className={gameStyles.headActions}>
            <SearchButton
              labels={GAME_SEARCH_LABELS}
              isOpen={isSearchOpen}
              className={shared.iconBtn}
              onToggle={toggleSearch}
            />
            <SortButton
              order={order}
              orderWord={orderWord}
              otherWord={otherWord}
              className={shared.iconBtn}
              onToggle={toggle}
            />
          </span>
        )}
      </div>
      <SearchRow
        isOpen={isSearchOpen}
        labels={GAME_SEARCH_LABELS}
        query={query}
        closeClassName={shared.iconBtn}
        onQuery={setQuery}
        onClose={toggleSearch}
      />
      {trimmedQuery !== '' && games.length === 0 && (
        <p className={cx(shared.muted, shared.small)}>
          {t('spiele.keinTreffer', { suche: trimmedQuery })}
        </p>
      )}
      {withPoints.length === 0 ? (
        <div className={styles.empty}>
          <strong>{t('notizblock.keinSpiel')}</strong>
          <span className={cx(shared.muted, shared.small)}>{t('notizblock.keinSpielText')}</span>
          <PressableLink to="/verwaltung/spiele" className={shared.pill}>
            <PlusIcon size={PLUS_SIZE} />
            {t('verwaltung.spiele')}
          </PressableLink>
        </div>
      ) : (
        <GameGrid
          listRef={listRef}
          label={t('spiele.karten')}
          hint={t('notizblock.spielwahlHinweis')}
        >
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
