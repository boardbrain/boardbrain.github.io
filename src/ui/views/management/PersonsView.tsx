import { useState, useTransition } from 'react';
import type { NameDuplicateError } from '@/app/services/masterDataService';
import { cleanName, type NameEmptyError } from '@/core/model';
import { usePersons } from '@/infra/db/readHooks';
import { t } from '@/i18n/t';
import { useAppDependencies } from '@/ui/AppDependencies';
import { NameForm } from '@/ui/components/NameForm';
import { NameList } from '@/ui/components/NameList';
import { Notice } from '@/ui/components/Notice';
import { Page } from '@/ui/components/Page';
import styles from './PersonsView.module.css';

// `submitted` is the input the message belongs to; the message is hidden once the input changes.
type Message = {
  readonly error: NameEmptyError | NameDuplicateError;
  readonly submitted: string;
};

/**
 * Person management `#/verwaltung/personen` (US-PG-01): create persons and list all of them.
 * A same-named person is only a hint; saving is possible after confirmation (AK-3).
 */
export function PersonsView(): React.JSX.Element {
  const { db, masterData } = useAppDependencies();
  const persons = usePersons(db);
  const [name, setName] = useState('');
  const [message, setMessage] = useState<Message | null>(null);
  const [isPending, startTransition] = useTransition();

  function save(isDuplicateConfirmed: boolean): void {
    // Unexpected errors in the transition reach the error boundary of the view (ADR-025).
    const submitted = name;
    startTransition(async () => {
      const result = await masterData.createPerson({ name: submitted, isDuplicateConfirmed });
      startTransition(() => {
        if (result.ok) {
          // Keep a name that was typed while saving was still running.
          setName((current) => (current === submitted ? '' : current));
          setMessage(null);
          return;
        }
        setMessage({ error: result.error, submitted });
      });
    });
  }

  const visibleMessage = message?.submitted === name ? message : null;

  function handleNameChange(value: string): void {
    setName(value);
    setMessage(null);
  }

  return (
    <Page title={t('personen.titel')} backFallback="/verwaltung">
      <NameForm
        title={t('personen.neu')}
        value={name}
        isPending={isPending}
        onValueChange={handleNameChange}
        onSubmit={() => {
          save(false);
        }}
      >
        {visibleMessage?.error === 'name-duplicate' && (
          <Notice tone="warning">
            <p>{t('personen.gleicherName', { name: cleanName(visibleMessage.submitted) })}</p>
            <p>{t('personen.gleicherNameGruppe')}</p>
            <div className={styles.actions}>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  save(true);
                }}
              >
                {t('personen.trotzdemAnlegen')}
              </button>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => {
                  setMessage(null);
                }}
              >
                {t('allgemein.abbrechen')}
              </button>
            </div>
          </Notice>
        )}
        {visibleMessage?.error === 'name-empty' && (
          <Notice tone="error">
            <p>{t('verwaltung.nameLeer')}</p>
          </Notice>
        )}
      </NameForm>
      {persons !== undefined && (
        <NameList label={t('personen.liste')} items={persons} emptyText={t('personen.leer')} />
      )}
    </Page>
  );
}
