import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

// US-SP-02 AK-1: "Neues Spiel" on the games page opens its own page (design I3-B).
async function createGame(page: Page, name: string, points?: RegExp): Promise<void> {
  await page.getByRole('link', { name: 'Neues Spiel' }).click();
  const editor = page.getByRole('dialog', { name: 'Neues Spiel' });
  await editor.getByRole('textbox', { name: 'Name des Spiels' }).fill(name);
  if (points !== undefined) {
    await editor.getByRole('radio', { name: points }).click();
  }
  await editor.getByRole('button', { name: 'Spiel anlegen' }).click();
  await expect(editor).toHaveCount(0);
}

function cards(page: Page): Locator {
  return page.getByRole('list', { name: 'Spiele' }).getByRole('listitem');
}

test.describe('US-SP-02 Create a custom game', () => {
  test('AK-1, AK-4: the game appears among the games and is still there after a reload', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /^Spiele: / }).click();
    await expect(cards(page)).toHaveText(['Neues Spiel', /^Catan/]);
    await expect(page.getByText('Noch keine eigenen Spiele')).toBeVisible();

    await createGame(page, 'Skyjo', /Wenigste Punkte gewinnen/);

    await expect(cards(page)).toHaveText(['Neues Spiel', /^Catan/, /Skyjo.*wenigste gewinnen/]);
    await page.reload();
    await expect(cards(page)).toHaveText(['Neues Spiel', /^Catan/, /Skyjo/]);
  });

  test('AK-2: a game with the same name, including Catan, is pointed out and not saved', async ({
    page,
  }) => {
    await page.goto('/#/verwaltung/spiele');
    await createGame(page, 'Uno');

    // Checked while typing; saving stays blocked.
    await page.getByRole('link', { name: 'Neues Spiel' }).click();
    const editor = page.getByRole('dialog', { name: 'Neues Spiel' });
    for (const taken of ['uno', 'CATAN']) {
      await editor.getByRole('textbox', { name: 'Name des Spiels' }).fill(taken);
      await expect(editor.getByText('Name gibt es schon')).toBeVisible();
      await expect(editor.getByRole('button', { name: 'Spiel anlegen' })).toBeDisabled();
    }

    await page.reload();
    await expect(cards(page)).toHaveText(['Neues Spiel', /^Catan/, /Uno/]);
  });
});
