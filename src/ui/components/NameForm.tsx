import { useReducedMotion } from 'motion/react';
import { useId, useRef, type ReactNode, type SubmitEvent } from 'react';
import { isBlankName } from '@/core/model';
import { t } from '@/i18n/t';
import { cx } from './classNames';
import { Notice } from './Notice';
import { nudgeMissing } from './nudge';
import styles from './NameForm.module.css';
import { PressableButton } from './Pressable';

type NameFormProps = {
  readonly title: string;
  readonly value: string;
  readonly isPending: boolean;
  /** Puts the cursor into the field when the form appears, e.g. after "new person". */
  readonly isFocused?: boolean;
  readonly onValueChange: (value: string) => void;
  readonly onSubmit: () => void;
  /** Found while typing, e.g. a name that is taken; it blocks saving (E-31). */
  readonly error?: string | null;
  /** Hints below the form, e.g. after a failed save. */
  readonly children?: ReactNode;
};

/**
 * Form for creating a record by name. Saving is impossible while the name is blank
 * (US-PG-01 AK-2), an error is shown or a save is still running; the button then only looks
 * disabled and a tap lights up the field.
 */
export function NameForm({
  title,
  value,
  isPending,
  isFocused = false,
  onValueChange,
  onSubmit,
  error = null,
  children,
}: NameFormProps): React.JSX.Element {
  const titleId = useId();
  const inputId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const isReduced = useReducedMotion() === true;
  const isNameMissing = isBlankName(value) || error !== null;
  const canSave = !isNameMissing && !isPending;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (canSave) {
      onSubmit();
      return;
    }
    // Like every form: the button only looks disabled, a tap lights up the name (PO 25.11.2026).
    nudgeMissing(formRef.current, isReduced);
  }

  return (
    <form ref={formRef} className={styles.form} aria-labelledby={titleId} onSubmit={handleSubmit}>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      <label htmlFor={inputId}>{t('allgemein.name')}</label>
      <div className={styles.row}>
        <input
          id={inputId}
          className={styles.input}
          type="text"
          autoComplete="off"
          autoFocus={isFocused}
          data-need={isNameMissing ? '' : undefined}
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value);
          }}
        />
        <PressableButton
          type="submit"
          className={cx(!canSave && styles.looksOff)}
          aria-disabled={!canSave}
        >
          {t('allgemein.speichern')}
        </PressableButton>
      </div>
      {error !== null && (
        <Notice tone="error">
          <p>{error}</p>
        </Notice>
      )}
      {children}
    </form>
  );
}
