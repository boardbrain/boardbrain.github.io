import { CloseIcon, SearchIcon } from './Icons';
import { PressableButton } from './Pressable';
import styles from './SearchControls.module.css';

/**
 * Texts of a search: the magnifier, the field and the cross.
 */
export type SearchLabels = {
  readonly open: string;
  readonly field: string;
  readonly close: string;
};

/**
 * The round magnifier that opens a search, as on "Personen" and "Tische" (design I1-E).
 */
export function SearchButton({
  labels,
  isOpen,
  className,
  onToggle,
}: {
  readonly labels: SearchLabels;
  readonly isOpen: boolean;
  readonly className: string | undefined;
  readonly onToggle: () => void;
}): React.JSX.Element {
  return (
    <PressableButton
      type="button"
      className={className}
      aria-label={labels.open}
      aria-expanded={isOpen}
      onClick={onToggle}
    >
      <SearchIcon />
    </PressableButton>
  );
}

/**
 * The search row below the head: a field that filters while typing and a cross that empties and
 * closes it.
 */
export function SearchRow({
  labels,
  query,
  closeClassName,
  onQuery,
  onClose,
}: {
  readonly labels: SearchLabels;
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
        aria-label={labels.field}
        placeholder={labels.field}
        value={query}
        onChange={(event) => {
          onQuery(event.target.value);
        }}
      />
      <PressableButton
        type="button"
        className={closeClassName}
        aria-label={labels.close}
        onClick={onClose}
      >
        <CloseIcon />
      </PressableButton>
    </div>
  );
}
