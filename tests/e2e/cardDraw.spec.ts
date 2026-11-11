import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { seedMatch } from './seedDatabase';
import { useSeededRandom } from './seededRandom';

// Design I2-E: drawing a person with cards, skipping the movement, and a restart during it.
// The movements run at their real tempo here; the other match tests do not wait for them.
test.beforeEach(async ({ page }) => {
  await useSeededRandom(page, 7);
});

const TABLE = { name: 'Freitagsrunde', members: ['Anna', 'Ben', 'Clara', 'David'] };

function main(page: Page): Locator {
  return page.getByRole('main');
}

function skipButton(page: Page): Locator {
  return main(page).getByRole('button', { name: 'Animation überspringen' });
}

function repeatButton(page: Page): Locator {
  return main(page).getByRole('button', { name: 'Wiederholen' });
}

// The person named on the development card, and how often each name lies on the table: the
// person drawn twice (development card and the card on the place), everyone else once.
async function namesOnTable(page: Page): Promise<string[]> {
  return main(page).locator('strong').allTextContents();
}

async function drawnName(page: Page): Promise<string> {
  const names = await namesOnTable(page);
  const twice = TABLE.members.filter((name) => names.filter((other) => other === name).length === 2);
  expect(twice).toHaveLength(1);
  return twice[0] ?? '';
}

async function drawFirstStep(page: Page): Promise<void> {
  await seedMatch(page, { table: TABLE, steps: 0 });
  await expect(main(page).getByText('Wer?')).toBeVisible();
  await main(page).getByRole('button', { name: 'Losen' }).click();
}

test.describe('US-IN-01 Draw with cards', () => {
  test('AK-2: the card on the place is the person drawn; meanwhile only skipping is possible', async ({
    page,
  }) => {
    await drawFirstStep(page);

    // During the movement: "Überspringen" instead of "Wiederholen", the forward button locked.
    await expect(skipButton(page)).toBeVisible();
    await expect(main(page).getByRole('button', { name: /^(Losen|Weiter)$/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Zurück' })).toBeDisabled();

    // Once it is over, the step waits for confirmation as before.
    await expect(repeatButton(page)).toBeEnabled({ timeout: 10_000 });
    const name = await drawnName(page);
    expect(TABLE.members).toContain(name);
  });
});

test.describe('US-IN-04 Skip the animation', () => {
  test('AK-2: skipping shows the result at once; the step still has to be confirmed', async ({
    page,
  }) => {
    await drawFirstStep(page);

    await skipButton(page).click();

    await expect(repeatButton(page)).toBeEnabled({ timeout: 1_000 });
    expect(TABLE.members).toContain(await drawnName(page));
    await expect(main(page).getByRole('button', { name: /^(Losen|Weiter)$/ })).toBeEnabled();
    await expect(main(page)).toHaveAttribute('data-page', /^step-0:/);
  });

  test('AK-3: tapping beside the button changes nothing', async ({ page }) => {
    await drawFirstStep(page);
    await expect(skipButton(page)).toBeVisible();

    const box = await main(page).boundingBox();
    if (box === null) throw new Error('no main');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    await expect(skipButton(page)).toBeVisible();
    await expect(repeatButton(page)).toBeEnabled({ timeout: 10_000 });
    expect(TABLE.members).toContain(await drawnName(page));
  });
});

test.describe('US-AB-05 AK-3 Restart during a movement', () => {
  test('FA-AB-07: an interrupted movement plays again with the same result, a finished one does not', async ({
    page,
  }) => {
    await drawFirstStep(page);
    await expect(skipButton(page)).toBeVisible();

    await page.reload();

    await expect(skipButton(page)).toBeVisible();
    await expect(repeatButton(page)).toBeEnabled({ timeout: 10_000 });
    const name = await drawnName(page);

    await page.reload();

    await expect(repeatButton(page)).toBeEnabled();
    await expect(skipButton(page)).toHaveCount(0);
    expect(await drawnName(page)).toBe(name);
  });
});
