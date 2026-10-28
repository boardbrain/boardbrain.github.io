import { describe, expect, it } from 'vitest';
import { CACHE_PREFIX, cacheKeyFor, cacheNameFor, isOutdatedCache, precacheUrls } from './precache';

const SCOPE = 'https://boardbrain.github.io/';
const MANIFEST = [
  { url: 'index.html', revision: 'a1' },
  { url: 'assets/index-3f9a2c.js', revision: null },
  'icons/icon-192.png',
];

describe('Architecture 11 service worker of I1-D', () => {
  it('names the cache after the build: same files, same name; changed file, new name', () => {
    const name = cacheNameFor(MANIFEST);

    expect(name).toMatch(new RegExp(`^${CACHE_PREFIX}[0-9a-f]{8}$`));
    expect(cacheNameFor([...MANIFEST].reverse())).toBe(name);
    expect(cacheNameFor([{ url: 'index.html', revision: 'b2' }, ...MANIFEST.slice(1)])).not.toBe(
      name,
    );
  });

  it('turns the file list into absolute URLs within the scope', () => {
    expect(precacheUrls(MANIFEST, SCOPE)).toEqual([
      'https://boardbrain.github.io/index.html',
      'https://boardbrain.github.io/assets/index-3f9a2c.js',
      'https://boardbrain.github.io/icons/icon-192.png',
    ]);
  });

  it('lists every file once, because cache.addAll rejects duplicates', () => {
    const twice = [...MANIFEST, { url: 'icons/icon-192.png', revision: 'c3' }];

    expect(precacheUrls(twice, SCOPE)).toEqual(precacheUrls(MANIFEST, SCOPE));
  });

  it('removes only caches of older builds of BoardBrain', () => {
    const current = cacheNameFor(MANIFEST);

    expect(isOutdatedCache(`${CACHE_PREFIX}00000000`, current)).toBe(true);
    expect(isOutdatedCache(current, current)).toBe(false);
    expect(isOutdatedCache('other-app', current)).toBe(false);
  });

  it('NFA-PL-03: answers every navigation with the app page (hash routing)', () => {
    expect(
      cacheKeyFor({ url: `${SCOPE}#/verwaltung`, method: 'GET', mode: 'navigate' }, SCOPE),
    ).toBe(`${SCOPE}index.html`);
  });

  it('answers files of the own origin from the cache, without the hash', () => {
    expect(
      cacheKeyFor({ url: `${SCOPE}assets/index-3f9a2c.js`, method: 'GET', mode: 'cors' }, SCOPE),
    ).toBe(`${SCOPE}assets/index-3f9a2c.js`);
  });

  it('NFA-DH-01: leaves foreign origins and non-GET requests to the browser', () => {
    expect(
      cacheKeyFor({ url: 'https://example.com/a.js', method: 'GET', mode: 'cors' }, SCOPE),
    ).toBeNull();
    expect(
      cacheKeyFor({ url: `${SCOPE}index.html`, method: 'POST', mode: 'cors' }, SCOPE),
    ).toBeNull();
  });
});
