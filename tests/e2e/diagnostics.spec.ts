import { expect, test } from './fixtures';

test.describe('Architecture 13.1, K-9 diagnostics view', () => {
  test('is reachable via #/diagnose but not part of the navigation', async ({ page }) => {
    await page.goto('/#/diagnose');

    await expect(page.getByRole('heading', { name: 'Diagnose' })).toBeVisible();
    const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });
    await expect(navigation.getByRole('link', { name: 'Diagnose' })).toHaveCount(0);
  });

  test('shows summary, version, device and all requirements as available', async ({ page }) => {
    await page.goto('/#/diagnose');

    await expect(page.getByRole('region', { name: 'Zusammenfassung' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bericht kopieren' })).toBeVisible();
    const app = page.getByRole('region', { name: 'App' });
    await expect(app.getByText(/^\d+\.\d+\.\d+$/)).toBeVisible();
    const device = page.getByRole('region', { name: 'Gerät' });
    await expect(device.getByText(/^\d+ × \d+ px · [\d,]+-fach$/)).toBeVisible();
    const checks = page.getByRole('region', { name: 'Voraussetzungen' });
    await expect(checks.getByText('vorhanden')).toHaveCount(6);
    await expect(checks.getByText('fehlt')).toHaveCount(0);
  });

  test('K-9 dice test: rolls with the random source of the device', async ({ page }) => {
    await page.goto('/#/diagnose');

    await page.getByRole('button', { name: 'Würfeltest starten' }).click();

    const bars = page.getByRole('list', { name: 'Häufigkeit je Augenzahl' });
    await expect(bars.getByRole('listitem')).toHaveCount(6);
    await expect(page.getByText(/^60\.000 Würfe mit dem Zufall dieses Geräts · χ² /)).toBeVisible();
  });

  test('NFA-PL-04: content fits the screen without horizontal scrolling', async ({ page }) => {
    await page.goto('/#/diagnose');
    await expect(page.getByRole('heading', { name: 'Diagnose' })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('K-9 recorded errors in the diagnostics', () => {
  // As in errorScreen.spec.ts: the blocked request and the error view's own log line.
  test.use({
    expectedConsoleErrors:
      /^(Failed to load resource|Unexpected error in a view [\s\S]*matchViews)/,
  });

  test('lists an error after the error screen and clears the list', async ({ page }) => {
    await page.route('**/*matchViews*', (route) => route.abort());
    await page.goto('/#/partie/neu');
    await expect(page.getByRole('heading', { name: 'Etwas ist schiefgelaufen' })).toBeVisible();
    await page.unroute('**/*matchViews*');

    await page.goto('/#/diagnose');
    await page.reload();

    const summary = page.getByRole('region', { name: 'Zusammenfassung' });
    await expect(summary.getByText('1 Fehler aufgezeichnet')).toBeVisible();
    const errors = page.getByRole('region', { name: 'Letzte Fehler' });
    await expect(errors.getByText(/#\/partie\/neu · Version/)).toBeVisible();

    await errors.getByRole('button', { name: 'Liste leeren' }).click();

    await expect(errors.getByText('Keine Fehler aufgezeichnet')).toBeVisible();
  });
});
