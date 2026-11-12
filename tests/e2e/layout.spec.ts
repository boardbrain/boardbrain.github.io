import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { seedDatabase } from './seedDatabase';
import { useSeededRandom } from './seededRandom';

// The card movements of design I2-E jump to their end, as with "Bewegung reduzieren"; their tempo
// is tested in cardDraw.spec.ts.
test.use({ reducedMotion: 'reduce' });

// Design I2-G (docs/design/i2g-more-room-final-preview.html): no header, the logo only on the
// start, every other view as wide as the screen allows (up to 1280 px) and the back button in
// the same place on every page.

type Box = { x: number; y: number; width: number };

async function backButton(page: Page): Promise<Box> {
  const back = page.getByRole('main').getByRole('button', { name: 'Zurück' });
  await expect(back).toBeVisible();
  const box = await back.boundingBox();
  if (box === null) {
    throw new Error('The back button has no box');
  }
  return box;
}

async function mainWidth(page: Page): Promise<number> {
  const box = await page.getByRole('main').boundingBox();
  if (box === null) {
    throw new Error('The view has no box');
  }
  return box.width;
}

test.describe('Design I2-G more room', () => {
  test('the start shows the logo with the app name, no page has a header', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('main').getByText('BoardBrain', { exact: true })).toBeVisible();
    await expect(page.getByRole('banner')).toHaveCount(0);

    await page.goto('/#/verwaltung/personen');
    await expect(page.getByRole('heading', { level: 1, name: 'Personen' })).toBeVisible();
    await expect(page.getByText('BoardBrain', { exact: true })).toHaveCount(0);
  });

  test('the back button sits in the same place and every view is as wide as the screen', async ({
    page,
  }) => {
    test.slow();
    await useSeededRandom(page, 7);
    await seedDatabase(page, [{ name: 'Spieleabend', members: ['Anna', 'Ben', 'Clara'] }]);
    const width = page.viewportSize()?.width ?? 0;
    const boxes: Box[] = [];
    const visit = async (heading: string): Promise<void> => {
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      boxes.push(await backButton(page));
      // All six devices are narrower than 1280 px: the view fills the width.
      expect(await mainWidth(page)).toBeCloseTo(width, 0);
    };

    await page.goto('/#/verwaltung/personen');
    await visit('Personen');
    await page.goto('/#/verwaltung/gruppen');
    await visit('Tische');
    await page.goto('/#/verwaltung/spiele');
    await visit('Spiele');

    await page.goto('/');
    await page.getByRole('link', { name: 'Partie' }).click();
    await visit('Neue Partie');
    await page.getByRole('link', { name: 'Catan' }).click();
    await visit('Welcher Tisch spielt?');
    await page.getByRole('button', { name: /Spieleabend/ }).click();
    await visit('Wie spielt ihr?');
    await page.getByRole('button', { name: 'Weiter zu den Farben' }).click();
    await visit('Welche Farben?');
    await page.getByRole('button', { name: 'Generierung starten' }).click();
    await visit('Losen');

    const first = boxes[0];
    for (const box of boxes) {
      expect(box.x).toBeCloseTo(first?.x ?? 0, 0);
      expect(box.y).toBeCloseTo(first?.y ?? 0, 0);
    }
  });
});
