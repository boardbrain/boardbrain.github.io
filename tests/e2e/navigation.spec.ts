import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

test.describe('Architecture 13.1 app frame and navigation', () => {
  test('the start address shows the start view', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'Start' })).toBeVisible();
  });

  test('an unknown address leads to the start view', async ({ page }) => {
    await page.goto('/#/gibt-es-nicht');

    await expect(page).toHaveURL(/#\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Start' })).toBeVisible();
  });

  test('navigates via the management area to persons and games and back', async ({ page }) => {
    await page.goto('/');
    const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });

    await navigation.getByRole('link', { name: 'Verwaltung' }).click();
    await page.getByRole('link', { name: 'Personen' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Personen' })).toBeVisible();

    await page.goBack();
    await page.getByRole('link', { name: 'Spiele' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Spiele' })).toBeVisible();

    await navigation.getByRole('link', { name: 'Start' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Start' })).toBeVisible();
  });

  for (const [path, heading] of [
    ['/#/', 'Start'],
    ['/#/verwaltung', 'Verwaltung'],
    ['/#/verwaltung/personen', 'Personen'],
    ['/#/verwaltung/spiele', 'Spiele'],
  ] as const) {
    test(`NFA-PL-04: ${heading} fits the screen without horizontal scrolling`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();

      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });
  }
});
