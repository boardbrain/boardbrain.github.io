import { aPerson } from '@tests/support/masterDataFakes';
import { renderWithApp } from '@tests/support/renderWithApp';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toPersonId } from '@/core/model';
import { createDexieErrorLogStore } from '@/infra/db/errorLogStore';
import type { Diagnostics } from '@/infra/platform/diagnostics';
import { DiagnosticsView } from './DiagnosticsView';
import type { BuildInfo } from './diagnosticsModel';

const ALL_FINE: Diagnostics = {
  secureContext: true,
  randomValues: true,
  randomUuid: true,
  indexedDb: true,
  serviceWorkerApi: true,
  storageApi: true,
  persisted: true,
  storage: { usage: 2_100_000, quota: 9_300_000_000 },
  installed: true,
  offlineReady: true,
  device: {
    browser: 'Brave 142',
    system: 'Android 16',
    userAgent: 'Mozilla/5.0 (Linux; Android 16)',
    language: 'de-DE',
    viewport: { width: 412, height: 915 },
    pixelRatio: 2.625,
    orientation: 'portrait',
    safeArea: { top: 32, right: 0, bottom: 24, left: 0 },
    rootFontSize: 16,
    reducedMotion: false,
    touch: true,
  },
};

const BUILD: BuildInfo = {
  version: '0.1.0',
  commit: 'c41af86',
  builtAt: '2026-11-12T20:07:00.000Z',
  isDevelopment: false,
};

async function renderView(
  diagnostics: Diagnostics = ALL_FINE,
): Promise<ReturnType<typeof renderWithApp>> {
  const view = renderWithApp(
    <DiagnosticsView
      readDiagnostics={() => Promise.resolve(diagnostics)}
      build={BUILD}
      now={() => '2026-11-12T21:00:00.000Z'}
    />,
    { path: '/diagnose' },
  );
  await screen.findByRole('region', { name: 'Zusammenfassung' });
  return view;
}

function stubClipboard(writeText: (text: string) => Promise<void>): void {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

describe('Architecture 13.1, K-9 diagnostics view', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, 'clipboard');
    Reflect.deleteProperty(navigator, 'share');
  });

  it('says everything is fine when nothing deserves attention', async () => {
    await renderView();

    const summary = screen.getByRole('region', { name: 'Zusammenfassung' });
    expect(within(summary).getByText('Alles in Ordnung')).toBeInTheDocument();
    expect(within(summary).queryByRole('list')).not.toBeInTheDocument();
  });

  it('lists the hints of a browser tab', async () => {
    await renderView({ ...ALL_FINE, installed: false, persisted: false, offlineReady: false });

    const summary = screen.getByRole('region', { name: 'Zusammenfassung' });
    expect(within(summary).getByText('3 Hinweise')).toBeInTheDocument();
    expect(within(summary).getByText('Nicht als App installiert')).toBeInTheDocument();
    expect(within(summary).getByText('Speicher nicht geschützt')).toBeInTheDocument();
    expect(within(summary).getByText('Nicht offline bereit')).toBeInTheDocument();
  });

  it('reports a missing requirement in the summary and in red', async () => {
    await renderView({ ...ALL_FINE, secureContext: false });

    const summary = screen.getByRole('region', { name: 'Zusammenfassung' });
    expect(within(summary).getByText('1 Hinweis')).toBeInTheDocument();
    expect(within(summary).getByText('Fehlt: Sicherer Kontext (HTTPS)')).toBeInTheDocument();
    const checks = screen.getByRole('region', { name: 'Voraussetzungen' });
    expect(within(checks).getAllByText('vorhanden')).toHaveLength(5);
    expect(within(checks).getByText('fehlt')).toBeInTheDocument();
  });

  it('shows version, build and the device', async () => {
    await renderView();

    const app = screen.getByRole('region', { name: 'App' });
    expect(within(app).getByText('0.1.0')).toBeInTheDocument();
    expect(within(app).getByText(/^c41af86 · 12\.11\.2026, \d{2}:07$/)).toBeInTheDocument();
    const device = screen.getByRole('region', { name: 'Gerät' });
    expect(within(device).getByText('Brave 142')).toBeInTheDocument();
    expect(within(device).getByText('412 × 915 px · 2,6-fach')).toBeInTheDocument();
    expect(
      within(device).getByText('oben 32 · rechts 0 · unten 24 · links 0 px'),
    ).toBeInTheDocument();
  });

  it('shows counts of the stored data but no names', async () => {
    const { db } = await renderView();

    await act(async () => {
      await db.persons.bulkAdd([
        aPerson({ name: 'Anna' }),
        aPerson({
          id: toPersonId('00000000-0000-4000-8000-0000000000a2'),
          name: 'Ben',
          archived: true,
        }),
      ]);
    });

    const data = screen.getByRole('region', { name: 'Daten' });
    expect(await within(data).findByText('2 · 1 archiviert')).toBeInTheDocument();
    expect(within(data).getByText('2,1 MB von 9,3 GB')).toBeInTheDocument();
    expect(within(data).getByText('keine')).toBeInTheDocument();
    expect(screen.queryByText('Anna')).not.toBeInTheDocument();
  });

  it('K-9 dice test: rolls 60,000 times and shows the frequency of every side', async () => {
    await renderView();

    fireEvent.click(screen.getByRole('button', { name: 'Würfeltest starten' }));

    const bars = screen.getByRole('list', { name: 'Häufigkeit je Augenzahl' });
    expect(within(bars).getAllByRole('listitem')).toHaveLength(6);
    expect(
      screen.getByText(/^60\.000 Würfe mit dem Zufall dieses Geräts · χ² /),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Noch einmal würfeln' })).toBeInTheDocument();
  });

  it('lists recorded errors and clears them', async () => {
    const { db } = await renderView();
    expect(screen.getByText('Keine Fehler aufgezeichnet')).toBeInTheDocument();

    await act(async () => {
      await createDexieErrorLogStore(db).update(() => [
        {
          at: '2026-11-12T19:41:00.000Z',
          address: '#/partie',
          message: 'TypeError: seat is undefined',
          origin: 'at PlacementBand (matchViews.js:1:48)',
          version: '0.1.0',
        },
      ]);
    });

    const errors = screen.getByRole('region', { name: 'Letzte Fehler' });
    expect(await within(errors).findByText('TypeError: seat is undefined')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Zusammenfassung' })).getByText(
        '1 Fehler aufgezeichnet',
      ),
    ).toBeInTheDocument();

    fireEvent.click(within(errors).getByRole('button', { name: 'Liste leeren' }));

    expect(await within(errors).findByText('Keine Fehler aufgezeichnet')).toBeInTheDocument();
  });

  it('copies the report as text', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
    stubClipboard(writeText);
    await renderView({ ...ALL_FINE, installed: false });

    fireEvent.click(screen.getByRole('button', { name: 'Bericht kopieren' }));

    expect(await screen.findByRole('button', { name: 'Kopiert' })).toBeInTheDocument();
    const report = writeText.mock.calls[0]?.[0] ?? '';
    expect(report).toContain('BoardBrain Diagnose');
    expect(report).toContain('Zusammenfassung: 1 Hinweis');
    expect(report).toContain('- Nicht als App installiert');
    expect(report).toContain('Browser: Brave 142');
    expect(report).toContain('Keine Fehler aufgezeichnet');
  });

  it('offers to share the report where the device can share', async () => {
    const share = vi.fn<(data: ShareData) => Promise<void>>(() => Promise.resolve());
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    await renderView();

    fireEvent.click(screen.getByRole('button', { name: 'Bericht teilen' }));

    const shared = share.mock.calls[0]?.[0];
    expect(shared?.title).toBe('BoardBrain Diagnose');
    expect(shared?.text).toContain('Version: 0.1.0');
  });

  it('offers no sharing where the device cannot share', async () => {
    await renderView();

    expect(screen.queryByRole('button', { name: 'Bericht teilen' })).not.toBeInTheDocument();
  });
});
