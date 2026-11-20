import { useState } from 'react';
import { findByName, sortByName, type CustomGame } from '@/core/model';
import { CATAN_GAME_ID } from '@/games/catan';
import { SUPPORTED_GAMES } from '@/games/registry';
import { useCustomGames, usePlayedGames } from '@/infra/db/readHooks';
import { t } from '@/i18n/t';
import { useAppDependencies } from '@/ui/AppDependencies';
import { EditorDialog } from '@/ui/components/EditorDialog';
import { Page } from '@/ui/components/Page';
import { useGoBack } from '@/ui/components/useGoBack';
import { GameEditor } from '@/ui/views/games/GameEditor';
import { CatanGameCard, CustomGameCard, GameGrid, NewGameCard } from '@/ui/views/games/GameCards';
import { localToday } from '@/ui/views/games/dates';
import { SearchButton, SearchRow } from '@/ui/views/games/GameSearch';
import persons from './PersonsView.module.css';

/**
 * Names of all games except `except`, Catan included (US-SP-02 AK-2, US-VW-07 AK-1).
 */
export function otherGameNames(customGames: readonly CustomGame[], except?: CustomGame): string[] {
  return [
    ...SUPPORTED_GAMES.map((game) => t(game.nameKey)),
    ...customGames.filter((game) => game.id !== except?.id).map((game) => game.name),
  ];
}

/**
 * Games `#/verwaltung/spiele` (US-SP-02, US-SP-03, design I3-B): "Neues Spiel" first, then all
 * games in one grid with the same cards as the game list of "Partie" (AK-1). A custom game opens
 * its page (US-VW-07); Catan is built in and has none. Under `#/verwaltung/spiele/neu` the editor
 * for a new game lies over the page, as "Neuer Tisch" does (US-SP-02 AK-1).
 */
export function GamesView({
  isCreating = false,
}: {
  readonly isCreating?: boolean;
}): React.JSX.Element {
  const { db } = useAppDependencies();
  const customGames = useCustomGames(db);
  const played = usePlayedGames(db);
  const closeEditor = useGoBack('/verwaltung/spiele');
  const today = localToday();
  const active = sortByName((customGames ?? []).filter((game) => !game.archived));
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim();
  const isCatanFound = findByName([{ name: t('spiele.namen.catan') }], query).length > 0;
  const found = findByName(active, query);
  const toggleSearch = (): void => {
    setIsSearchOpen(!isSearchOpen);
    setQuery('');
  };
  return (
    <Page
      title={t('spiele.titel')}
      backFallback="/verwaltung"
      actions={
        <SearchButton
          isOpen={isSearchOpen}
          className={persons.iconButton}
          onToggle={toggleSearch}
        />
      }
    >
      {isSearchOpen && (
        <SearchRow
          query={query}
          closeClassName={persons.iconButton}
          onQuery={setQuery}
          onClose={toggleSearch}
        />
      )}
      {trimmedQuery !== '' && found.length === 0 && !isCatanFound && (
        <p className={persons.hint}>{t('spiele.keinTreffer', { suche: trimmedQuery })}</p>
      )}
      {customGames !== undefined && played !== undefined && (
        <>
          <GameGrid
            label={t('spiele.karten')}
            hint={t(active.length === 0 ? 'spiele.keineEigenen' : 'spiele.eckeHinweis')}
          >
            {trimmedQuery === '' && <NewGameCard to="/verwaltung/spiele/neu" />}
            {isCatanFound && <CatanGameCard played={played.get(CATAN_GAME_ID)} today={today} />}
            {found.map((game) => (
              <CustomGameCard
                key={game.id}
                game={game}
                played={played.get(game.id)}
                today={today}
                target={{ to: `/verwaltung/spiele/${game.id}` }}
              />
            ))}
          </GameGrid>
        </>
      )}
      {isCreating && customGames !== undefined && (
        <EditorDialog title={t('spiele.neuesSpiel')} isNarrow onClose={closeEditor}>
          <GameEditor
            otherNames={otherGameNames(customGames)}
            scoredCount={0}
            onSaved={closeEditor}
          />
        </EditorDialog>
      )}
    </Page>
  );
}
