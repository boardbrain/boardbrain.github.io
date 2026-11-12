import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { seedMatch } from './seedDatabase';
import { useSeededRandom } from './seededRandom';

// Design D-2: the highlighting before a piece is fixed and the tension mode, at their real tempo.
// The other match tests do not wait for them.
test.beforeEach(async ({ page }) => {
  await useSeededRandom(page, 7);
});

const TABLE = { name: 'Freitagsrunde', members: ['Anna', 'Ben', 'Clara', 'David'] };
// Three person draws and three spins of the order come first: step 6 is the first building, step
// 7 its road.
const FIRST_BUILDING = 6;
const FIRST_ROAD = 7;

function main(page: Page): Locator {
  return page.getByRole('main');
}

function tensionSwitch(page: Page): Locator {
  return main(page).getByRole('button', { name: 'Spannungsmodus' });
}

function settlements(page: Page): Locator {
  return main(page).getByTestId('board-settlement');
}

async function openPlacement(page: Page, steps: number): Promise<void> {
  await seedMatch(page, { table: TABLE, steps });
  await expect(main(page).getByRole('button', { name: 'Losen' })).toBeEnabled();
}

test.describe('US-IN-02 Highlighting at the placement (design D-2)', () => {
  test('AK-1, AK-4: a light runs over the valid places, then the piece is set', async ({
    page,
  }) => {
    await openPlacement(page, FIRST_BUILDING);
    await main(page).getByRole('button', { name: 'Losen' }).click();

    // Stored already, but shown only once the light has landed; meanwhile only skipping works.
    await expect(main(page).getByTestId('highlight')).toHaveAttribute('data-highlight', 'run');
    await expect(settlements(page)).toHaveCount(0);
    await expect(main(page).getByRole('button', { name: 'Animation überspringen' })).toBeVisible();
    await expect(tensionSwitch(page)).toBeDisabled();

    await expect(main(page).getByTestId('highlight')).toHaveCount(0, { timeout: 10_000 });
    await expect(settlements(page)).toHaveCount(1);
    await expect(
      main(page).getByRole('button', { name: 'Wiederholen', exact: true }),
    ).toBeEnabled();
  });

  test('AK-5: the switch turns the tension mode on and off and is off after a restart', async ({
    page,
  }) => {
    await openPlacement(page, FIRST_BUILDING);
    await expect(tensionSwitch(page)).toHaveAttribute('aria-pressed', 'false');

    await tensionSwitch(page).click();
    await expect(tensionSwitch(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(main(page).getByText('Spannung an')).toBeVisible();

    await tensionSwitch(page).click();
    await expect(tensionSwitch(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(main(page).getByText('Spannung aus')).toBeVisible();

    await tensionSwitch(page).click();
    await page.reload();
    await expect(tensionSwitch(page)).toHaveAttribute('aria-pressed', 'false');
  });

  test('AK-6: with tension a building stops at two places, and "Duell" decides', async ({
    page,
  }) => {
    await openPlacement(page, FIRST_BUILDING);
    await tensionSwitch(page).click();
    await main(page).getByRole('button', { name: 'Losen' }).click();

    await expect(main(page).getByTestId('highlight')).toHaveAttribute('data-highlight', 'tension');
    const duel = main(page).getByRole('button', { name: 'Duell' });
    await expect(duel).toBeEnabled({ timeout: 10_000 });
    await expect(main(page).getByText('Zwei übrig')).toBeVisible();
    await expect(settlements(page)).toHaveCount(0);
    // The stop waits: the piece only comes after "Duell".
    await page.waitForTimeout(500);
    await expect(settlements(page)).toHaveCount(0);

    await duel.click();
    await expect(main(page).getByText('Zwei übrig')).toBeHidden();
    await expect(settlements(page)).toHaveCount(1, { timeout: 10_000 });
    await expect(
      main(page).getByRole('button', { name: 'Wiederholen', exact: true }),
    ).toBeEnabled();
    // The switch stays on for the next piece.
    await expect(tensionSwitch(page)).toHaveAttribute('aria-pressed', 'true');
  });

  test('AK-7: with tension a road goes out edge by edge, without a stop', async ({ page }) => {
    await openPlacement(page, FIRST_ROAD);
    await tensionSwitch(page).click();
    await main(page).getByRole('button', { name: 'Losen' }).click();

    await expect(main(page).getByTestId('highlight')).toHaveAttribute('data-highlight', 'tension');
    await expect(main(page).getByTestId('board-road')).toHaveCount(0);
    // Without a stop the highlighting ends by itself; there is no "Duell".
    await expect(main(page).getByTestId('board-road')).toHaveCount(1, { timeout: 10_000 });
    await expect(main(page).getByRole('button', { name: 'Duell' })).toHaveCount(0);
    await expect(main(page).getByText('Zwei übrig')).toHaveCount(0);
  });
});

test.describe('US-IN-04 and FA-AB-07 at the stop before the duel (design D-2)', () => {
  test('"Animation überspringen" in the stop shows the piece at once', async ({ page }) => {
    await openPlacement(page, FIRST_BUILDING);
    await tensionSwitch(page).click();
    await main(page).getByRole('button', { name: 'Losen' }).click();
    await expect(main(page).getByRole('button', { name: 'Duell' })).toBeEnabled({
      timeout: 10_000,
    });

    await main(page).getByRole('button', { name: 'Animation überspringen' }).click();

    await expect(settlements(page)).toHaveCount(1);
    await expect(main(page).getByText('Zwei übrig')).toBeHidden();
    await expect(main(page).getByRole('button', { name: 'Losen' })).toBeEnabled();
  });

  test('a restart in the stop plays the highlighting again from the start, without tension', async ({
    page,
  }) => {
    await openPlacement(page, FIRST_BUILDING);
    await tensionSwitch(page).click();
    await main(page).getByRole('button', { name: 'Losen' }).click();
    await expect(main(page).getByRole('button', { name: 'Duell' })).toBeEnabled({
      timeout: 10_000,
    });

    await page.reload();

    await expect(main(page).getByTestId('highlight')).toHaveAttribute('data-highlight', 'run');
    await expect(tensionSwitch(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(settlements(page)).toHaveCount(1, { timeout: 10_000 });
  });
});
