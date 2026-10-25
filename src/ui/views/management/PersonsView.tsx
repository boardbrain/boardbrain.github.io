import { useState, useTransition } from 'react';
import type { NameDuplicateError } from '@/app/services/masterDataService';
import { cleanName, findPersons, tablesOfPerson, type NameEmptyError } from '@/core/model';
import { useGroups, usePersons } from '@/infra/db/readHooks';
import { t } from '@/i18n/t';
import { useAppDependencies } from '@/ui/AppDependencies';
import { CloseIcon, PlusIcon, SearchIcon } from '@/ui/components/Icons';
import { NameForm } from '@/ui/components/NameForm';
import { Notice } from '@/ui/components/Notice';
import { Page } from '@/ui/components/Page';
import { PersonCard } from './PersonCard';
import styles from './PersonsView.module.css';

const PLUS_CARD_ICON_SIZE = 28;

// `submitted` is the input the message belongs to; the message is hidden once the input changes.
type Message = {
  readonly error: NameEmptyError | NameDuplicateError;
  readonly submitted: string;
};

/**
 * Person management `#/verwaltung/personen` (US-PG-01, US-VW-05, design I1-E L1): all persons
 * as playing cards with their tables, a search and "new person". A same-named person is only a
 * hint; saving is possible after confirmation (US-PG-01 AK-3).
 */
export function PersonsView(): React.JSX.Element {
  const { db, masterData } = useAppDependencies();
  const persons = usePersons(db);
  const groups = useGroups(db);
  const [name, setName] = useState('');
  const [message, setMessage] = useState<Message | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  function save(isDuplicateConfirmed: boolean): void {
    // Unexpected errors in the transition reach the error boundary of the view (ADR-025).
    const submitted = name;
    setIsAdding(true);
    startTransition(async () => {
      const result = await masterData.createPerson({ name: submitted, isDuplicateConfirmed });
      startTransition(() => {
        if (result.ok) {
          // Keep a name that was typed while saving was still running.
          setName((current) => (current === submitted ? '' : current));
          setMessage(null);
          return;
        }
        setMessage({ error: result.error, submitted });
      });
    });
  }

  const visibleMessage = message?.submitted === name ? message : null;
  // Without persons the form is always there, so the first person can be created right away.
  const isFormOpen = isAdding || persons?.length === 0;
  const matches = findPersons(persons ?? [], query);
  const trimmedQuery = query.trim();

  function handleNameChange(value: string): void {
    setName(value);
    setMessage(null);
  }

  function toggleSearch(): void {
    setIsSearchOpen(!isSearchOpen);
    setQuery('');
  }

  return (
    <Page
      title={t('personen.titel')}
      isWide
      backFallback="/verwaltung"
      actions={
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={t('personen.suchen')}
            aria-expanded={isSearchOpen}
            onClick={toggleSearch}
          >
            <SearchIcon />
          </button>
          <button
            type="button"
            className={styles.addButton}
            aria-label={t('personen.neu')}
            aria-expanded={isFormOpen}
            onClick={() => {
              setIsAdding(!isAdding);
            }}
          >
            <PlusIcon />
          </button>
        </div>
      }
    >
      {isSearchOpen && (
        <div className={styles.searchRow}>
          <input
            className={styles.searchInput}
            type="search"
            autoComplete="off"
            autoFocus
            aria-label={t('personen.suchfeld')}
            placeholder={t('personen.suchfeld')}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
          <button
            type="button"
            className={styles.iconButton}
            aria-label={t('personen.suchfeldSchliessen')}
            onClick={toggleSearch}
          >
            <CloseIcon />
          </button>
        </div>
      )}
      {isFormOpen && (
        <NameForm
          title={t('personen.neu')}
          value={name}
          isPending={isPending}
          isFocused={isAdding}
          onValueChange={handleNameChange}
          onSubmit={() => {
            save(false);
          }}
        >
          {visibleMessage?.error === 'name-duplicate' && (
            <Notice tone="warning">
              <p>{t('personen.gleicherName', { name: cleanName(visibleMessage.submitted) })}</p>
              <p>{t('personen.gleicherNameGruppe')}</p>
              <div className={styles.noticeActions}>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    save(true);
                  }}
                >
                  {t('personen.trotzdemAnlegen')}
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => {
                    setMessage(null);
                  }}
                >
                  {t('allgemein.abbrechen')}
                </button>
              </div>
            </Notice>
          )}
          {visibleMessage?.error === 'name-empty' && (
            <Notice tone="error">
              <p>{t('verwaltung.nameLeer')}</p>
            </Notice>
          )}
        </NameForm>
      )}
      {persons?.length === 0 && <p className={styles.hint}>{t('personen.leer')}</p>}
      {trimmedQuery !== '' && matches.length === 0 && (
        <p className={styles.hint}>{t('personen.keinTreffer', { suche: trimmedQuery })}</p>
      )}
      {persons !== undefined && persons.length > 0 && (
        <ul className={styles.grid} aria-label={t('personen.liste')}>
          {trimmedQuery === '' && (
            <li>
              <button
                type="button"
                className={styles.newCard}
                onClick={() => {
                  setIsAdding(true);
                }}
              >
                <PlusIcon size={PLUS_CARD_ICON_SIZE} />
                <span className={styles.newCardLabel}>{t('personen.neu')}</span>
              </button>
            </li>
          )}
          {matches.map((person) => (
            <li key={person.id} className={styles.item}>
              <PersonCard person={person} tables={tablesOfPerson(groups ?? [], person.id)} />
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
