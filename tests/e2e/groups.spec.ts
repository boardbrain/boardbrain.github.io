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

async function openRoom(page: Page): Promise<void> {
  await page.goto('/#/verwaltung');
  await page.getByRole('link', { name: /^Tische: / }).click();
  await expect(page.getByRole('heading', { name: 'Tische', level: 1 })).toBeVisible();
}

async function openEditor(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Neuer Tisch' }).click();
  await expect(page.getByRole('dialog', { name: 'Neuer Tisch' })).toBeVisible();
}

async function bring(page: Page, ...names: string[]): Promise<void> {
  for (const name of names) {
    await page.getByRole('dialog').getByRole('button', { name, exact: true }).click();
  }
}

test.describe('US-PG-02 and US-PG-03 The room and the editor', () => {
  test('AK-1: tables of 2, 4 and 5 members can be created and survive a reload', async ({
    page,
  }) => {
    await createPersons(page, 'Anna', 'Ben', 'Clara', 'David', 'Eva');
    await openRoom(page);
    const room = page.getByRole('list', { name: 'Alle Tische' });

    await openEditor(page);
    await bring(page, 'Anna', 'Ben');
    await page.getByRole('button', { name: 'Gruppe anlegen' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(room.getByText('Anna & Ben')).toBeVisible();

    await openEditor(page);
    await bring(page, 'Anna', 'Ben', 'Clara', 'David');
    await page.getByRole('button', { name: 'Gruppe anlegen' }).click();
    await expect(room.getByText('Anna, Ben, Clara & David')).toBeVisible();

    await openEditor(page);
    await bring(page, 'Anna', 'Ben', 'Clara', 'David', 'Eva');
    await page.getByRole('button', { name: 'Gruppe anlegen' }).click();
    await expect(room.getByText('Anna, Ben, Clara, David & Eva')).toBeVisible();

    await page.reload();
    await expect(room.getByText('Alle Spiele · 5')).toBeVisible();
    await expect(room.getByText('Alle Spiele · 2')).toBeVisible();
  });

  test('AK-4: Catan is blocked from five members and the reason is given', async ({ page }) => {
    await createPersons(page, 'Anna', 'Ben', 'Clara', 'David', 'Eva');
    await openRoom(page);
    await openEditor(page);

    await bring(page, 'Anna', 'Ben', 'Clara', 'David');
    await expect(page.getByRole('button', { name: 'Nur Catan' })).toBeEnabled();
    await bring(page, 'Eva');

    await expect(page.getByRole('button', { name: 'Nur Catan' })).toBeDisabled();
    await expect(page.getByText(/Catan geht nur mit höchstens 4 Personen/)).toBeVisible();
  });

  test('AK-7: Catan can be excluded, the group then has no Catan colours', async ({ page }) => {
    await createPersons(page, 'Anna', 'Ben', 'Clara');
    await openRoom(page);
    await openEditor(page);
    await bring(page, 'Anna', 'Ben', 'Clara');
    await expect(page.getByRole('group', { name: 'Catan-Farbe von Clara' })).toBeVisible();

    await page.getByRole('switch', { name: /Catan ausschließen/ }).click();

    await expect(page.getByRole('group', { name: /Catan-Farbe/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'Gruppe anlegen' }).click();
    await expect(
      page.getByRole('list', { name: 'Alle Tische' }).getByText('Alle Spiele ohne Catan · 3'),
    ).toBeVisible();
  });

  test('AK-4: a table can be bound to an own game from the folded-out list', async ({ page }) => {
    await page.goto('/#/verwaltung/spiele');
    await page.getByLabel('Name').fill('Uno');
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(
      page.getByRole('region', { name: 'Eigene Spiele' }).getByRole('listitem'),
    ).toHaveText(['Uno']);
    await createPersons(page, 'Anna', 'Ben');
    await openRoom(page);
    await openEditor(page);
    await bring(page, 'Anna', 'Ben');

    await page.getByRole('button', { name: 'Anderes Spiel ▾' }).click();
    await page.getByRole('button', { name: 'Nur Uno' }).click();
    await expect(page.getByRole('button', { name: 'Nur Uno ▾' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByRole('button', { name: 'Gruppe anlegen' }).click();

    await expect(
      page.getByRole('list', { name: 'Alle Tische' }).getByText('Uno · 2'),
    ).toBeVisible();
  });

  test('US-PG-03 AK-5: choosing a taken colour swaps the two persons', async ({ page }) => {
    await createPersons(page, 'Anna', 'Ben');
    await openRoom(page);
    await openEditor(page);
    await bring(page, 'Anna', 'Ben');
    const benColors = page.getByRole('group', { name: 'Gruppenfarbe von Ben' });
    await expect(benColors.getByRole('button', { name: 'Blau' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await benColors.getByRole('button', { name: 'Rot, hat Anna' }).click();

    await expect(benColors.getByRole('button', { name: 'Rot' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(benColors.getByRole('button', { name: 'Blau, hat Anna' })).toBeVisible();
  });

  test('US-VW-05: the lupe searches groups by name and by member', async ({ page }) => {
    await createPersons(page, 'Anna', 'Ben', 'Clara');
    await openRoom(page);
    await openEditor(page);
    await bring(page, 'Anna', 'Ben');
    await page.getByLabel('Gruppenname').fill('Freitag');
    await page.getByRole('button', { name: 'Gruppe anlegen' }).click();
    await openEditor(page);
    await bring(page, 'Ben', 'Clara');
    await page.getByLabel('Gruppenname').fill('Familie');
    await page.getByRole('button', { name: 'Gruppe anlegen' }).click();
    const room = page.getByRole('list', { name: 'Alle Tische' });
    await expect(room.getByText('Familie')).toBeVisible();

    await page.getByRole('button', { name: 'Gruppen suchen' }).click();
    await page.keyboard.type('clara');

    await expect(room.getByText('Clara sitzt hier')).toBeVisible();
    await expect(room.getByText('Freitag')).toHaveCount(0);
    await page.getByRole('button', { name: 'Suche leeren und schließen' }).click();
    await expect(room.getByText('Freitag')).toBeVisible();
  });

  test('the bench expands with a search field', async ({ page }) => {
    await createPersons(page, 'Anna', 'Ben', 'Valentina');
    await openRoom(page);
    await openEditor(page);

    await page.getByRole('button', { name: /^Alle 3/ }).click();
    await page.getByRole('searchbox', { name: 'Person suchen' }).fill('val');

    await expect(page.getByRole('dialog').getByRole('button', { name: 'Valentina' })).toBeVisible();
    await expect(
      page.getByRole('dialog').getByRole('button', { name: 'Anna', exact: true }),
    ).toHaveCount(0);
  });

  test('NFA-PL-04: the editor fits a phone screen without horizontal scrolling', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await createPersons(page, 'Anna', 'Ben', 'Clara', 'David', 'Eva');
    await openRoom(page);
    await openEditor(page);
    await bring(page, 'Anna', 'Ben', 'Clara', 'David', 'Eva');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(0);
  });
});
