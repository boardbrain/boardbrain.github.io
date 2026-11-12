/**
 * Part of the browser environment needed to register the service worker. Passed as a
 * parameter so the registration can be tested without a browser.
 */
export type ServiceWorkerScope = {
  readonly navigator: {
    readonly serviceWorker?:
      | { readonly register: (url: string, options: { scope: string }) => Promise<unknown> }
      | undefined;
  };
};

/**
 * Address and scope of the service worker that vite-plugin-pwa builds from `src/sw/sw.ts`.
 */
export const SERVICE_WORKER = { url: '/sw.js', scope: '/' } as const;

/**
 * Registers the service worker of the build so the app can be installed and works offline
 * (Architecture 11, 12.1, increment I1). Without the interface (e.g. outside a secure context)
 * nothing happens; a failed registration is reported but never stops the app.
 */
export async function registerServiceWorker(scope: ServiceWorkerScope = window): Promise<void> {
  const container = scope.navigator.serviceWorker;
  if (container === undefined) {
    return;
  }
  try {
    await container.register(SERVICE_WORKER.url, { scope: SERVICE_WORKER.scope });
  } catch (error: unknown) {
    console.warn('Registering the service worker failed', error);
  }
}
