/**
 * Part of the browser environment that the diagnostics read. Passed as a parameter so the
 * query can be tested without a browser.
 */
export type DiagnosticsScope = {
  readonly isSecureContext: boolean;
  readonly crypto?: { readonly randomUUID?: unknown } | undefined;
  readonly navigator: {
    readonly serviceWorker?: unknown;
    readonly storage?: { readonly persisted?: () => Promise<boolean> } | undefined;
    readonly standalone?: boolean;
  };
  readonly matchMedia: (query: string) => { readonly matches: boolean };
};

/**
 * Technical check values for acceptance on devices (Architecture 13.1).
 * `persisted` is `undefined` if the browser does not offer the query.
 */
export type Diagnostics = {
  readonly secureContext: boolean;
  readonly randomUuid: boolean;
  readonly serviceWorkerApi: boolean;
  readonly storageApi: boolean;
  readonly persisted: boolean | undefined;
  readonly installed: boolean;
};

async function readPersisted(scope: DiagnosticsScope): Promise<boolean | undefined> {
  const storage = scope.navigator.storage;
  if (storage?.persisted === undefined) {
    return undefined;
  }
  try {
    return await storage.persisted();
  } catch (error: unknown) {
    // Diagnostics must never abort; the value is then treated as unknown.
    console.warn('navigator.storage.persisted() failed', error);
    return undefined;
  }
}

/**
 * Reads the check values without requesting or storing anything. In particular,
 * `navigator.storage.persist()` is not called (setup: no data storage).
 */
export async function readDiagnostics(scope: DiagnosticsScope = window): Promise<Diagnostics> {
  return {
    secureContext: scope.isSecureContext,
    randomUuid: typeof scope.crypto?.randomUUID === 'function',
    serviceWorkerApi: scope.navigator.serviceWorker !== undefined,
    storageApi: scope.navigator.storage?.persisted !== undefined,
    persisted: await readPersisted(scope),
    // Architecture 12.1: standalone display mode, on iOS also navigator.standalone.
    installed:
      scope.matchMedia('(display-mode: standalone)').matches || scope.navigator.standalone === true,
  };
}
