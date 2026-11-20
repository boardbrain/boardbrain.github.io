import { t } from '@/i18n/t';
import { CloseIcon, SearchIcon } from '@/ui/components/Icons';
import { PressableButton } from '@/ui/components/Pressable';
import styles from './GameCards.module.css';

/**
 * The round magnifier that opens the search, as on "Personen" and "Tische" (design I1-E).
 */
export function SearchButton({
  isOpen,
  className,
  onToggle,
}: {
  readonly isOpen: boolean;
  readonly className: string | undefined;
  readonly onToggle: () => void;
}): React.JSX.Element {
  return (
    <PressableButton
      type="button"
      className={className}
      aria-label={t('spiele.suchen')}
      aria-expanded={isOpen}
      onClick={onToggle}
    >
      <SearchIcon />
    </PressableButton>
  );
}

/**
 * The search row below the head: a field that filters the games while typing and a cross that
 * empties and closes it, as on "Personen" and "Tische".
 */
export function SearchRow({
  query,
  closeClassName,
  onQuery,
  onClose,
}: {
  readonly query: string;
  readonly closeClassName: string | undefined;
  readonly onQuery: (query: string) => void;
  readonly onClose: () => void;
}): React.JSX.Element {
  return (
    <div className={styles.searchRow}>
      <input
        className={styles.searchInput}
        type="search"
        autoComplete="off"
        autoFocus
        enterKeyHint="search"
        aria-label={t('spiele.suchfeld')}
        placeholder={t('spiele.suchfeld')}
        value={query}
        onChange={(event) => {
          onQuery(event.target.value);
        }}
      />
      <PressableButton
        type="button"
        className={closeClassName}
        aria-label={t('spiele.suchfeldSchliessen')}
        onClick={onClose}
      >
        <CloseIcon />
      </PressableButton>
    </div>
  );
}
