import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

async function createPerson(page: Page, name: string): Promise<void> {
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: 'Speichern' }).click();
}

test.describe('US-PG-01 Create a person', () => {
  test('AK-1: the person appears in the person list and is still there after a reload', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Personen verwalten' }).click();
    await expect(page.getByText('Noch keine Personen angelegt.')).toBeVisible();

    await createPerson(page, 'Anna');
    await createPerson(page, 'Ben');

    const list = page.getByRole('list', { name: 'Alle Personen' });
    await expect(list.getByRole('listitem')).toHaveText(['Anna', 'Ben']);
    await expect(page.getByLabel('Name')).toHaveValue('');

    await page.reload();
    await expect(list.getByRole('listitem')).toHaveText(['Anna', 'Ben']);
  });

  test('AK-2: saving is impossible with an empty or blank name', async ({ page }) => {
    await page.goto('/#/verwaltung/personen');
    const save = page.getByRole('button', { name: 'Speichern' });

    await expect(save).toBeDisabled();
    await page.getByLabel('Name').fill('   ');
    await expect(save).toBeDisabled();
  });

  test('AK-3: a same-named person is pointed out and saved after confirmation', async ({
    page,
  }) => {
    await page.goto('/#/verwaltung/personen');
    await createPerson(page, 'Anna');
    const list = page.getByRole('list', { name: 'Alle Personen' });
    await expect(list.getByRole('listitem')).toHaveText(['Anna']);

    await createPerson(page, ' anna ');

    await expect(page.getByRole('alert')).toContainText(
      'Es gibt bereits eine Person namens „anna“. Trotzdem anlegen?',
    );
    await expect(list.getByRole('listitem')).toHaveText(['Anna']);

    await page.getByRole('button', { name: 'Trotzdem anlegen' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(list.getByRole('listitem')).toHaveText(['anna', 'Anna']);
  });

  test('AK-3: cancelling the hint saves nothing', async ({ page }) => {
    await page.goto('/#/verwaltung/personen');
    await createPerson(page, 'Anna');
    const list = page.getByRole('list', { name: 'Alle Personen' });
    await expect(list.getByRole('listitem')).toHaveText(['Anna']);

    await createPerson(page, 'ANNA');
    await page.getByRole('button', { name: 'Abbrechen' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.reload();
    await expect(list.getByRole('listitem')).toHaveText(['Anna']);
  });
});
