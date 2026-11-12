import { describe, expect, it, vi } from 'vitest';
import { readDiagnostics, type DiagnosticsScope, type StyleProbe } from './diagnostics';

const ANDROID =
  'Mozilla/5.0 (Linux; Android 16; SM-S941B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36';

const BASE_NAVIGATOR: DiagnosticsScope['navigator'] = {
  userAgent: ANDROID,
  language: 'de-DE',
  maxTouchPoints: 5,
};

function aScope(overrides: Partial<DiagnosticsScope> = {}): DiagnosticsScope {
  return {
    isSecureContext: true,
    crypto: {
      randomUUID: () => '00000000-0000-4000-8000-000000000000',
      getRandomValues: () => undefined,
    },
    indexedDB: {},
    innerWidth: 412,
    innerHeight: 915,
    devicePixelRatio: 2.625,
    navigator: {
      ...BASE_NAVIGATOR,
      serviceWorker: {},
      storage: {
        persisted: () => Promise.resolve(false),
        estimate: () => Promise.resolve({ usage: 2048, quota: 1_000_000 }),
      },
    },
    matchMedia: () => ({ matches: false }),
    ...overrides,
  };
}

/** Answers the given media queries with true, all others with false. */
function mediaMatching(...queries: string[]): DiagnosticsScope['matchMedia'] {
  return (query) => ({ matches: queries.includes(query) });
}

const PROBE: StyleProbe = {
  safeArea: () => ({ top: 32, right: 0, bottom: 24, left: 0 }),
  rootFontSize: () => 16,
};

describe('Architecture 13.1, K-9 diagnostics: check values', () => {
  it('reports all interfaces of a secure browser as available', async () => {
    const diagnostics = await readDiagnostics(aScope(), PROBE);

    expect(diagnostics).toMatchObject({
      secureContext: true,
      randomValues: true,
      randomUuid: true,
      indexedDb: true,
      serviceWorkerApi: true,
      storageApi: true,
      persisted: false,
      storage: { usage: 2048, quota: 1_000_000 },
      installed: false,
      offlineReady: false,
    });
  });

  it('reports missing interfaces in an insecure context', async () => {
    const diagnostics = await readDiagnostics(
      aScope({
        isSecureContext: false,
        crypto: {},
        indexedDB: undefined,
        navigator: BASE_NAVIGATOR,
      }),
      PROBE,
    );

    expect(diagnostics).toMatchObject({
      secureContext: false,
      randomValues: false,
      randomUuid: false,
      indexedDb: false,
      serviceWorkerApi: false,
      storageApi: false,
      persisted: undefined,
      storage: undefined,
    });
  });

  it('detects the installed app via the standalone display mode', async () => {
    const diagnostics = await readDiagnostics(
      aScope({ matchMedia: mediaMatching('(display-mode: standalone)') }),
      PROBE,
    );

    expect(diagnostics.installed).toBe(true);
  });

  it('detects the installed app on iOS via navigator.standalone', async () => {
    const diagnostics = await readDiagnostics(
      aScope({ navigator: { ...BASE_NAVIGATOR, standalone: true } }),
      PROBE,
    );

    expect(diagnostics.installed).toBe(true);
  });

  it('NFA-PL-03: reports the app as ready offline once a service worker controls the page', async () => {
    const diagnostics = await readDiagnostics(
      aScope({ navigator: { ...BASE_NAVIGATOR, serviceWorker: { controller: {} } } }),
      PROBE,
    );

    expect(diagnostics.offlineReady).toBe(true);
  });

  it('reports storage values as unknown when the queries fail', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const failing = {
      persisted: () => Promise.reject(new Error('not allowed')),
      estimate: () => Promise.reject(new Error('not allowed')),
    };
    const diagnostics = await readDiagnostics(
      aScope({ navigator: { ...BASE_NAVIGATOR, storage: failing } }),
      PROBE,
    );

    expect(diagnostics.persisted).toBeUndefined();
    expect(diagnostics.storage).toBeUndefined();
    warn.mockRestore();
  });

  it('reports the storage use as unknown when the estimate is incomplete', async () => {
    const diagnostics = await readDiagnostics(
      aScope({
        navigator: {
          ...BASE_NAVIGATOR,
          storage: { estimate: () => Promise.resolve({ usage: 1 }) },
        },
      }),
      PROBE,
    );

    expect(diagnostics.storage).toBeUndefined();
  });
});

describe('K-9 diagnostics: device and display', () => {
  it('describes browser, screen and settings of the device', async () => {
    const diagnostics = await readDiagnostics(
      aScope({
        navigator: { ...BASE_NAVIGATOR, brave: {} },
        matchMedia: mediaMatching(
          '(orientation: portrait)',
          '(prefers-reduced-motion: reduce)',
          '(pointer: coarse)',
        ),
      }),
      PROBE,
    );

    expect(diagnostics.device).toEqual({
      browser: 'Brave 142',
      system: 'Android 16',
      userAgent: ANDROID,
      language: 'de-DE',
      viewport: { width: 412, height: 915 },
      pixelRatio: 2.625,
      orientation: 'portrait',
      safeArea: { top: 32, right: 0, bottom: 24, left: 0 },
      rootFontSize: 16,
      reducedMotion: true,
      touch: true,
    });
  });

  it('reports landscape, mouse and full motion', async () => {
    const diagnostics = await readDiagnostics(aScope(), PROBE);

    expect(diagnostics.device).toMatchObject({
      orientation: 'landscape',
      reducedMotion: false,
      touch: false,
    });
  });
});
