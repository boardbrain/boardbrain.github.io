import { use } from 'react';
import { t, type TextKey } from '@/i18n/t';
import type { Diagnostics } from '@/infra/platform/diagnostics';
import styles from './DiagnosticsView.module.css';

type DiagnosticsViewProps = {
  readonly diagnostics: Promise<Diagnostics>;
  readonly version: string;
};

type Check = { readonly label: TextKey; readonly isAvailable: boolean };
type Info = { readonly label: TextKey; readonly value: TextKey };

function yesNoUnknown(isYes: boolean | undefined): TextKey {
  if (isYes === undefined) {
    return 'diagnose.unbekannt';
  }
  return isYes ? 'diagnose.ja' : 'diagnose.nein';
}

/**
 * Diagnoseansicht `#/diagnose` (Architektur 13.1): technische Prüfwerte für die Abnahme
 * auf Geräten. Prüfwerte sind grün oder rot; Installationsstatus und Speicherschutz sind
 * im Browser-Tab erwartungsgemäß „nein“ und werden deshalb neutral als Information gezeigt.
 */
export function DiagnosticsView({ diagnostics, version }: DiagnosticsViewProps): React.JSX.Element {
  const values = use(diagnostics);
  const checks: readonly Check[] = [
    { label: 'diagnose.sichererKontext', isAvailable: values.secureContext },
    { label: 'diagnose.randomUuid', isAvailable: values.randomUuid },
    { label: 'diagnose.serviceWorker', isAvailable: values.serviceWorkerApi },
    { label: 'diagnose.speicherSchnittstelle', isAvailable: values.storageApi },
  ];
  const infos: readonly Info[] = [
    { label: 'diagnose.speicherGeschuetzt', value: yesNoUnknown(values.persisted) },
    { label: 'diagnose.installiert', value: yesNoUnknown(values.installed) },
  ];

  return (
    <main className={styles.view}>
      <h1>{t('diagnose.titel')}</h1>
      <p className={styles.muted}>{t('diagnose.einleitung')}</p>
      <p>{t('diagnose.version', { version })}</p>

      <section aria-labelledby="diagnose-pruefwerte">
        <h2 id="diagnose-pruefwerte">{t('diagnose.pruefwerte')}</h2>
        <dl className={styles.list}>
          {checks.map((check) => (
            <div key={check.label} className={styles.row}>
              <dt>{t(check.label)}</dt>
              <dd className={check.isAvailable ? styles.ok : styles.error}>
                {t(check.isAvailable ? 'diagnose.vorhanden' : 'diagnose.fehlt')}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="diagnose-informationen">
        <h2 id="diagnose-informationen">{t('diagnose.informationen')}</h2>
        <dl className={styles.list}>
          {infos.map((info) => (
            <div key={info.label} className={styles.row}>
              <dt>{t(info.label)}</dt>
              <dd className={styles.info}>{t(info.value)}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
