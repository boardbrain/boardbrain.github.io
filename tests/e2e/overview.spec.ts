import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

async function createPersons(page: Page, ...names: string[]): Promise<void> {
  await page.goto('/#/verwaltung/personen');
  for (const name of names) {
    await page.getByLabel('Name').fill(name);
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(
      page.getByRole('list', { name: 'Alle Personen' }).getByRole('link', { name: `${name}:` }),
    ).toBeVisible();
  }
}

async function createTable(page: Page, ...names: string[]): Promise<void> {
  await page.goto('/#/verwaltung/gruppen');
  await page.getByRole('button', { name: 'Neuer Tisch' }).click();
  const editor = page.getByRole('dialog', { name: 'Neuer Tisch' });
  for (const name of names) {
    await editor.getByRole('button', { name, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Gruppe anlegen' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

test.describe('US-VW-05 Persons and tables in the overview', () => {
  test('AK-1 to AK-5: from the person list to a table, to a member and back', async ({ page }) => {
    await createPersons(page, 'Anna', 'Ben', 'Clara');
    await createTable(page, 'Anna', 'Ben');

    // AK-1: the person list names the tables or says that someone sits at none.
    await page.goto('/#/verwaltung');
    await page.getByRole('link', { name: /^Personen: / }).click();
    const cards = page.getByRole('list', { name: 'Alle Personen' });
    await expect(cards.getByRole('link', { name: 'Anna: Anna & Ben' })).toBeVisible();
    await expect(cards.getByRole('link', { name: 'Clara: an keinem Tisch' })).toBeVisible();

    // AK-2: a person opens her page with her tables.
    await cards.getByRole('link', { name: 'Anna: Anna & Ben' }).click();
    await expect(page.getByRole('heading', { name: 'Anna', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tische · 1', level: 2 })).toBeVisible();

    // AK-3: the table opens the table page with binding, members and colours.
    await page.getByRole('list', { name: 'Tische' }).getByRole('link').click();
    await expect(page.getByRole('heading', { name: 'Anna & Ben', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Am Tisch · 2', level: 2 })).toBeVisible();
    await expect(page).toHaveURL(/#\/verwaltung\/gruppen\/[0-9a-f-]{36}$/);

    // AK-4: a seat at the table opens the member's page.
    await page.getByRole('link', { name: 'Ben, Blau' }).click();
    await expect(page.getByRole('heading', { name: 'Ben', level: 1 })).toBeVisible();

    // AK-5: back with the button and with the browser (like the Android back key).
    await page.getByRole('button', { name: 'Zurück' }).click();
    await expect(page.getByRole('heading', { name: 'Anna & Ben', level: 1 })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Anna', level: 1 })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Personen', level: 1 })).toBeVisible();
  });

  test('AK-3: a table in the room opens its page, also after a reload', async ({ page }) => {
    await createPersons(page, 'Anna', 'Ben');
    await createTable(page, 'Anna', 'Ben');

    await page.getByRole('list', { name: 'Alle Tische' }).getByRole('link').click();
    await expect(page.getByRole('heading', { name: 'Anna & Ben', level: 1 })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Anna & Ben', level: 1 })).toBeVisible();
    await page.getByRole('button', { name: 'Zurück' }).click();
    await expect(page.getByRole('heading', { name: 'Tische', level: 1 })).toBeVisible();
  });

  test('an unknown address shows a hint instead of a person', async ({ page }) => {
    await page.goto('/#/verwaltung/personen/gibt-es-nicht');

    await expect(page.getByText('Diese Person gibt es nicht.')).toBeVisible();
  });
});
