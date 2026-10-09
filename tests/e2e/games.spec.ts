import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

async function createGame(page: Page, name: string): Promise<void> {
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: 'Speichern' }).click();
}

test.describe('US-SP-02 Create a custom game', () => {
  test('AK-1: the game appears under "Eigene Spiele" and is still there after a reload', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /^Spiele: / }).click();
    const supported = page.getByRole('region', { name: 'Unterstützte Spiele' });
    const custom = page.getByRole('region', { name: 'Eigene Spiele' });
    await expect(supported.getByRole('listitem')).toHaveText(['Catan']);
    await expect(custom.getByText('Noch keine eigenen Spiele angelegt.')).toBeVisible();

    await createGame(page, 'Uno');

    await expect(custom.getByRole('listitem')).toHaveText(['Uno']);
    await expect(supported.getByRole('listitem')).toHaveText(['Catan']);

    await page.reload();
    await expect(custom.getByRole('listitem')).toHaveText(['Uno']);
  });

  test('AK-2: a game with the same name, including Catan, is pointed out and not saved', async ({
    page,
  }) => {
    await page.goto('/#/verwaltung/spiele');
    const custom = page.getByRole('region', { name: 'Eigene Spiele' });
    await createGame(page, 'Uno');
    await expect(custom.getByRole('listitem')).toHaveText(['Uno']);

    await createGame(page, 'uno');
    await expect(page.getByRole('alert')).toContainText('Es gibt bereits ein Spiel namens „uno“.');

    await createGame(page, 'CATAN');
    await expect(page.getByRole('alert')).toContainText(
      'Es gibt bereits ein Spiel namens „CATAN“.',
    );

    await page.reload();
    await expect(custom.getByRole('listitem')).toHaveText(['Uno']);
  });
});
