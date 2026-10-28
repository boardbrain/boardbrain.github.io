import { useState, useTransition } from 'react';
import type { NameDuplicateError } from '@/app/services/masterDataService';
import {
  cleanName,
  containsName,
  findPersons,
  tablesOfPerson,
  type NameEmptyError,
} from '@/core/model';
import { useGroups, usePersons } from '@/infra/db/readHooks';
import { t } from '@/i18n/t';
import { useAppDependencies } from '@/ui/AppDependencies';
import { CloseIcon, PlusIcon, SearchIcon } from '@/ui/components/Icons';
import { NameForm } from '@/ui/components/NameForm';
import { Notice } from '@/ui/components/Notice';
import { Page } from '@/ui/components/Page';
import { PersonCard } from './PersonCard';
import styles from './PersonsView.module.css';
import { PressableButton } from '@/ui/components/Pressable';

const PLUS_CARD_ICON_SIZE = 28;

// `submitted` is the input the message belongs to; the message is hidden once the input changes.
type Message = {
  readonly error: NameEmptyError | NameDuplicateError;
  readonly submitted: string;
};

/**
 * Person management `#/verwaltung/personen` (US-PG-01, US-VW-05, design I1-E L1): all persons
 * as playing cards with their tables, a search and "new person". A name that another person has
 * is shown as an error while typing and cannot be saved (US-PG-01 AK-3, E-31).
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

  function save(): void {
    // Unexpected errors in the transition reach the error boundary of the view (ADR-025).
    const submitted = name;
    setIsAdding(true);
    startTransition(async () => {
      const result = await masterData.createPerson({ name: submitted });
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
  const isTaken = containsName(
    (persons ?? []).map((person) => person.name),
    name,
  );
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
          <PressableButton
            type="button"
            className={styles.iconButton}
            aria-label={t('personen.suchen')}
            aria-expanded={isSearchOpen}
            onClick={toggleSearch}
          >
            <SearchIcon />
          </PressableButton>
          <PressableButton
            type="button"
            className={styles.addButton}
            aria-label={t('personen.neu')}
            aria-expanded={isFormOpen}
            onClick={() => {
              setIsAdding(!isAdding);
            }}
          >
            <PlusIcon />
          </PressableButton>
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
          <PressableButton
            type="button"
            className={styles.iconButton}
            aria-label={t('personen.suchfeldSchliessen')}
            onClick={toggleSearch}
          >
            <CloseIcon />
          </PressableButton>
        </div>
      )}
      {isFormOpen && (
        <NameForm
          title={t('personen.neu')}
          value={name}
          isPending={isPending}
          isFocused={isAdding}
          onValueChange={handleNameChange}
          onSubmit={save}
          error={isTaken ? t('personen.gleicherName', { name: cleanName(name) }) : null}
        >
          {/* Only if a person was created in the meantime; the live check shows it right after. */}
          {visibleMessage?.error === 'name-duplicate' && !isTaken && (
            <Notice tone="error">
              <p>{t('personen.gleicherName', { name: cleanName(visibleMessage.submitted) })}</p>
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
              <PressableButton
                type="button"
                look="card"
                className={styles.newCard}
                onClick={() => {
                  setIsAdding(true);
                }}
              >
                <PlusIcon size={PLUS_CARD_ICON_SIZE} />
                <span className={styles.newCardLabel}>{t('personen.neu')}</span>
              </PressableButton>
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
