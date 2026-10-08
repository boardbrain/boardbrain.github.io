import { useState } from 'react';
import type { Person, PersonId } from '@/core/model';
import { t } from '@/i18n/t';
import { useHasFinePointer, useIsWideScreen } from '@/ui/components/mediaQueries';
import styles from './PersonBench.module.css';

type PersonBenchProps = {
  readonly persons: readonly Person[];
  readonly selectedIds: readonly PersonId[];
  /** True once no further person can join, e.g. at 12 members. */
  readonly isFull: boolean;
  readonly onToggle: (person: Person) => void;
};

// A little tolerance, browsers round scroll positions.
const END_TOLERANCE_PX = 2;

// True once nothing more is hidden to the right or below: the fade at the edge then disappears.
function isScrolledToEnd(element: HTMLElement): boolean {
  return (
    element.scrollLeft + element.clientWidth >= element.scrollWidth - END_TOLERANCE_PX &&
    element.scrollTop + element.clientHeight >= element.scrollHeight - END_TOLERANCE_PX
  );
}

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
  const isWide = useIsWideScreen();
  // Only with a mouse: on touch screens focusing would pop up the keyboard unasked.
  const hasFinePointer = useHasFinePointer();
  const [isAtEnd, setIsAtEnd] = useState(false);
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
          autoFocus={hasFinePointer}
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
          className={styles.link}
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
      <div
        className={isAtEnd ? styles.scrollEnd : styles.scroll}
        role="group"
        aria-label={t('gruppen.bank')}
        ref={(element) => {
          if (element !== null) {
            setIsAtEnd(isScrolledToEnd(element));
          }
        }}
        onScroll={(event) => {
          setIsAtEnd(isScrolledToEnd(event.currentTarget));
        }}
      >
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
        {t(isWide ? 'gruppen.alleAnzeigen' : 'gruppen.alle', { count: persons.length })}
      </button>
    </div>
  );
}
