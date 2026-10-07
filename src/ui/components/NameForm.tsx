import { useId, type ReactNode, type SubmitEvent } from 'react';
import { isBlankName } from '@/core/model';
import { t } from '@/i18n/t';
import styles from './NameForm.module.css';

type NameFormProps = {
  readonly title: string;
  readonly value: string;
  readonly isPending: boolean;
  readonly onValueChange: (value: string) => void;
  readonly onSubmit: () => void;
  /** Hints below the form, e.g. about a duplicate name. */
  readonly children?: ReactNode;
};

/**
 * Form for creating a record by name. Saving is impossible while the name is blank
 * (US-PG-01 AK-2) or a save is still running.
 */
export function NameForm({
  title,
  value,
  isPending,
  onValueChange,
  onSubmit,
  children,
}: NameFormProps): React.JSX.Element {
  const titleId = useId();
  const inputId = useId();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className={styles.form} aria-labelledby={titleId} onSubmit={handleSubmit}>
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
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value);
          }}
        />
        <button type="submit" disabled={isBlankName(value) || isPending}>
          {t('allgemein.speichern')}
        </button>
      </div>
      {children}
    </form>
  );
}
