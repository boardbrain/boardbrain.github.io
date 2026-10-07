import { act, render, screen, within } from '@testing-library/react';
import { Suspense } from 'react';
import { describe, expect, it } from 'vitest';
import type { Diagnostics } from '@/infra/platform/diagnostics';
import { DiagnosticsView } from './DiagnosticsView';

const ALL_AVAILABLE: Diagnostics = {
  secureContext: true,
  randomUuid: true,
  serviceWorkerApi: true,
  storageApi: true,
  persisted: false,
  installed: false,
};

async function renderView(diagnostics: Diagnostics): Promise<void> {
  // Die Ansicht wartet mit use() auf die Prüfwerte; act wartet, bis sie dargestellt sind.
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <DiagnosticsView diagnostics={Promise.resolve(diagnostics)} version="0.1.0" />
      </Suspense>,
    );
    await Promise.resolve();
  });
  await screen.findByRole('heading', { name: 'Diagnose' });
}

describe('Architektur 13.1 Diagnoseansicht', () => {
  it('zeigt Überschrift und Version', async () => {
    await renderView(ALL_AVAILABLE);

    expect(screen.getByText('Version 0.1.0')).toBeInTheDocument();
  });

  it('zeigt alle Prüfwerte als vorhanden', async () => {
    await renderView(ALL_AVAILABLE);

    const checks = screen.getByRole('region', { name: 'Prüfwerte' });
    expect(within(checks).getAllByText('vorhanden')).toHaveLength(4);
    expect(within(checks).queryByText('fehlt')).not.toBeInTheDocument();
  });

  it('meldet einen fehlenden Prüfwert', async () => {
    await renderView({ ...ALL_AVAILABLE, secureContext: false });

    const checks = screen.getByRole('region', { name: 'Prüfwerte' });
    expect(within(checks).getByText('fehlt')).toBeInTheDocument();
  });

  it('zeigt Speicherschutz und Installationsstatus als Information', async () => {
    await renderView({ ...ALL_AVAILABLE, persisted: undefined, installed: true });

    const infos = screen.getByRole('region', { name: 'Informationen' });
    expect(within(infos).getByText('unbekannt')).toBeInTheDocument();
    expect(within(infos).getByText('ja')).toBeInTheDocument();
  });
});
