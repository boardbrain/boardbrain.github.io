import { expect, test } from './fixtures';

test.describe('Architecture 13.1 diagnostics view', () => {
  test('the start address redirects to #/diagnose', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/#\/diagnose$/);
    await expect(page.getByRole('heading', { name: 'Diagnose' })).toBeVisible();
  });

  test('shows the version and all check values as available', async ({ page }) => {
    await page.goto('/#/diagnose');

    await expect(page.getByText(/^Version \d+\.\d+\.\d+$/)).toBeVisible();
    const checks = page.getByRole('region', { name: 'Prüfwerte' });
    await expect(checks.getByText('vorhanden')).toHaveCount(4);
    await expect(checks.getByText('fehlt')).toHaveCount(0);
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
