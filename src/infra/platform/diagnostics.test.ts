import { describe, expect, it } from 'vitest';
import { readDiagnostics, type DiagnosticsScope } from './diagnostics';

function aScope(overrides: Partial<DiagnosticsScope> = {}): DiagnosticsScope {
  return {
    isSecureContext: true,
    crypto: { randomUUID: () => '00000000-0000-4000-8000-000000000000' },
    navigator: { serviceWorker: {}, storage: { persisted: () => Promise.resolve(false) } },
    matchMedia: () => ({ matches: false }),
    ...overrides,
  };
}

describe('Architektur 13.1 Diagnoseansicht: Prüfwerte', () => {
  it('meldet alle Schnittstellen eines sicheren Browsers als vorhanden', async () => {
    const diagnostics = await readDiagnostics(aScope());

    expect(diagnostics).toEqual({
      secureContext: true,
      randomUuid: true,
      serviceWorkerApi: true,
      storageApi: true,
      persisted: false,
      installed: false,
    });
  });

  it('meldet fehlende Schnittstellen in einem unsicheren Kontext', async () => {
    const diagnostics = await readDiagnostics(
      aScope({ isSecureContext: false, crypto: {}, navigator: {} }),
    );

    expect(diagnostics).toMatchObject({
      secureContext: false,
      randomUuid: false,
      serviceWorkerApi: false,
      storageApi: false,
      persisted: undefined,
    });
  });

  it('erkennt die installierte App über die Standalone-Anzeige', async () => {
    const diagnostics = await readDiagnostics(aScope({ matchMedia: () => ({ matches: true }) }));

    expect(diagnostics.installed).toBe(true);
  });

  it('erkennt die installierte App unter iOS über navigator.standalone', async () => {
    const diagnostics = await readDiagnostics(aScope({ navigator: { standalone: true } }));

    expect(diagnostics.installed).toBe(true);
  });

  it('meldet den Speicherschutz als unbekannt, wenn die Abfrage scheitert', async () => {
    const failing = { persisted: () => Promise.reject(new Error('nicht erlaubt')) };
    const diagnostics = await readDiagnostics(aScope({ navigator: { storage: failing } }));

    expect(diagnostics.persisted).toBeUndefined();
  });
});
