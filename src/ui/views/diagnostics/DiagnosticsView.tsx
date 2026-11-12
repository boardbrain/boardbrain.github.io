import { useEffect, useState } from 'react';
import { DICE_TEST_ROLLS, runDiceTest, type DiceTestResult } from '@/core/random';
import { formatNumber } from '@/i18n/format';
import { t } from '@/i18n/t';
import { useDataSummary, useErrorLog } from '@/infra/db/readHooks';
import type { Diagnostics } from '@/infra/platform/diagnostics';
import { useAppDependencies } from '@/ui/AppDependencies';
import { CheckIcon, CopyIcon, DiceIcon, ShareIcon, WarningIcon } from '@/ui/components/Icons';
import { Page } from '@/ui/components/Page';
import { PillButton } from '@/ui/components/PillButton';
import { PressableButton } from '@/ui/components/Pressable';
import {
  diagnosticsHints,
  diagnosticsReport,
  diagnosticsSections,
  diceTestText,
  errorPlaceText,
  hintsTitle,
  type BuildInfo,
  type DiagnosticsInput,
  type DiagnosticsSection,
  type Tone,
} from './diagnosticsModel';
import styles from './DiagnosticsView.module.css';

const ICON_SIZE = 18;
const PILL_ICON_SIZE = 16;
const COPIED_MS = 2000;

type DiagnosticsViewProps = {
  /** Reads the values of the device; called each time the page opens. */
  readonly readDiagnostics: () => Promise<Diagnostics>;
  readonly build: BuildInfo;
  /** Time the report names; tests pass their own. */
  readonly now?: () => string;
};

const TONE_CLASS: Readonly<Record<Tone, string | undefined>> = {
  ok: styles.ok,
  error: styles.error,
  info: styles.info,
  plain: undefined,
};

function Section({ section }: { readonly section: DiagnosticsSection }): React.JSX.Element {
  const headingId = `diagnose-${section.id}`;
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.sectionTitle}>
        {section.title}
      </h2>
      <dl className={styles.list}>
        {section.rows.map((line) => (
          <div key={line.label} className={line.isLong === true ? styles.longRow : styles.row}>
            <dt>{line.label}</dt>
            <dd className={TONE_CLASS[line.tone]}>{line.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function DiceBars({ result }: { readonly result: DiceTestResult }): React.JSX.Element {
  const highest = Math.max(...result.counts);
  return (
    <ul className={styles.bars} aria-label={t('diagnose.wuerfeltestHaeufigkeiten')}>
      {result.counts.map((count, side) => {
        const label = t('diagnose.augenzahl', { augen: side + 1, anzahl: formatNumber(count) });
        return (
          <li key={label} className={styles.bar} aria-label={label}>
            <span className={styles.barSide} aria-hidden="true">
              {side + 1}
            </span>
            <span className={styles.barTrack} aria-hidden="true">
              <span
                className={styles.barFill}
                style={{ inlineSize: `${String((count / highest) * 100)}%` }}
              />
            </span>
            <span className={styles.barCount} aria-hidden="true">
              {formatNumber(count)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Diagnostics view `#/diagnose` (Architecture 13.1, K-9): what a tester needs to report a
 * problem and what the Product Owner checks during acceptance. A summary names what deserves
 * attention; the report can be shared or copied as text. It shows counts but no names, and
 * nothing leaves the device unless someone shares it (NFA-DH-02).
 */
export function DiagnosticsView({
  readDiagnostics,
  build,
  now = () => new Date().toISOString(),
}: DiagnosticsViewProps): React.JSX.Element {
  const { db, rng, errorLog } = useAppDependencies();
  const [diagnostics, setDiagnostics] = useState<Diagnostics | undefined>();
  const [failure, setFailure] = useState<{ readonly error: unknown } | undefined>();
  const [diceTest, setDiceTest] = useState<DiceTestResult | undefined>();
  const [isCopied, setIsCopied] = useState(false);
  const data = useDataSummary(db);
  const errors = useErrorLog(db) ?? [];

  // External system: the browser interfaces of the device, read anew each time the page opens.
  useEffect(() => {
    let isCurrent = true;
    readDiagnostics().then(
      (values) => {
        if (isCurrent) {
          setDiagnostics(values);
        }
      },
      (error: unknown) => {
        if (isCurrent) {
          setFailure({ error });
        }
      },
    );
    return () => {
      isCurrent = false;
    };
  }, [readDiagnostics]);

  if (failure !== undefined) {
    // The frame route shows the error screen (K-5).
    throw failure.error;
  }
  if (diagnostics === undefined) {
    return <Page title={t('diagnose.titel')} backFallback="/verwaltung" />;
  }

  const input: DiagnosticsInput = { diagnostics, build, data, errors };
  const hints = diagnosticsHints(input);
  const sections = diagnosticsSections(input);
  const canShare = 'share' in navigator;

  function report(): string {
    return diagnosticsReport({ ...input, diceTest, createdAt: now() });
  }

  function handleShare(): void {
    navigator
      .share({ title: t('diagnose.berichtTitel'), text: report() })
      .catch((error: unknown) => {
        // Closing the share sheet is no error.
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        console.error('Sharing the diagnostics failed', error);
      });
  }

  function handleCopy(): void {
    // Inside the promise, so a browser without clipboard access lands in the same branch.
    Promise.resolve()
      .then(() => navigator.clipboard.writeText(report()))
      .then(
        () => {
          setIsCopied(true);
          setTimeout(() => {
            setIsCopied(false);
          }, COPIED_MS);
        },
        (copyError: unknown) => {
          console.error('Copying the diagnostics failed', copyError);
        },
      );
  }

  function handleClearErrors(): void {
    errorLog.clear().catch((error: unknown) => {
      console.error('Clearing the error list failed', error);
    });
  }

  return (
    <Page title={t('diagnose.titel')} intro={t('diagnose.einleitung')} backFallback="/verwaltung">
      <section className={styles.summary} aria-label={t('diagnose.zusammenfassung')}>
        <p className={hints.length === 0 ? styles.statusOk : styles.statusHint}>
          {hints.length === 0 ? <CheckIcon size={ICON_SIZE} /> : <WarningIcon size={ICON_SIZE} />}
          {hintsTitle(hints)}
        </p>
        {hints.length > 0 && (
          <ul className={styles.hints}>
            {hints.map((hint) => (
              <li key={hint.text} className={hint.tone === 'error' ? styles.error : undefined}>
                {hint.text}
              </li>
            ))}
          </ul>
        )}
        <div className={styles.actions}>
          {canShare && (
            <PressableButton type="button" onClick={handleShare}>
              <ShareIcon size={ICON_SIZE} />
              {t('diagnose.teilen')}
            </PressableButton>
          )}
          <PressableButton
            type="button"
            className={canShare ? styles.secondary : undefined}
            onClick={handleCopy}
          >
            {isCopied ? <CheckIcon size={ICON_SIZE} /> : <CopyIcon size={ICON_SIZE} />}
            {isCopied ? t('diagnose.kopiert') : t('diagnose.kopieren')}
          </PressableButton>
        </div>
      </section>

      {/* App, device and data; the dice test follows before the requirements. */}
      {sections.slice(0, 3).map((section) => (
        <Section key={section.id} section={section} />
      ))}

      <section className={styles.section} aria-labelledby="diagnose-zufall">
        <h2 id="diagnose-zufall" className={styles.sectionTitle}>
          {t('diagnose.zufall')}
        </h2>
        <div className={styles.card}>
          {diceTest === undefined ? (
            <p className={styles.muted}>
              {t('diagnose.wuerfeltestInfo', { wuerfe: formatNumber(DICE_TEST_ROLLS) })}
            </p>
          ) : (
            <>
              <DiceBars result={diceTest} />
              <p className={diceTest.isInconspicuous ? styles.ok : styles.error}>
                {diceTestText(diceTest)}
              </p>
            </>
          )}
          <p className={styles.small}>{t('diagnose.wuerfeltestHinweis')}</p>
          <div>
            <PillButton
              icon={<DiceIcon size={PILL_ICON_SIZE} />}
              onClick={() => {
                setDiceTest(runDiceTest(rng));
              }}
            >
              {diceTest === undefined
                ? t('diagnose.wuerfeltestStarten')
                : t('diagnose.wuerfeltestNochmal')}
            </PillButton>
          </div>
        </div>
      </section>

      {sections.slice(3).map((section) => (
        <Section key={section.id} section={section} />
      ))}

      <section className={styles.section} aria-labelledby="diagnose-fehler">
        <h2 id="diagnose-fehler" className={styles.sectionTitle}>
          {t('diagnose.fehler')}
        </h2>
        {errors.length === 0 ? (
          <p className={styles.muted}>{t('diagnose.keineFehler')}</p>
        ) : (
          <>
            <ul className={styles.errors}>
              {errors.map((entry) => (
                <li key={`${entry.at}-${entry.message}`} className={styles.errorEntry}>
                  <span className={styles.small}>{errorPlaceText(entry)}</span>
                  <code className={styles.code}>{entry.message}</code>
                  {entry.origin !== undefined && (
                    <code className={styles.codeMuted}>{entry.origin}</code>
                  )}
                </li>
              ))}
            </ul>
            <div>
              <PillButton onClick={handleClearErrors}>{t('diagnose.fehlerLeeren')}</PillButton>
            </div>
          </>
        )}
      </section>
    </Page>
  );
}
