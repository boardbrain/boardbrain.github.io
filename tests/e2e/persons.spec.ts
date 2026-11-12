import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

async function createPerson(page: Page, name: string): Promise<void> {
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: 'Speichern' }).click();
}

// The person cards in the list, each named "‹Name›: ‹Tische›" (US-VW-05 AK-1).
function personCards(page: Page): Locator {
  return page.getByRole('list', { name: 'Alle Personen' }).getByRole('link');
}

test.describe('US-PG-01 Create a person', () => {
  test('AK-1: the person appears in the person list and is still there after a reload', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /^Personen: / }).click();
    await expect(page.getByText('Noch keine Personen angelegt.')).toBeVisible();

    await createPerson(page, 'Anna');
    await expect(personCards(page)).toHaveCount(1);
    await createPerson(page, 'Ben');

    await expect(personCards(page).nth(0)).toHaveAccessibleName('Anna: an keinem Tisch');
    await expect(personCards(page).nth(1)).toHaveAccessibleName('Ben: an keinem Tisch');
    await expect(page.getByLabel('Name')).toHaveValue('');

    await page.reload();
    await expect(personCards(page)).toHaveCount(2);
  });

  test('AK-2: saving is impossible with an empty or blank name', async ({ page }) => {
    await page.goto('/#/verwaltung/personen');
    const save = page.getByRole('button', { name: 'Speichern' });

    await expect(save).toBeDisabled();
    await page.getByLabel('Name').fill('   ');
    await expect(save).toBeDisabled();
  });

  test('AK-3: a same-named person is an error while typing and cannot be saved', async ({
    page,
  }) => {
    await page.goto('/#/verwaltung/personen');
    await createPerson(page, 'Anna');
    await expect(personCards(page)).toHaveCount(1);

    await page.getByLabel('Name').fill(' anna ');

    await expect(page.getByRole('alert')).toContainText(
      'Es gibt bereits eine Person namens „anna“. Bitte wähle einen anderen Namen.',
    );
    await expect(page.getByRole('button', { name: 'Speichern' })).toBeDisabled();
    await page.getByLabel('Name').press('Enter');
    await page.reload();
    await expect(personCards(page)).toHaveCount(1);
  });
});
