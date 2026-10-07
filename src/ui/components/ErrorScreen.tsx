import { t } from '@/i18n/t';
import styles from './ErrorScreen.module.css';

type ErrorScreenProps = {
  readonly error: unknown;
};

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack ?? ''}`;
  }
  return typeof error === 'string' ? error : JSON.stringify(error);
}

function handleReload(): void {
  window.location.reload();
}

/**
 * Understandable message for an unexpected error (Development Guidelines 7.2). Technical
 * details are only shown so they can be copied into an issue; they are never transmitted
 * (NFA-DH-01).
 */
export function ErrorScreen({ error }: ErrorScreenProps): React.JSX.Element {
  return (
    <main className={styles.screen} role="alert">
      <h1>{t('fehler.titel')}</h1>
      <p>{t('fehler.text')}</p>
      <button type="button" onClick={handleReload}>
        {t('fehler.neuLaden')}
      </button>
      <details className={styles.details}>
        <summary>{t('fehler.details')}</summary>
        <pre className={styles.trace}>{formatError(error)}</pre>
      </details>
    </main>
  );
}
