// Pure helpers of the service worker, testable without a browser (Architecture 11).

/**
 * One file of the build as vite-plugin-pwa lists it in `self.__WB_MANIFEST`: with a revision,
 * or as a plain URL if the name already contains a content hash.
 */
export type PrecacheEntry = string | { readonly url: string; readonly revision: string | null };

/**
 * Prefix of all caches of BoardBrain; each build has its own cache (Architecture 11.2).
 */
export const CACHE_PREFIX = 'boardbrain-build-';

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

function entryText(entry: PrecacheEntry): string {
  return typeof entry === 'string' ? entry : `${entry.url}@${entry.revision ?? ''}`;
}

/**
 * Name of the cache of this build: a hash over all files and revisions, so every build gets
 * its own cache.
 */
export function cacheNameFor(manifest: readonly PrecacheEntry[]): string {
  let hash = FNV_OFFSET;
  for (const character of manifest.map(entryText).sort().join('\n')) {
    hash = Math.imul(hash ^ (character.codePointAt(0) ?? 0), FNV_PRIME) >>> 0;
  }
  return `${CACHE_PREFIX}${hash.toString(16).padStart(8, '0')}`;
}

/**
 * Absolute URLs of all files of the build relative to the scope of the service worker, each
 * once: vite-plugin-pwa lists the manifest and its icons twice, and `cache.addAll` rejects
 * duplicates, which would make the installation fail.
 */
export function precacheUrls(manifest: readonly PrecacheEntry[], scope: string): string[] {
  return [
    ...new Set(
      manifest.map((entry) => new URL(typeof entry === 'string' ? entry : entry.url, scope).href),
    ),
  ];
}

/**
 * Whether a cache belongs to an older build of BoardBrain and can go.
 */
export function isOutdatedCache(name: string, currentName: string): boolean {
  return name.startsWith(CACHE_PREFIX) && name !== currentName;
}

/**
 * Which cached file answers a request: the app page for every navigation (hash routing), the
 * file itself for other requests of the own origin, nothing for foreign or non-GET requests.
 */
export function cacheKeyFor(
  request: { readonly url: string; readonly method: string; readonly mode: string },
  scope: string,
): string | null {
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== new URL(scope).origin) {
    return null;
  }
  if (request.mode === 'navigate') {
    return new URL('index.html', scope).href;
  }
  url.hash = '';
  return url.href;
}
