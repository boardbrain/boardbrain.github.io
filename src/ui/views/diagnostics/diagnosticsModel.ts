import type { ErrorLogEntry } from '@/app/ports';
import { DICE_TEST_CRITICAL_VALUE, type DiceTestResult } from '@/core/random';
import { formatBytes, formatDateTime, formatNumber } from '@/i18n/format';
import { t, type TextKey } from '@/i18n/t';
import type { DataSummary, RecordCount } from '@/infra/db/readHooks';
import type { Diagnostics } from '@/infra/platform/diagnostics';

/** What the build tells about itself (K-9). */
export type BuildInfo = {
  readonly version: string;
  /** Short Git commit; empty without Git. */
  readonly commit: string;
  readonly builtAt: string;
  readonly isDevelopment: boolean;
};

/** How a value is shown: a check passed or failed, a neutral piece of information, or text. */
export type Tone = 'ok' | 'error' | 'info' | 'plain';

/** One line of a section, e.g. "Browser: Brave 142". */
export type DiagnosticsRow = {
  readonly label: string;
  readonly value: string;
  readonly tone: Tone;
  /** Long values such as the user agent stand below their label. */
  readonly isLong?: boolean;
};

/** A titled group of lines. */
export type DiagnosticsSection = {
  readonly id: 'app' | 'device' | 'data' | 'checks';
  readonly title: string;
  readonly rows: readonly DiagnosticsRow[];
};

/** Something on this device a tester or the Product Owner should know about. */
export type DiagnosticsHint = { readonly text: string; readonly tone: 'error' | 'warning' };

/** Everything the page and the report are made of. */
export type DiagnosticsInput = {
  readonly diagnostics: Diagnostics;
  readonly build: BuildInfo;
  /** `undefined` while the data are loading. */
  readonly data: DataSummary | undefined;
  readonly errors: readonly ErrorLogEntry[];
};

type Check = { readonly label: TextKey; readonly isAvailable: boolean };

function checksOf(diagnostics: Diagnostics): readonly Check[] {
  return [
    { label: 'diagnose.sichererKontext', isAvailable: diagnostics.secureContext },
    { label: 'diagnose.zufallswerte', isAvailable: diagnostics.randomValues },
    { label: 'diagnose.randomUuid', isAvailable: diagnostics.randomUuid },
    { label: 'diagnose.indexedDb', isAvailable: diagnostics.indexedDb },
    { label: 'diagnose.serviceWorker', isAvailable: diagnostics.serviceWorkerApi },
    { label: 'diagnose.speicherSchnittstelle', isAvailable: diagnostics.storageApi },
  ];
}

function yesNo(isYes: boolean | undefined): string {
  if (isYes === undefined) {
    return t('diagnose.unbekannt');
  }
  return t(isYes ? 'diagnose.ja' : 'diagnose.nein');
}

function row(label: TextKey, value: string, tone: Tone = 'plain'): DiagnosticsRow {
  return { label: t(label), value, tone };
}

function orUnknown(value: string | undefined): string {
  return value ?? t('diagnose.unbekannt');
}

function buildText(build: BuildInfo): string {
  const commit = build.commit === '' ? t('diagnose.unbekannt') : build.commit;
  return build.isDevelopment
    ? `${t('diagnose.buildEntwicklung')} · ${commit}`
    : `${commit} · ${formatDateTime(build.builtAt)}`;
}

function appSection({ diagnostics, build }: DiagnosticsInput): DiagnosticsSection {
  return {
    id: 'app',
    title: t('diagnose.app'),
    rows: [
      row('diagnose.version', build.version),
      row('diagnose.build', buildText(build)),
      row('diagnose.installiert', yesNo(diagnostics.installed), 'info'),
      row('diagnose.offlineBereit', yesNo(diagnostics.offlineReady), 'info'),
    ],
  };
}

function deviceSection({ diagnostics }: DiagnosticsInput): DiagnosticsSection {
  const { device } = diagnostics;
  const safeArea = device.safeArea;
  return {
    id: 'device',
    title: t('diagnose.geraet'),
    rows: [
      row('diagnose.browser', orUnknown(device.browser)),
      row('diagnose.system', orUnknown(device.system)),
      row(
        'diagnose.bildschirm',
        t('diagnose.bildschirmWert', {
          breite: device.viewport.width,
          hoehe: device.viewport.height,
          dichte: formatNumber(device.pixelRatio),
        }),
      ),
      row(
        'diagnose.ausrichtung',
        t(device.orientation === 'portrait' ? 'diagnose.hochformat' : 'diagnose.querformat'),
      ),
      row(
        'diagnose.sichereZonen',
        safeArea === undefined
          ? t('diagnose.unbekannt')
          : t('diagnose.sichereZonenWert', {
              oben: formatNumber(safeArea.top),
              rechts: formatNumber(safeArea.right),
              unten: formatNumber(safeArea.bottom),
              links: formatNumber(safeArea.left),
            }),
      ),
      row(
        'diagnose.schriftgroesse',
        device.rootFontSize === undefined
          ? t('diagnose.unbekannt')
          : t('diagnose.schriftgroesseWert', { groesse: formatNumber(device.rootFontSize) }),
      ),
      row('diagnose.bewegungReduzieren', yesNo(device.reducedMotion), 'info'),
      row('diagnose.bedienung', t(device.touch ? 'diagnose.touch' : 'diagnose.maus')),
      row('diagnose.sprache', device.language),
      { ...row('diagnose.userAgent', device.userAgent), isLong: true },
    ],
  };
}

function countText(count: RecordCount): string {
  return count.archived === 0
    ? String(count.total)
    : t('diagnose.anzahlArchiviert', { anzahl: count.total, archiviert: count.archived });
}

function sessionText(session: DataSummary['session']): string {
  switch (session.status) {
    case 'none':
      return t('diagnose.partieKeine');
    case 'unsupported':
      return t('diagnose.partieAndereVersion');
    case 'active':
      return t(
        session.state === 'generation' ? 'diagnose.partieGenerierung' : 'diagnose.partieLaeuft',
        {
          schritte: session.steps,
        },
      );
  }
}

function dataSection({ diagnostics, data }: DiagnosticsInput): DiagnosticsSection {
  const storage = diagnostics.storage;
  const storageRows = [
    row('diagnose.speicherGeschuetzt', yesNo(diagnostics.persisted), 'info'),
    row(
      'diagnose.speicherBelegt',
      storage === undefined
        ? t('diagnose.unbekannt')
        : t('diagnose.speicherBelegtWert', {
            belegt: formatBytes(storage.usage),
            verfuegbar: formatBytes(storage.quota),
          }),
    ),
  ];
  if (data === undefined) {
    return { id: 'data', title: t('diagnose.daten'), rows: storageRows };
  }
  return {
    id: 'data',
    title: t('diagnose.daten'),
    rows: [
      ...storageRows,
      row('diagnose.datenbank', t('diagnose.datenbankWert', { version: data.schemaVersion })),
      row('diagnose.personen', countText(data.persons)),
      row('diagnose.tische', countText(data.groups)),
      row('diagnose.eigeneSpiele', countText(data.customGames)),
      row('diagnose.laufendePartie', sessionText(data.session)),
      row(
        'diagnose.letzteAenderung',
        data.lastUserDataChangeAt === undefined ? '–' : formatDateTime(data.lastUserDataChangeAt),
      ),
    ],
  };
}

function checksSection({ diagnostics }: DiagnosticsInput): DiagnosticsSection {
  return {
    id: 'checks',
    title: t('diagnose.voraussetzungen'),
    rows: checksOf(diagnostics).map((check) =>
      row(
        check.label,
        t(check.isAvailable ? 'diagnose.vorhanden' : 'diagnose.fehlt'),
        check.isAvailable ? 'ok' : 'error',
      ),
    ),
  };
}

/**
 * The sections of the diagnostics in the order of the page (K-9): app, device, data and the
 * technical requirements. Counts only, no names (NFA-DH-02).
 */
export function diagnosticsSections(input: DiagnosticsInput): readonly DiagnosticsSection[] {
  return [appSection(input), deviceSection(input), dataSection(input), checksSection(input)];
}

/**
 * What deserves attention on this device (K-9): missing requirements first, then what limits
 * the app here. Without a service worker on the development server, "offline" is no hint.
 */
export function diagnosticsHints({
  diagnostics,
  build,
  data,
  errors,
}: DiagnosticsInput): readonly DiagnosticsHint[] {
  const hints: DiagnosticsHint[] = checksOf(diagnostics)
    .filter((check) => !check.isAvailable)
    .map((check) => ({
      text: t('diagnose.hinweisVoraussetzung', { name: t(check.label) }),
      tone: 'error',
    }));
  if (errors.length > 0) {
    hints.push({ text: t('diagnose.hinweisFehler', { anzahl: errors.length }), tone: 'error' });
  }
  if (data?.session.status === 'unsupported') {
    hints.push({ text: t('diagnose.hinweisPartie'), tone: 'warning' });
  }
  if (!diagnostics.installed) {
    hints.push({ text: t('diagnose.hinweisNichtInstalliert'), tone: 'warning' });
  }
  if (diagnostics.persisted === false) {
    hints.push({ text: t('diagnose.hinweisSpeicher'), tone: 'warning' });
  }
  if (!diagnostics.offlineReady && !build.isDevelopment) {
    hints.push({ text: t('diagnose.hinweisOffline'), tone: 'warning' });
  }
  return hints;
}

/** Heading of the summary: everything fine or the number of hints. */
export function hintsTitle(hints: readonly DiagnosticsHint[]): string {
  if (hints.length === 0) {
    return t('diagnose.allesInOrdnung');
  }
  return hints.length === 1
    ? t('diagnose.einHinweis')
    : t('diagnose.hinweise', { anzahl: hints.length });
}

/** One line about a dice test, e.g. "60.000 Würfe · χ² 3,2 · Grenze 20,5 · unauffällig". */
export function diceTestText(result: DiceTestResult): string {
  return [
    t('diagnose.wuerfeltestInfo', { wuerfe: formatNumber(result.rolls) }),
    t('diagnose.wuerfeltestErgebnis', {
      wert: formatNumber(result.chiSquare),
      grenze: formatNumber(DICE_TEST_CRITICAL_VALUE),
    }),
    t(result.isInconspicuous ? 'diagnose.unauffaellig' : 'diagnose.auffaellig'),
  ].join(' · ');
}

/** Where and in which version an error happened, e.g. "12.11.2026, 20:41 · #/partie · …". */
export function errorPlaceText(entry: ErrorLogEntry): string {
  return `${formatDateTime(entry.at)} · ${t('diagnose.fehlerOrt', {
    adresse: entry.address,
    version: entry.version,
  })}`;
}

type ReportInput = DiagnosticsInput & {
  readonly diceTest: DiceTestResult | undefined;
  readonly createdAt: string;
};

/**
 * The diagnostics as plain text for a message to the Product Owner (K-9). It leaves the device
 * only when someone shares or copies it (NFA-DH-02) and contains no names.
 */
export function diagnosticsReport(input: ReportInput): string {
  const hints = diagnosticsHints(input);
  const lines = [
    t('diagnose.berichtTitel'),
    `${t('diagnose.berichtErstellt')}: ${formatDateTime(input.createdAt)}`,
    '',
    `${t('diagnose.zusammenfassung')}: ${hintsTitle(hints)}`,
    ...hints.map((hint) => `- ${hint.text}`),
  ];
  for (const section of diagnosticsSections(input)) {
    lines.push('', section.title, ...section.rows.map((line) => `${line.label}: ${line.value}`));
  }
  if (input.diceTest !== undefined) {
    lines.push(
      '',
      t('diagnose.zufall'),
      `${t('diagnose.wuerfeltest')}: ${diceTestText(input.diceTest)}`,
    );
  }
  lines.push('', t('diagnose.fehler'));
  if (input.errors.length === 0) {
    lines.push(t('diagnose.keineFehler'));
  }
  for (const entry of input.errors) {
    lines.push(
      errorPlaceText(entry),
      entry.message,
      ...(entry.origin === undefined ? [] : [entry.origin]),
    );
  }
  return lines.join('\n');
}
