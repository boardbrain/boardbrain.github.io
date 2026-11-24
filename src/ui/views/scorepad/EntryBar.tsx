import { useEffect, useRef, type RefObject } from 'react';
import type { PersonId } from '@/core/model';
import { formatPadNumber } from '@/i18n/format';
import { t } from '@/i18n/t';
import { PressableButton } from '@/ui/components/Pressable';
import { cx } from '@/ui/components/classNames';
import type { ResultPerson } from '@/ui/views/result/ResultRows';
import styles from './EntryBar.module.css';

// The room the bar and the keyboard take from the bottom of the window, for the page above it.
const INSET_PROPERTY = '--entry-inset';
// Once the visible area is this close to the window again, the keyboard was closed.
const KEYBOARD_GONE_MARGIN = 80;
const ALLOWED = /^[-−]?\d{0,6}$/u;

/**
 * The person whose number is typed and what the bar says about it.
 */
export type EntryTarget = {
  readonly person: ResultPerson;
  /** "Runde 5", "Neuer Stand" or "Runde 3 ändern". */
  readonly subtitle: string;
};

type EntryBarProps = {
  readonly isOpen: boolean;
  readonly inputRef: RefObject<HTMLInputElement | null>;
  readonly target: EntryTarget | null;
  /** The persons of the new round as capsules; empty while a stored number is changed. */
  readonly strip: readonly ResultPerson[];
  readonly entries: Readonly<Record<PersonId, number | undefined>>;
  readonly value: string;
  readonly isLast: boolean;
  readonly error: string | null;
  readonly onValue: (text: string) => void;
  readonly onEnter: () => void;
  readonly onPerson: (personId: PersonId) => void;
  /** The keyboard was closed or the field left. */
  readonly onClose: (next: EventTarget | null) => void;
};

// The number as the field shows it: the typographic minus is typed as a hyphen.
function cleaned(text: string): string | null {
  const plain = text.replace('−', '-');
  return ALLOWED.test(plain) ? plain : null;
}

function toggledSign(text: string): string {
  return text.startsWith('-') ? text.slice(1) : `-${text}`;
}

/**
 * The bar above the keyboard of the device (design I3-C2 EK5, E-54): all persons of the round as
 * capsules (dashed until entered, the active one framed; a tap jumps), below the person, the
 * round, the number and ±, because the numeric keypad of the iPhone has no minus. The field is a
 * real text field, so the device opens its own keyboard; "Weiter" on it moves on.
 *
 * The field is always there, only hidden while nothing is typed: iOS opens the keyboard only for
 * a field focused within the tap.
 */
export function EntryBar({
  isOpen,
  inputRef,
  target,
  strip,
  entries,
  value,
  isLast,
  error,
  onValue,
  onEnter,
  onPerson,
  onClose,
}: EntryBarProps): React.JSX.Element {
  const barRef = useRef<HTMLDivElement>(null);

  // External system: the visible area of the browser. The keyboard does not make the frame
  // smaller on Android and iOS, so the bar follows the visible area; when it grows back, the
  // keyboard was closed, e.g. with the back key of Android, which does not leave the field.
  useEffect(() => {
    // Older browsers and test environments have no visual viewport: the bar then stays at the bottom.
    const viewport = 'visualViewport' in window ? window.visualViewport : null;
    const bar = barRef.current;
    if (viewport === null || bar === null || !isOpen) {
      return undefined;
    }
    let hasShrunk = false;
    const place = (): void => {
      const bottom = viewport.offsetTop + viewport.height;
      bar.style.transform = `translateY(${String(bottom - window.innerHeight)}px)`;
      document.documentElement.style.setProperty(
        INSET_PROPERTY,
        `${String(window.innerHeight - bottom + bar.offsetHeight)}px`,
      );
      const isSmaller = viewport.height < window.innerHeight - KEYBOARD_GONE_MARGIN;
      if (hasShrunk && !isSmaller) {
        inputRef.current?.blur();
      }
      hasShrunk = hasShrunk || isSmaller;
    };
    place();
    viewport.addEventListener('resize', place);
    viewport.addEventListener('scroll', place);
    return () => {
      viewport.removeEventListener('resize', place);
      viewport.removeEventListener('scroll', place);
      bar.style.transform = '';
      document.documentElement.style.removeProperty(INSET_PROPERTY);
    };
  }, [isOpen, inputRef]);

  const keepFocus = (event: React.MouseEvent | React.PointerEvent): void => {
    event.preventDefault();
  };

  return (
    <div ref={barRef} className={cx(styles.wrap, isOpen && styles.open)} aria-hidden={!isOpen}>
      {strip.length > 0 && (
        <div className={styles.strip} role="group" aria-label={t('notizblock.personen')}>
          {strip.map((person) => {
            const entry = entries[person.id];
            const isActive = target?.person.id === person.id;
            return (
              <PressableButton
                key={person.id}
                type="button"
                tabIndex={isOpen ? 0 : -1}
                className={cx(
                  styles.chip,
                  entry !== undefined && styles.done,
                  isActive && styles.on,
                )}
                aria-label={person.name}
                aria-pressed={isActive}
                onMouseDown={keepFocus}
                onPointerDown={keepFocus}
                onClick={() => {
                  onPerson(person.id);
                }}
              >
                <span
                  className={styles.seat}
                  style={{ background: `var(--color-group-${person.groupColor})` }}
                  aria-hidden="true"
                >
                  {person.name.slice(0, 1)}
                </span>
                <span>{entry === undefined ? t('notizblock.leer') : formatPadNumber(entry)}</span>
              </PressableButton>
            );
          })}
        </div>
      )}
      <div className={styles.bar}>
        {target !== null && (
          <span
            className={cx(styles.seat, styles.big)}
            style={{ background: `var(--color-group-${target.person.groupColor})` }}
            aria-hidden="true"
          >
            {target.person.name.slice(0, 1)}
          </span>
        )}
        <span className={styles.who}>
          <strong>{target?.person.name}</strong>
          <small className={cx(error !== null && styles.error)}>{error ?? target?.subtitle}</small>
        </span>
        <input
          ref={inputRef}
          className={styles.value}
          type="text"
          inputMode="numeric"
          enterKeyHint={isLast ? 'done' : 'next'}
          autoComplete="off"
          tabIndex={isOpen ? 0 : -1}
          placeholder={t('notizblock.keineZahl')}
          aria-label={
            target === null
              ? t('notizblock.titel')
              : t('notizblock.feld', { name: target.person.name, was: target.subtitle })
          }
          aria-invalid={error !== null}
          value={value}
          onChange={(event) => {
            const text = cleaned(event.target.value);
            if (text !== null) {
              onValue(text);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onEnter();
            }
          }}
          onBlur={(event) => {
            onClose(event.relatedTarget);
          }}
        />
        <PressableButton
          type="button"
          tabIndex={isOpen ? 0 : -1}
          className={styles.sign}
          aria-label={t('notizblock.vorzeichen')}
          onMouseDown={keepFocus}
          onPointerDown={keepFocus}
          onClick={() => {
            onValue(toggledSign(value));
          }}
        >
          {t('notizblock.plusMinus')}
        </PressableButton>
      </div>
    </div>
  );
}
