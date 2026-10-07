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

describe('Architecture 13.1 diagnostics view: check values', () => {
  it('reports all interfaces of a secure browser as available', async () => {
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

  it('reports missing interfaces in an insecure context', async () => {
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

  it('detects the installed app via the standalone display mode', async () => {
    const diagnostics = await readDiagnostics(aScope({ matchMedia: () => ({ matches: true }) }));

    expect(diagnostics.installed).toBe(true);
  });

  it('detects the installed app on iOS via navigator.standalone', async () => {
    const diagnostics = await readDiagnostics(aScope({ navigator: { standalone: true } }));

    expect(diagnostics.installed).toBe(true);
  });

  it('reports storage protection as unknown when the query fails', async () => {
    const failing = { persisted: () => Promise.reject(new Error('not allowed')) };
    const diagnostics = await readDiagnostics(aScope({ navigator: { storage: failing } }));

    expect(diagnostics.persisted).toBeUndefined();
  });
});
