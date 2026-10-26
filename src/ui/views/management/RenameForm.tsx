import { useState, useTransition, type SubmitEvent } from 'react';
import { cleanName, isBlankName } from '@/core/model';
import type { Result } from '@/core/shared';
import { t } from '@/i18n/t';
import { Notice } from '@/ui/components/Notice';
import { UnsavedChangesGuard } from '@/ui/components/UnsavedChangesGuard';
import styles from './RenameForm.module.css';

/**
 * Hint that does not block saving, e.g. about a same-named person elsewhere (US-PG-01 AK-3).
 */
export type RenameHint = {
  readonly text: string;
  readonly note?: string;
};

type RenameFormOptions<E extends string> = {
  readonly initialName: string;
  /** Accessible name of the field, e.g. "Neuer Name". */
  readonly fieldLabel: string;
  /** Checked while typing; a message blocks saving (US-VW-06 AK-2, US-VW-07 AK-1). */
  readonly liveError?: (name: string) => string | null;
  /**
   * Checked while typing; a hint is shown, and saving after seeing it counts as the
   * confirmation (US-PG-01 AK-3).
   */
  readonly liveHint?: (name: string) => RenameHint | null;
  readonly save: (name: string, isConfirmed: boolean) => Promise<Result<unknown, E>>;
  /** Text for an error the service still reports, e.g. after a change in the meantime. */
  readonly messageFor: (error: E, name: string) => string;
  /** Called after saving and after cancelling. */
  readonly onClose: () => void;
};

type Submitted<E extends string> = { readonly error: E; readonly name: string };

/**
 * Renaming in place (design I1-F): the field with "Abbrechen | Speichern" takes the place of the
 * profile next to the card, so nothing below moves. Problems are checked while typing and shown
 * below the card; an error blocks saving (decision of the PO). Leaving with an unsaved name asks
 * first. Returns the form and the messages for their two places.
 */
export function useRenameForm<E extends string>({
  initialName,
  fieldLabel,
  liveError,
  liveHint,
  save,
  messageFor,
  onClose,
}: RenameFormOptions<E>): { form: React.JSX.Element; notices: React.JSX.Element | null } {
  const [name, setName] = useState(initialName);
  const [submitted, setSubmitted] = useState<Submitted<E> | null>(null);
  const [isPending, startTransition] = useTransition();
  const isChanged = cleanName(name) !== initialName;
  const blockingError = isBlankName(name) ? t('verwaltung.nameLeer') : (liveError?.(name) ?? null);
  const hint = isChanged && blockingError === null ? (liveHint?.(name) ?? null) : null;
  const canSave = isChanged && blockingError === null && !isPending;
  const savedError = submitted?.name === name ? messageFor(submitted.error, cleanName(name)) : null;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!canSave) {
      return;
    }
    // Unexpected errors in the transition reach the error boundary of the view (ADR-025).
    const value = name;
    const isConfirmed = hint !== null;
    startTransition(async () => {
      const result = await save(value, isConfirmed);
      startTransition(() => {
        if (result.ok) {
          onClose();
          return;
        }
        setSubmitted({ error: result.error, name: value });
      });
    });
  }

  const form = (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        type="text"
        autoComplete="off"
        autoFocus
        aria-label={fieldLabel}
        value={name}
        onChange={(event) => {
          setName(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose();
          }
        }}
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.cancel} onClick={onClose}>
          {t('allgemein.abbrechen')}
        </button>
        <button type="submit" disabled={!canSave}>
          {t('allgemein.speichern')}
        </button>
      </div>
      <UnsavedChangesGuard
        isDirty={isChanged && !isPending}
        text={t('verwerfen.name', { name: cleanName(name) })}
      />
    </form>
  );

  const error = blockingError ?? savedError;
  const notices =
    error !== null || hint !== null ? (
      <div className={styles.notices}>
        {error !== null && (
          <Notice tone="error">
            <p>{error}</p>
          </Notice>
        )}
        {error === null && hint !== null && (
          <Notice tone="warning">
            <p>{hint.text}</p>
            {hint.note !== undefined && <p className={styles.note}>{hint.note}</p>}
          </Notice>
        )}
      </div>
    ) : null;

  return { form, notices };
}
