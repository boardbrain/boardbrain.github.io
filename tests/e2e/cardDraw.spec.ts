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
  const twice = TABLE.members.filter(
    (name) => names.filter((other) => other === name).length === 2,
  );
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

// How far the lowest card comes below the places while the next movement plays, in card heights:
// collecting the face-down cards (E1) puts them on a stack below the places; turning one over
// leaves every card on its place (about -1).
async function drawSpinAndMeasureSinking(page: Page): Promise<number> {
  await page.evaluate(() => {
    const record = window as unknown as { sinking: number };
    record.sinking = -Infinity;
    const started = performance.now();
    const tick = (): void => {
      const places = [...document.querySelectorAll<HTMLElement>('[data-stage^="place-"]')];
      const lowest = Math.max(...places.map((place) => place.getBoundingClientRect().bottom));
      for (const card of document.querySelectorAll<HTMLElement>('[data-stage-card]')) {
        const { top, height } = card.getBoundingClientRect();
        record.sinking = Math.max(record.sinking, (top - lowest) / height);
      }
      if (performance.now() - started < 4_000) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });
  await main(page).getByRole('button', { name: 'Losen' }).click();
  await expect(repeatButton(page)).toBeEnabled({ timeout: 10_000 });
  return page.evaluate(() => (window as unknown as { sinking: number }).sinking);
}

async function drawFirstSpin(page: Page): Promise<void> {
  await seedMatch(page, { table: TABLE, steps: 3 });
  await main(page).getByRole('button', { name: 'Losen' }).click();
  await skipButton(page).click();
  await expect(repeatButton(page)).toBeEnabled();
}

test.describe('US-IN-01 AK-3 The order with cards', () => {
  test('E1: after repeating a place, the face-down cards are collected before dealing again', async ({
    page,
  }) => {
    await drawFirstSpin(page);
    await main(page).getByRole('button', { name: 'Losen' }).click();
    await skipButton(page).click();
    // Right after a movement "Wiederholen" ignores taps for a moment (a late tap on "Überspringen").
    const dialog = page.getByRole('alertdialog');
    await expect(async () => {
      if (!(await dialog.isVisible())) {
        await repeatButton(page).click();
      }
      await expect(dialog).toBeVisible({ timeout: 1_000 });
    }).toPass();
    await dialog.getByRole('button', { name: 'Wiederholen' }).click();
    await expect(main(page)).toHaveAttribute('data-page', /^next-/);

    expect(await drawSpinAndMeasureSinking(page)).toBeGreaterThan(0);
  });

  test('E1: back and browsing forward again do not collect the cards', async ({ page }) => {
    await drawFirstSpin(page);
    await page.getByRole('button', { name: 'Zurück' }).click();
    await main(page).getByRole('button', { name: 'Blättern' }).click();
    await expect(main(page)).toHaveAttribute('data-page', /:draw$/);

    expect(await drawSpinAndMeasureSinking(page)).toBeLessThan(-0.5);
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

test.describe('US-AB-03 AK-8 Repeat a piece on the board (design I2-E)', () => {
  test('the pieces taken away fade out, then the page before drawing shows and can be used', async ({
    page,
  }) => {
    await seedMatch(page, { table: TABLE, steps: 6 });
    const losen = main(page).getByRole('button', { name: 'Losen' });
    for (let piece = 0; piece < 2; piece++) {
      await losen.click();
      await expect(losen).toBeEnabled();
    }

    // The dialog shows the marked pieces a second time and closes while they fade on the board.
    await main(page)
      .getByRole('button', { name: /^Siedlung von .* wiederholen$/ })
      .click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Wiederholen' }).click();

    await expect(main(page)).toHaveAttribute('data-page', /^next-6:draw$/);
    await expect(losen).toBeEnabled();
    await expect(main(page).getByRole('button', { name: /wiederholen$/ })).toHaveCount(0);
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
