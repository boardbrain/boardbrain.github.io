import { useState, useTransition, type SubmitEvent } from 'react';
import { cleanName, isBlankName } from '@/core/model';
import type { Result } from '@/core/shared';
import { t } from '@/i18n/t';
import { Notice } from '@/ui/components/Notice';
import { UnsavedChangesGuard } from '@/ui/components/UnsavedChangesGuard';
import styles from './RenameForm.module.css';

/**
 * Message after a failed save. With `confirmLabel` the save can be repeated with confirmation,
 * e.g. "Trotzdem umbenennen" for a same-named person (US-PG-01 AK-3).
 */
export type RenameMessage = {
  readonly tone: 'error' | 'warning';
  readonly text: string;
  readonly note?: string;
  readonly confirmLabel?: string;
};

type RenameFormOptions<E extends string> = {
  readonly initialName: string;
  /** Accessible name of the field, e.g. "Neuer Name". */
  readonly fieldLabel: string;
  /** Checked while typing; a message blocks saving (US-VW-06 AK-2). */
  readonly liveError?: (name: string) => string | null;
  readonly save: (name: string, isConfirmed: boolean) => Promise<Result<unknown, E>>;
  readonly messageFor: (error: E, name: string) => RenameMessage;
  /** Called after saving and after cancelling. */
  readonly onClose: () => void;
};

type Submitted<E extends string> = { readonly error: E; readonly name: string };

/**
 * Renaming in place (design I1-F): the field with "Abbrechen | Speichern" takes the place of the
 * profile next to the card, so nothing below moves; messages are shown below the card. Leaving
 * with an unsaved name asks first. Returns the form and the messages for their two places.
 */
export function useRenameForm<E extends string>({
  initialName,
  fieldLabel,
  liveError,
  save,
  messageFor,
  onClose,
}: RenameFormOptions<E>): { form: React.JSX.Element; notices: React.JSX.Element | null } {
  const [name, setName] = useState(initialName);
  const [submitted, setSubmitted] = useState<Submitted<E> | null>(null);
  const [isPending, startTransition] = useTransition();
  const blockingError = liveError?.(name) ?? null;
  const isChanged = cleanName(name) !== initialName;
  const canSave = isChanged && !isBlankName(name) && blockingError === null && !isPending;
  const message = submitted?.name === name ? messageFor(submitted.error, cleanName(name)) : null;

  function submit(isConfirmed: boolean): void {
    // Unexpected errors in the transition reach the error boundary of the view (ADR-025).
    const value = name;
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

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (canSave) {
      submit(false);
    }
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

  const hasNotices = blockingError !== null || message !== null;
  const notices = hasNotices ? (
    <div className={styles.notices}>
      {blockingError !== null && (
        <Notice tone="error">
          <p>{blockingError}</p>
        </Notice>
      )}
      {message !== null && (
        <Notice tone={message.tone}>
          <p>{message.text}</p>
          {message.note !== undefined && <p className={styles.note}>{message.note}</p>}
          {message.confirmLabel !== undefined && (
            <button
              type="button"
              className={styles.confirm}
              disabled={isPending}
              onClick={() => {
                submit(true);
              }}
            >
              {message.confirmLabel}
            </button>
          )}
        </Notice>
      )}
    </div>
  ) : null;

  return { form, notices };
}
