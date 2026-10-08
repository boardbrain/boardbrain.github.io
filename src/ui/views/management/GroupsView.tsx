import { useEffect, useState } from 'react';
import { findGroups, type CustomGame, type Group, type Person } from '@/core/model';
import { findSupportedGame } from '@/games/registry';
import { t } from '@/i18n/t';
import { useCustomGames, useGroups, usePersons } from '@/infra/db/readHooks';
import { useAppDependencies } from '@/ui/AppDependencies';
import { BackIcon, CloseIcon, SearchIcon } from '@/ui/components/Icons';
import { Notice } from '@/ui/components/Notice';
import { Page } from '@/ui/components/Page';
import { GroupEditor } from './GroupEditor';
import { GroupTable, type TableSeat } from './GroupTable';
import styles from './GroupsView.module.css';

const MIN_PERSONS_FOR_GROUP = 2;

// What the group plays, e.g. "Alle Spiele ohne Catan" or the name of the bound game.
function bindingLabel(group: Group, customGames: readonly CustomGame[]): string {
  if (group.binding.kind === 'global') {
    return group.binding.excludesCatan === true
      ? t('gruppen.bindungOhneCatan')
      : t('gruppen.bindungGlobal');
  }
  const { gameId } = group.binding;
  const supported = findSupportedGame(gameId);
  if (supported !== undefined) {
    return t(supported.nameKey);
  }
  return customGames.find((game) => game.id === gameId)?.name ?? '';
}

function seatsOf(group: Group, persons: readonly Person[]): TableSeat[] {
  return group.members.map((member) => {
    const name = persons.find((person) => person.id === member.personId)?.name ?? '';
    return {
      id: member.personId,
      label: name,
      initial: name.charAt(0),
      groupColor: member.groupColor,
    };
  });
}

/**
 * Group management `#/verwaltung/gruppen` (US-PG-02, US-PG-03): all groups as tables in a
 * room, a search by group or person and "new table", which opens the editor (design F6
 * "Spielraum", Implementation Plan I1-C).
 */
export function GroupsView(): React.JSX.Element {
  const { db } = useAppDependencies();
  const persons = usePersons(db);
  const customGames = useCustomGames(db);
  const groups = useGroups(db);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const activePersons = (persons ?? []).filter((person) => !person.archived);
  const canCreate = activePersons.length >= MIN_PERSONS_FOR_GROUP;
  const matches = findGroups(groups ?? [], persons ?? [], query);
  const trimmedQuery = query.trim();

  // Escape closes the editor; the keyboard is an external system, hence the effect.
  useEffect(() => {
    if (!isEditing) {
      return undefined;
    }
    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setIsEditing(false);
      }
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isEditing]);

  function toggleSearch(): void {
    setIsSearchOpen(!isSearchOpen);
    setQuery('');
  }

  return (
    <Page
      title={t('gruppen.titel')}
      isWide
      actions={
        <button
          type="button"
          className={styles.iconButton}
          aria-label={t('gruppen.suchen')}
          aria-expanded={isSearchOpen}
          onClick={toggleSearch}
        >
          <SearchIcon />
        </button>
      }
    >
      {persons !== undefined && !canCreate && (
        <Notice tone="warning">
          <p>{t('gruppen.zuWenigPersonen')}</p>
        </Notice>
      )}
      {isSearchOpen && (
        <div className={styles.searchRow}>
          <input
            className={styles.searchInput}
            type="search"
            autoComplete="off"
            autoFocus
            aria-label={t('gruppen.suchfeld')}
            placeholder={t('gruppen.suchfeld')}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
          <button
            type="button"
            className={styles.iconButton}
            aria-label={t('gruppen.suchfeldSchliessen')}
            onClick={toggleSearch}
          >
            <CloseIcon />
          </button>
        </div>
      )}
      {trimmedQuery !== '' && matches.length === 0 && (
        <p className={styles.hint}>{t('gruppen.keinTreffer', { suche: trimmedQuery })}</p>
      )}
      <ul className={styles.room} aria-label={t('gruppen.liste')}>
        <li>
          <button
            type="button"
            className={styles.newCard}
            disabled={!canCreate}
            onClick={() => {
              setIsEditing(true);
            }}
          >
            <span className={styles.plus} aria-hidden="true" />
            <strong>{t('gruppen.neu')}</strong>
          </button>
        </li>
        {matches.map(({ group, memberNames }) => (
          <li key={group.id} className={styles.card}>
            <GroupTable seats={seatsOf(group, persons ?? [])} size="small" />
            <strong className={styles.name}>{group.name}</strong>
            <span className={styles.meta}>
              {t('gruppen.bindungText', {
                bindung: bindingLabel(group, customGames ?? []),
                anzahl: group.members.length,
              })}
            </span>
            {memberNames.length > 0 && (
              <span className={styles.match}>
                {t(memberNames.length === 1 ? 'gruppen.treffer.einer' : 'gruppen.treffer.mehrere', {
                  namen: memberNames.join(', '),
                })}
              </span>
            )}
          </li>
        ))}
      </ul>
      {groups?.length === 0 && trimmedQuery === '' && (
        <p className={styles.hint}>{t('gruppen.leer')}</p>
      )}
      {isEditing && (
        <div className={styles.backdrop}>
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-label={t('gruppen.neu')}
          >
            <div className={styles.dialogHeader}>
              <button
                type="button"
                className={styles.backButton}
                aria-label={t('gruppen.schliessen')}
                onClick={() => {
                  setIsEditing(false);
                }}
              >
                <span className={styles.backIcon}>
                  <BackIcon />
                </span>
                <span className={styles.closeIcon}>
                  <CloseIcon />
                </span>
              </button>
              <h2 className={styles.dialogTitle}>{t('gruppen.neu')}</h2>
            </div>
            <GroupEditor
              persons={activePersons}
              customGames={customGames ?? []}
              onSaved={() => {
                setIsEditing(false);
              }}
            />
          </div>
        </div>
      )}
    </Page>
  );
}
