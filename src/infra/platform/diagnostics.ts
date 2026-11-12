import { describeUserAgent } from './userAgent';

/**
 * Part of the browser environment that the diagnostics read. Passed as a parameter so the
 * query can be tested without a browser.
 */
export type DiagnosticsScope = {
  readonly isSecureContext: boolean;
  readonly crypto?:
    { readonly randomUUID?: unknown; readonly getRandomValues?: unknown } | undefined;
  readonly indexedDB?: unknown;
  readonly innerWidth: number;
  readonly innerHeight: number;
  readonly devicePixelRatio: number;
  readonly navigator: {
    /** `controller` is set as soon as a service worker controls the page. */
    readonly serviceWorker?: { readonly controller?: unknown } | undefined;
    readonly storage?:
      | {
          readonly persisted?: () => Promise<boolean>;
          readonly estimate?: () => Promise<{ readonly usage?: number; readonly quota?: number }>;
        }
      | undefined;
    readonly standalone?: boolean;
    readonly userAgent: string;
    readonly language: string;
    readonly maxTouchPoints: number;
    /** Only Brave has it (K-9). */
    readonly brave?: unknown;
  };
  readonly matchMedia: (query: string) => { readonly matches: boolean };
};

/** Distances to the edges that the device keeps free, e.g. for the status bar, in CSS pixels. */
export type SafeArea = {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
};

/**
 * Values only the rendered page knows. Passed as a parameter so the query can be tested without
 * a browser.
 */
export type StyleProbe = {
  readonly safeArea: () => SafeArea | undefined;
  /** Font size of the page root in CSS pixels; follows the font size of the system. */
  readonly rootFontSize: () => number | undefined;
};

/**
 * Device and display as the diagnostics show them (K-9).
 */
export type DeviceDiagnostics = {
  readonly browser: string | undefined;
  readonly system: string | undefined;
  readonly userAgent: string;
  readonly language: string;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly pixelRatio: number;
  readonly orientation: 'portrait' | 'landscape';
  readonly safeArea: SafeArea | undefined;
  readonly rootFontSize: number | undefined;
  readonly reducedMotion: boolean;
  /** The main pointer is a finger rather than a mouse. */
  readonly touch: boolean;
};

/**
 * Technical values of the device for acceptance and for reports from testers (Architecture
 * 13.1, K-9). `persisted` and `storage` are `undefined` if the browser does not offer the query.
 */
export type Diagnostics = {
  readonly secureContext: boolean;
  /** NFA-ZF-01: the source of every random decision. */
  readonly randomValues: boolean;
  readonly randomUuid: boolean;
  readonly indexedDb: boolean;
  readonly serviceWorkerApi: boolean;
  readonly storageApi: boolean;
  readonly persisted: boolean | undefined;
  readonly storage: { readonly usage: number; readonly quota: number } | undefined;
  readonly installed: boolean;
  /** A service worker controls the page, so the app also starts without a network (NFA-PL-03). */
  readonly offlineReady: boolean;
  readonly device: DeviceDiagnostics;
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

async function readStorage(scope: DiagnosticsScope): Promise<Diagnostics['storage']> {
  const storage = scope.navigator.storage;
  if (storage?.estimate === undefined) {
    return undefined;
  }
  try {
    const { usage, quota } = await storage.estimate();
    return usage === undefined || quota === undefined ? undefined : { usage, quota };
  } catch (error: unknown) {
    console.warn('navigator.storage.estimate() failed', error);
    return undefined;
  }
}

function readDevice(scope: DiagnosticsScope, probe: StyleProbe): DeviceDiagnostics {
  const { navigator } = scope;
  return {
    ...describeUserAgent(navigator.userAgent, {
      isBrave: navigator.brave !== undefined,
      maxTouchPoints: navigator.maxTouchPoints,
    }),
    userAgent: navigator.userAgent,
    language: navigator.language,
    viewport: { width: scope.innerWidth, height: scope.innerHeight },
    pixelRatio: scope.devicePixelRatio,
    orientation: scope.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape',
    safeArea: probe.safeArea(),
    rootFontSize: probe.rootFontSize(),
    reducedMotion: scope.matchMedia('(prefers-reduced-motion: reduce)').matches,
    touch: scope.matchMedia('(pointer: coarse)').matches,
  };
}

function pixels(value: string): number {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

/**
 * Measures with the real page: an invisible element takes the safe area as padding, the root
 * element tells the font size.
 */
export const documentStyleProbe: StyleProbe = {
  safeArea: () => {
    const element = document.createElement('div');
    const { style } = element;
    style.position = 'fixed';
    style.visibility = 'hidden';
    style.pointerEvents = 'none';
    style.paddingTop = 'env(safe-area-inset-top)';
    style.paddingRight = 'env(safe-area-inset-right)';
    style.paddingBottom = 'env(safe-area-inset-bottom)';
    style.paddingLeft = 'env(safe-area-inset-left)';
    document.body.append(element);
    try {
      const computed = getComputedStyle(element);
      return {
        top: pixels(computed.paddingTop),
        right: pixels(computed.paddingRight),
        bottom: pixels(computed.paddingBottom),
        left: pixels(computed.paddingLeft),
      };
    } finally {
      element.remove();
    }
  },
  rootFontSize: () => {
    const size = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    return Number.isFinite(size) ? size : undefined;
  },
};

/**
 * Reads the values without requesting or storing anything. In particular,
 * `navigator.storage.persist()` is not called; that request belongs to the backup (FA-IS-03).
 * Read each time the diagnostics open, so size and orientation are current.
 */
export async function readDiagnostics(
  scope: DiagnosticsScope = window,
  probe: StyleProbe = documentStyleProbe,
): Promise<Diagnostics> {
  const [isPersisted, storage] = await Promise.all([readPersisted(scope), readStorage(scope)]);
  return {
    secureContext: scope.isSecureContext,
    randomValues: typeof scope.crypto?.getRandomValues === 'function',
    randomUuid: typeof scope.crypto?.randomUUID === 'function',
    indexedDb: scope.indexedDB !== undefined && scope.indexedDB !== null,
    serviceWorkerApi: scope.navigator.serviceWorker !== undefined,
    storageApi: scope.navigator.storage?.persisted !== undefined,
    persisted: isPersisted,
    storage,
    // Architecture 12.1: standalone display mode, on iOS also navigator.standalone.
    installed:
      scope.matchMedia('(display-mode: standalone)').matches || scope.navigator.standalone === true,
    offlineReady:
      scope.navigator.serviceWorker?.controller !== undefined &&
      scope.navigator.serviceWorker.controller !== null,
    device: readDevice(scope, probe),
  };
}
