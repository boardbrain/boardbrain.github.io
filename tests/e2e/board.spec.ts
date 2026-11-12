import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { seedDatabase } from './seedDatabase';
import { useSeededRandom } from './seededRandom';

// The card movements of design I2-E jump to their end, as with "Bewegung reduzieren"; their tempo
// is tested in cardDraw.spec.ts.
test.use({ reducedMotion: 'reduce' });

type Box = { x: number; y: number; width: number; height: number };

async function boxesOf(locator: Locator): Promise<Box[]> {
  const boxes = await Promise.all((await locator.all()).map((item) => item.boundingBox()));
  return boxes.filter((box) => box !== null);
}

// Groups the hexes into rows by the height of their centre.
function rowLengths(boxes: readonly Box[]): number[] {
  const centers = boxes.map((box) => box.y + box.height / 2).sort((a, b) => a - b);
  const tolerance = (boxes[0]?.height ?? 0) / 4;
  const rows: number[][] = [];
  for (const center of centers) {
    const row = rows.at(-1);
    if (row !== undefined && center - (row[0] ?? 0) < tolerance) {
      row.push(center);
    } else {
      rows.push([center]);
    }
  }
  return rows.map((row) => row.length);
}

const EMPTY_BOARD = 'Brett mit 0 Gebäuden und 0 Straßen';

// Since I2-D the board shows in the placement of a match (#/brett is gone): a match of two
// persons without draws, the order drawn, then the empty board before the first building.
async function openEmptyBoard(page: Page): Promise<void> {
  await useSeededRandom(page, 7);
  await seedDatabase(page, [{ name: 'Zu zweit', members: ['Anna', 'Ben'] }]);
  await page.getByRole('link', { name: 'Partie' }).click();
  await page.getByRole('link', { name: 'Catan' }).click();
  await page.getByRole('button', { name: /^Zu zweit:/ }).click();
  for (const draw of ['Landschaftsfelder', 'Häfen', 'Zahlenchips']) {
    await page.getByRole('switch', { name: draw }).click();
  }
  await page.getByRole('button', { name: 'Weiter zu den Farben' }).click();
  await page.getByRole('button', { name: 'Generierung starten' }).click();
  await page.getByRole('button', { name: 'Losen' }).click();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await expect(page.getByRole('heading', { name: 'Platzierung' })).toBeVisible();
}

test.describe('US-PL-01 board (design I1-D)', () => {
  test('AK-1: shows 19 hexes pointing up in rows of 3, 4, 5, 4 and 3', async ({ page }) => {
    await openEmptyBoard(page);

    await expect(page.getByRole('img', { name: EMPTY_BOARD })).toBeVisible();
    const hexes = page.getByTestId('board-hex');
    await expect(hexes).toHaveCount(19);
    const boxes = await boxesOf(hexes);

    expect(rowLengths(boxes)).toEqual([3, 4, 5, 4, 3]);
    // A hex with its tip up is 2 / √3 times as high as it is wide.
    for (const box of boxes) {
      expect(box.height / box.width).toBeCloseTo(2 / Math.sqrt(3), 1);
    }
  });

  test('AK-3: the whole board is visible without scrolling', async ({ page }) => {
    await openEmptyBoard(page);
    const board = page.getByRole('img', { name: EMPTY_BOARD });
    await expect(board).toBeVisible();

    const viewport = page.viewportSize();
    const boxes = await boxesOf(page.getByTestId('board-hex'));
    expect(boxes).toHaveLength(19);
    for (const box of boxes) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport?.width ?? 0);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport?.height ?? 0);
    }
    const isScrollable = await page.evaluate(
      () => document.documentElement.scrollHeight > document.documentElement.clientHeight,
    );
    expect(isScrollable).toBe(false);
  });
});
