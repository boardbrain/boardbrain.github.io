/**
 * Ausschnitt der Browser-Umgebung, den die Diagnose liest. Als Parameter übergeben,
 * damit sich die Abfrage ohne Browser testen lässt.
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
 * Technische Prüfwerte für die Abnahme auf Geräten (Architektur 13.1).
 * `persisted` ist `undefined`, wenn der Browser die Abfrage nicht anbietet.
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
    // Diagnose soll nie abbrechen; der Wert gilt dann als unbekannt.
    console.warn('navigator.storage.persisted() ist fehlgeschlagen', error);
    return undefined;
  }
}

/**
 * Liest die Prüfwerte, ohne etwas anzufordern oder zu speichern. Insbesondere wird
 * `navigator.storage.persist()` nicht aufgerufen (Setup: keine Datenspeicherung).
 */
export async function readDiagnostics(scope: DiagnosticsScope = window): Promise<Diagnostics> {
  return {
    secureContext: scope.isSecureContext,
    randomUuid: typeof scope.crypto?.randomUUID === 'function',
    serviceWorkerApi: scope.navigator.serviceWorker !== undefined,
    storageApi: scope.navigator.storage?.persisted !== undefined,
    persisted: await readPersisted(scope),
    // Architektur 12.1: Standalone-Anzeige, unter iOS zusätzlich navigator.standalone.
    installed:
      scope.matchMedia('(display-mode: standalone)').matches || scope.navigator.standalone === true,
  };
}
