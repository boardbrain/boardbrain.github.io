import type { APIRequestContext } from '@playwright/test';
import { expect, test } from './fixtures';

type ManifestIcon = { src: string; sizes: string; type: string; purpose: string };
type Manifest = Record<string, unknown> & { icons: ManifestIcon[] };

// Width and height from the IHDR chunk of a PNG file, e.g. "192x192".
function pngSize(png: Buffer): string {
  return `${String(png.readUInt32BE(16))}x${String(png.readUInt32BE(20))}`;
}

async function loadPng(request: APIRequestContext, url: string): Promise<string> {
  const response = await request.get(url);
  expect(response.ok(), url).toBe(true);
  expect(response.headers()['content-type']).toBe('image/png');
  return pngSize(await response.body());
}

test.describe('Architecture 12.1 installation (I1-D)', () => {
  test('the manifest describes the app with its icons and colours', async ({ page }) => {
    await page.goto('/');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(href).toBe('/manifest.webmanifest');

    const manifest = (await (await page.request.get('/manifest.webmanifest')).json()) as Manifest;
    expect(manifest).toMatchObject({
      name: 'BoardBrain',
      short_name: 'BoardBrain',
      lang: 'de',
      start_url: '/',
      scope: '/',
      display: 'standalone',
    });
    // E-29: no orientation lock in the manifest; tablets turn freely.
    expect(manifest).not.toHaveProperty('orientation');
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(manifest.theme_color).toBe(themeColor);
    expect(manifest.background_color).toBe(themeColor);

    expect(manifest.icons.map((icon) => icon.purpose)).toEqual(['any', 'any', 'maskable']);
    for (const icon of manifest.icons) {
      expect(await loadPng(page.request, icon.src)).toBe(icon.sizes);
    }
  });

  test('iOS and iPadOS get their own home screen icon', async ({ page }) => {
    await page.goto('/');

    const href = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
    expect(href).toBe('/icons/apple-touch-icon.png');
    expect(await loadPng(page.request, href ?? '')).toBe('180x180');
  });
});

test.describe('NFA-PL-03 start without network (I1-D)', () => {
  test.use({ serviceWorkers: 'allow' });

  test('after the first visit the app starts and shows its views offline', async ({
    page,
    context,
    browserName,
  }) => {
    // Playwright's WebKit on Windows aborts every reload in offline mode with an internal error,
    // even if a service worker answers it; Safari is checked on the iPad (Abnahme-Checkliste).
    test.skip(browserName === 'webkit', 'offline emulation with service worker needs Chromium');
    await page.goto('/');
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

    await context.setOffline(true);
    await page.reload();

    await expect(page.getByRole('heading', { level: 1, name: 'Start' })).toBeAttached();
    await page.goto('/#/diagnose');
    await expect(page.getByText('Offline bereit (Service Worker aktiv)')).toBeVisible();
    await page.getByRole('link', { name: 'Brett ansehen' }).click();
    await expect(page.getByRole('img', { name: 'Spielbrett mit 19 Feldern' })).toBeVisible();
    await context.setOffline(false);
  });
});
