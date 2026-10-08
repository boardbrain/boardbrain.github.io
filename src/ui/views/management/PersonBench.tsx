import { useState } from 'react';
import type { Person, PersonId } from '@/core/model';
import { t } from '@/i18n/t';
import styles from './PersonBench.module.css';

type PersonBenchProps = {
  readonly persons: readonly Person[];
  readonly selectedIds: readonly PersonId[];
  /** True once no further person can join, e.g. at 12 members. */
  readonly isFull: boolean;
  readonly onToggle: (person: Person) => void;
};

function matches(person: Person, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase('de-DE');
  return needle === '' || person.name.toLocaleLowerCase('de-DE').includes(needle);
}

/**
 * The bench: all persons to bring to the table (US-PG-02). Collapsed it is one swipeable row on
 * phones and a field of two rows to scroll vertically on wide screens, without a visible
 * scrollbar; expanded it shows everyone and a search field.
 */
export function PersonBench({
  persons,
  selectedIds,
  isFull,
  onToggle,
}: PersonBenchProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const shown = isOpen ? persons.filter((person) => matches(person, query)) : persons;

  function chips(): React.JSX.Element[] {
    return shown.map((person) => {
      const isSelected = selectedIds.includes(person.id);
      return (
        <button
          key={person.id}
          type="button"
          className={isSelected ? styles.chipOn : styles.chip}
          aria-pressed={isSelected}
          disabled={!isSelected && isFull}
          onClick={() => {
            onToggle(person);
          }}
        >
          {person.name}
        </button>
      );
    });
  }

  if (isOpen) {
    return (
      <div className={styles.open}>
        <input
          className={styles.search}
          type="search"
          autoComplete="off"
          autoFocus
          aria-label={t('gruppen.personSuchen')}
          placeholder={t('gruppen.personSuchen')}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
        />
        <div className={styles.all} role="group" aria-label={t('gruppen.bank')}>
          {chips()}
        </div>
        {shown.length === 0 && <p className={styles.hint}>{t('gruppen.keinePerson')}</p>}
        <button
          type="button"
          className={styles.toggle}
          aria-expanded="true"
          onClick={() => {
            setIsOpen(false);
            setQuery('');
          }}
        >
          {t('gruppen.weniger')}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.closed}>
      <div className={styles.scroll} role="group" aria-label={t('gruppen.bank')}>
        {chips()}
      </div>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded="false"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        {t('gruppen.alle', { count: persons.length })}
      </button>
    </div>
  );
}
