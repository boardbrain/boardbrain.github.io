import {
  cacheKeyFor,
  cacheNameFor,
  isOutdatedCache,
  precacheUrls,
  type PrecacheEntry,
} from './precache';

// Minimal service worker of increment I1 (Architecture 11, 18.1): stores every file of the build
// in its own cache and answers offline-first, so the app can be installed and starts in flight
// mode (NFA-PL-03). A new build waits until all windows of the app are closed, as browsers do by
// default. The controlled switch with pointer and confirmation (ADR-015, US-UP-01) replaces this
// in increment I4. No app logic here (Architecture 11.2).

// The name of the list is fixed by vite-plugin-pwa; Record keeps it out of the naming rules.
declare const self: ServiceWorkerGlobalScope &
  Readonly<Record<'__WB_MANIFEST', readonly PrecacheEntry[]>>;

// vite-plugin-pwa replaces self.__WB_MANIFEST with the list of files of the build.
const manifest = self.__WB_MANIFEST;
const cacheName = cacheNameFor(manifest);
const scope = self.registration.scope;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => cache.addAll(precacheUrls(manifest, scope))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => isOutdatedCache(name, cacheName))
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const key = cacheKeyFor(event.request, scope);
  if (key === null) {
    return;
  }
  event.respondWith(
    caches
      .open(cacheName)
      .then((cache) => cache.match(key))
      .then((cached) => cached ?? fetch(event.request)),
  );
});
