import { expect, test } from './fixtures';

test.describe('Architektur 13.1 Diagnoseansicht', () => {
  test('die Startadresse leitet auf #/diagnose um', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/#\/diagnose$/);
    await expect(page.getByRole('heading', { name: 'Diagnose' })).toBeVisible();
  });

  test('zeigt Version und alle Prüfwerte als vorhanden', async ({ page }) => {
    await page.goto('/#/diagnose');

    await expect(page.getByText(/^Version \d+\.\d+\.\d+$/)).toBeVisible();
    const checks = page.getByRole('region', { name: 'Prüfwerte' });
    await expect(checks.getByText('vorhanden')).toHaveCount(4);
    await expect(checks.getByText('fehlt')).toHaveCount(0);
  });

  test('NFA-PL-04: Inhalt passt ohne waagrechtes Scrollen auf den Bildschirm', async ({ page }) => {
    await page.goto('/#/diagnose');
    await expect(page.getByRole('heading', { name: 'Diagnose' })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(0);
  });
});
