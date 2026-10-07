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
 * Verständliche Meldung bei einem unerwarteten Fehler (Entwicklungsrichtlinien 7.2).
 * Die technischen Details werden nur angezeigt, damit man sie in ein Issue kopieren kann;
 * sie werden nie übertragen (NFA-DH-01).
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
