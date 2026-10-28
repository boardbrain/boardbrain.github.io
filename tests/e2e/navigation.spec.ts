import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

async function overflow(page: Page): Promise<{ horizontal: number; vertical: number }> {
  return page.evaluate(() => ({
    horizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    vertical: document.documentElement.scrollHeight - document.documentElement.clientHeight,
  }));
}

test.describe('Architecture 13.1 app frame and navigation (design D-3)', () => {
  test('the start address shows the start view with the cards', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'Start' })).toBeAttached();
    await expect(page.getByRole('link', { name: /^Personen: / })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Tische: / })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Spiele: / })).toBeVisible();
  });

  test('an unknown address leads to the start view', async ({ page }) => {
    await page.goto('/#/gibt-es-nicht');

    await expect(page).toHaveURL(/#\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Start' })).toBeAttached();
  });

  test('back leads to where the person came from', async ({ page }) => {
    await page.goto('/');
    const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });

    await page.getByRole('link', { name: /^Personen: / }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Personen' })).toBeVisible();
    await expect(navigation.getByRole('link', { name: 'Verwaltung' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await page.getByRole('button', { name: 'Zurück' }).click();
    await expect(page.getByRole('navigation', { name: 'Karten' })).toBeVisible();

    await navigation.getByRole('link', { name: 'Verwaltung' }).click();
    await page.getByRole('link', { name: /^Tische: / }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Tische' })).toBeVisible();
    await page.getByRole('button', { name: 'Zurück' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Verwaltung' })).toBeVisible();

    await page.getByRole('link', { name: /^Spiele: / }).click();
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1, name: 'Verwaltung' })).toBeVisible();

    await navigation.getByRole('link', { name: 'Start' }).click();
    await expect(page.getByRole('navigation', { name: 'Karten' })).toBeVisible();
  });

  test('back on a directly opened page leads to the management overview', async ({ page }) => {
    await page.goto('/#/verwaltung/spiele');

    await page.getByRole('button', { name: 'Zurück' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Verwaltung' })).toBeVisible();
  });

  test('design D-3: the start view fits the screen without scrolling', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /^Spiele: / })).toBeVisible();

    expect(await overflow(page)).toEqual({ horizontal: 0, vertical: 0 });
    const cards = page.getByRole('navigation', { name: 'Karten' });
    const hand = page.getByRole('navigation', { name: 'Hauptnavigation' });
    const cardsBox = await cards.boundingBox();
    const handBox = await hand.boundingBox();
    expect(cardsBox).not.toBeNull();
    expect(handBox).not.toBeNull();
    // The fan sits above the card hand.
    expect((cardsBox?.y ?? 0) + (cardsBox?.height ?? 0)).toBeLessThanOrEqual(handBox?.y ?? 0);
  });

  test('design K-3: off the start view the hand folds, a tap leads straight on, holding fans it out', async ({
    page,
  }) => {
    await page.goto('/');
    const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });
    await expect(navigation).toHaveAttribute('data-state', 'fanned');

    await navigation.getByRole('link', { name: 'Verwaltung' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Verwaltung' })).toBeVisible();
    await expect(navigation).toHaveAttribute('data-state', 'folded');

    // Hold the visible top of the small Start card; the page stays, the whole hand fans out.
    const start = navigation.getByRole('link', { name: 'Start' });
    const box = await start.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move((box?.x ?? 0) + (box?.width ?? 0) / 2, (box?.y ?? 0) + 12);
    await page.mouse.down();
    await page.waitForTimeout(700);
    await page.mouse.up();
    await expect(navigation).toHaveAttribute('data-state', 'open');
    await expect(page.getByRole('heading', { level: 1, name: 'Verwaltung' })).toBeVisible();

    await page
      .getByRole('button', { name: 'Navigation schließen' })
      .click({ position: { x: 20, y: 200 } });
    await expect(navigation).toHaveAttribute('data-state', 'folded');

    await start.click();
    await expect(page.getByRole('navigation', { name: 'Karten' })).toBeVisible();
    await expect(navigation).toHaveAttribute('data-state', 'fanned');
  });

  for (const [path, heading] of [
    ['/#/verwaltung', 'Verwaltung'],
    ['/#/verwaltung/personen', 'Personen'],
    ['/#/verwaltung/spiele', 'Spiele'],
  ] as const) {
    test(`NFA-PL-04: ${heading} fits the screen without horizontal scrolling`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();

      expect((await overflow(page)).horizontal).toBeLessThanOrEqual(0);
    });
  }
});

test.describe('NFA-PL-04 phones in landscape', () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test('show only the hint to turn the phone', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Bitte das Handy hochkant drehen')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toBeHidden();
  });
});
