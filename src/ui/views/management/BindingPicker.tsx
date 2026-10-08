import { useState } from 'react';
import type { GameId } from '@/core/model';
import { t } from '@/i18n/t';
import { useHasFinePointer } from '@/ui/components/mediaQueries';
import styles from './BindingPicker.module.css';

/** One game a group can be bound to. */
export type BindingOption = {
  readonly gameId: GameId;
  readonly label: string;
  readonly maxMembers: number;
};

type BindingPickerProps = {
  /** Supported games, always visible next to "all games" (today: Catan). */
  readonly supported: readonly BindingOption[];
  /** Own games, in the list behind "Anderes Spiel". */
  readonly custom: readonly BindingOption[];
  /** `null` = all games. */
  readonly choice: GameId | null;
  readonly memberCount: number;
  readonly onChoose: (choice: GameId | null) => void;
};

// From this many own games the list gets a search field.
const SEARCH_FROM = 6;
// A little tolerance, browsers round scroll positions.
const END_TOLERANCE_PX = 2;

function isScrolledToEnd(element: HTMLElement): boolean {
  return element.scrollTop + element.clientHeight >= element.scrollHeight - END_TOLERANCE_PX;
}

/**
 * What the group plays (US-PG-02 AK-4): "all games", the supported games and one button that
 * folds out the own games as a scrollable list, with a search field when there are many. The
 * choice stays one row high however many own games there are.
 */
export function BindingPicker({
  supported,
  custom,
  choice,
  memberCount,
  onChoose,
}: BindingPickerProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isAtEnd, setIsAtEnd] = useState(false);
  // Only with a mouse: on touch screens focusing would pop up the keyboard unasked.
  const hasFinePointer = useHasFinePointer();
  const chosenCustom = custom.find((option) => option.gameId === choice);
  const needle = query.trim().toLocaleLowerCase('de-DE');
  const shown = custom.filter((option) => option.label.toLocaleLowerCase('de-DE').includes(needle));
  const moreText =
    chosenCustom === undefined
      ? t('gruppen.anderesSpiel')
      : t('gruppen.bindungNur', { spiel: chosenCustom.label });

  function choose(next: GameId | null): void {
    onChoose(next);
    setIsOpen(false);
    setQuery('');
  }

  return (
    <div className={styles.picker}>
      <div className={styles.segment}>
        <button
          type="button"
          className={choice === null ? styles.on : styles.off}
          aria-pressed={choice === null}
          onClick={() => {
            choose(null);
          }}
        >
          {t('gruppen.bindungGlobal')}
        </button>
        {supported.map((option) => (
          <button
            key={option.gameId}
            type="button"
            className={choice === option.gameId ? styles.on : styles.off}
            aria-pressed={choice === option.gameId}
            disabled={memberCount > option.maxMembers}
            onClick={() => {
              choose(option.gameId);
            }}
          >
            {t('gruppen.bindungNur', { spiel: option.label })}
          </button>
        ))}
        {custom.length > 0 && (
          <button
            type="button"
            className={chosenCustom === undefined ? styles.more : styles.on}
            aria-pressed={chosenCustom !== undefined}
            aria-expanded={isOpen}
            onClick={() => {
              setIsOpen(!isOpen);
              setQuery('');
            }}
          >
            {t(isOpen ? 'gruppen.zuklappen' : 'gruppen.aufklappen', { text: moreText })}
          </button>
        )}
      </div>
      {supported
        .filter((option) => memberCount > option.maxMembers)
        .map((option) => (
          <span key={option.gameId} className={styles.hint}>
            {t('gruppen.bindungGesperrt', {
              spiel: option.label,
              max: option.maxMembers,
              count: memberCount,
            })}
          </span>
        ))}
      {isOpen && custom.length >= SEARCH_FROM && (
        <input
          className={styles.search}
          type="search"
          autoComplete="off"
          autoFocus={hasFinePointer}
          aria-label={t('gruppen.spielSuchen')}
          placeholder={t('gruppen.spielSuchen')}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
        />
      )}
      {isOpen && shown.length > 0 && (
        <div
          // A new search shows a new list, measured afresh for the fade.
          key={needle}
          className={isAtEnd ? styles.listEnd : styles.list}
          role="group"
          aria-label={t('gruppen.eigeneSpiele')}
          ref={(element) => {
            if (element !== null) {
              setIsAtEnd(isScrolledToEnd(element));
            }
          }}
          onScroll={(event) => {
            setIsAtEnd(isScrolledToEnd(event.currentTarget));
          }}
        >
          {shown.map((option) => (
            <button
              key={option.gameId}
              type="button"
              className={styles.item}
              aria-pressed={choice === option.gameId}
              disabled={memberCount > option.maxMembers}
              onClick={() => {
                choose(option.gameId);
              }}
            >
              {t('gruppen.bindungNur', { spiel: option.label })}
            </button>
          ))}
        </div>
      )}
      {isOpen && shown.length === 0 && <p className={styles.hint}>{t('gruppen.keinSpiel')}</p>}
    </div>
  );
}
