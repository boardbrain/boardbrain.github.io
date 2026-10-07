import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

async function createPersons(page: Page, ...names: string[]): Promise<void> {
  await page.goto('/#/verwaltung/personen');
  for (const name of names) {
    await page.getByLabel('Name').fill(name);
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByRole('list', { name: 'Alle Personen' })).toContainText(name);
  }
}

async function openGroups(page: Page): Promise<void> {
  await page.goto('/#/verwaltung');
  await page.getByRole('link', { name: 'Gruppen' }).click();
  await expect(page.getByRole('heading', { name: 'Gruppen', level: 1 })).toBeVisible();
}

test.describe('US-PG-02 and US-PG-03 Create a group with colours', () => {
  test('AK-1: groups of 2, 4 and 5 members can be created and survive a reload', async ({
    page,
  }) => {
    await createPersons(page, 'Anna', 'Ben', 'Clara', 'David', 'Eva');
    await openGroups(page);
    const list = page.getByRole('list', { name: 'Alle Gruppen' });

    await page.getByRole('checkbox', { name: 'Anna' }).check();
    await page.getByRole('checkbox', { name: 'Ben' }).check();
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(list.getByRole('listitem')).toHaveText(['Anna & Ben']);

    for (const name of ['Anna', 'Ben', 'Clara', 'David']) {
      await page.getByRole('checkbox', { name }).check();
    }
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(list.getByRole('listitem')).toHaveCount(2);

    for (const name of ['Anna', 'Ben', 'Clara', 'David', 'Eva']) {
      await page.getByRole('checkbox', { name }).check();
    }
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(list.getByRole('listitem')).toHaveCount(3);

    await page.reload();
    await expect(list.getByRole('listitem')).toHaveCount(3);
  });

  test('AK-4: Catan is blocked from five members and the reason is given', async ({ page }) => {
    await createPersons(page, 'Anna', 'Ben', 'Clara', 'David', 'Eva');
    await openGroups(page);

    for (const name of ['Anna', 'Ben', 'Clara', 'David']) {
      await page.getByRole('checkbox', { name }).check();
    }
    await expect(page.getByRole('radio', { name: 'Catan' })).toBeEnabled();
    await page.getByRole('checkbox', { name: 'Eva' }).check();

    await expect(page.getByRole('radio', { name: 'Catan' })).toBeDisabled();
    await expect(page.getByText(/höchstens 4 Mitgliedern möglich/)).toBeVisible();
  });

  test('US-PG-03 AK-5: choosing a taken colour swaps the two persons', async ({ page }) => {
    await createPersons(page, 'Anna', 'Ben');
    await openGroups(page);
    await page.getByRole('checkbox', { name: 'Anna' }).check();
    await page.getByRole('checkbox', { name: 'Ben' }).check();
    const annaColor = page.getByRole('group', { name: 'Gruppenfarbe von Anna' });
    const benColor = page.getByRole('group', { name: 'Gruppenfarbe von Ben' });
    await expect(annaColor.getByRole('button', { name: 'Rot' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await benColor.getByRole('button', { name: 'Rot' }).click();

    await expect(benColor.getByRole('button', { name: 'Rot' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(annaColor.getByRole('button', { name: 'Blau' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('NFA-PL-04: the form fits a phone screen without horizontal scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await createPersons(page, 'Anna', 'Ben', 'Clara', 'David', 'Eva');
    await openGroups(page);
    for (const name of ['Anna', 'Ben', 'Clara', 'David', 'Eva']) {
      await page.getByRole('checkbox', { name }).check();
    }

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(0);
  });
});
