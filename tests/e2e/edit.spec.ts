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

// Through the app, not with page.goto: the router can only hold back a "back" to entries it made
// itself, like after a typed address.
async function openPerson(page: Page, name: string): Promise<void> {
  await page.getByRole('link', { name: 'Verwaltung' }).click();
  await page.getByRole('link', { name: /^Personen: / }).click();
  await page
    .getByRole('list', { name: 'Alle Personen' })
    .getByRole('link', { name: new RegExp(`^${name}:`) })
    .click();
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
}

async function openTable(page: Page, name: string): Promise<void> {
  await page.goto('/#/verwaltung/gruppen');
  await page.getByRole('list', { name: 'Alle Tische' }).getByRole('link', { name }).click();
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
}

test.describe('US-VW-06 Rename a person', () => {
  test('AK-1, AK-2: refuses a name from her table and shows the new name everywhere', async ({
    page,
  }) => {
    await createPersons(page, 'Ana', 'Ben', 'Clara');
    await createTable(page, 'Ana', 'Ben');
    await openPerson(page, 'Ana');

    await page.getByRole('button', { name: 'Umbenennen' }).click();
    const field = page.getByLabel('Neuer Name');
    // AK-2: Ben sits at the same table.
    await field.fill('ben');
    await expect(page.getByRole('alert')).toContainText(
      'Am Tisch „Ana & Ben“ sitzt schon jemand namens „ben“.',
    );
    await expect(page.getByRole('button', { name: 'Speichern' })).toBeDisabled();

    // AK-1: the new name everywhere.
    await field.fill('Anna');
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByRole('heading', { name: 'Anna', level: 1 })).toBeVisible();
    await page.getByRole('list', { name: 'Tische' }).getByRole('link').click();
    await expect(page.getByRole('list', { name: 'Mitglieder' })).toContainText('Anna');
  });

  test('a same-named person outside her tables needs a confirmation', async ({ page }) => {
    await createPersons(page, 'Ana', 'Clara');
    await openPerson(page, 'Ana');

    await page.getByRole('button', { name: 'Umbenennen' }).click();
    await page.getByLabel('Neuer Name').fill('Clara');
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByRole('alert')).toContainText(
      'Es gibt bereits eine Person namens „Clara“. Trotzdem umbenennen?',
    );
    await page.getByRole('button', { name: 'Trotzdem umbenennen' }).click();

    await expect(page.getByRole('heading', { name: 'Clara', level: 1 })).toBeVisible();
  });

  test('leaving with an unsaved name asks first', async ({ page }) => {
    await createPersons(page, 'Ana');
    await openPerson(page, 'Ana');
    await page.getByRole('button', { name: 'Umbenennen' }).click();
    await page.getByLabel('Neuer Name').fill('Anna');

    await page.getByRole('button', { name: 'Zurück' }).click();
    const question = page.getByRole('alertdialog', { name: 'Änderungen verwerfen?' });
    await expect(question).toContainText('Der neue Name „Anna“ ist noch nicht gespeichert.');
    await question.getByRole('button', { name: 'Weiter bearbeiten' }).click();
    await expect(page.getByLabel('Neuer Name')).toHaveValue('Anna');

    // Like the Android back key.
    await page.goBack();
    await page.getByRole('button', { name: 'Verwerfen' }).click();
    await expect(page.getByRole('heading', { name: 'Personen', level: 1 })).toBeVisible();
  });
});

test.describe('US-VW-02 Edit a table', () => {
  test('AK-1, AK-2, AK-6: name and binding change, the members stay', async ({ page }) => {
    await createPersons(page, 'Anna', 'Ben', 'Clara');
    await createTable(page, 'Anna', 'Ben', 'Clara');
    await openTable(page, 'Anna, Ben & Clara');

    await page.getByRole('link', { name: 'Bearbeiten' }).click();
    const editor = page.getByRole('dialog', { name: 'Tisch bearbeiten' });
    // AK-2: no bench to bring or remove persons.
    await expect(
      editor.getByText('Wer am Tisch sitzt, bleibt fest.', { exact: false }),
    ).toBeVisible();
    await expect(editor.getByRole('heading', { name: 'Wer spielt mit?' })).toHaveCount(0);
    // AK-1 and AK-6: new name, Catan excluded, so the Catan colours go.
    await editor.getByLabel('Gruppenname').fill('Spieleabend');
    await editor.getByRole('switch', { name: /Catan ausschließen/ }).click();
    await expect(editor.getByRole('group', { name: /^Catan-Farbe/ })).toHaveCount(0);
    await editor.getByRole('button', { name: 'Änderungen speichern' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Spieleabend', level: 1 })).toBeVisible();
    await expect(page.getByText('Alle Spiele ohne Catan').first()).toBeVisible();

    // AK-6: allowing Catan again assigns Catan colours.
    await page.getByRole('link', { name: 'Bearbeiten' }).click();
    await editor.getByRole('switch', { name: /Catan ausschließen/ }).click();
    await expect(editor.getByRole('group', { name: /^Catan-Farbe/ })).toBeVisible();
    await editor.getByRole('button', { name: 'Änderungen speichern' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('Alle Spiele', { exact: true }).first()).toBeVisible();
  });

  test('AK-3: Catan is blocked for five persons', async ({ page }) => {
    await createPersons(page, 'A', 'B', 'C', 'D', 'E');
    await createTable(page, 'A', 'B', 'C', 'D', 'E');
    await openTable(page, 'A, B, C, D & E');

    await page.getByRole('link', { name: 'Bearbeiten' }).click();

    const editor = page.getByRole('dialog', { name: 'Tisch bearbeiten' });
    await expect(editor.getByRole('button', { name: 'Nur Catan' })).toBeDisabled();
    await expect(
      editor.getByText('Catan geht nur mit höchstens 4 Personen.', { exact: false }),
    ).toBeVisible();
  });

  test('the back key closes the editor and asks about unsaved changes', async ({ page }) => {
    await createPersons(page, 'Anna', 'Ben');
    await createTable(page, 'Anna', 'Ben');
    await openTable(page, 'Anna & Ben');
    await page.getByRole('link', { name: 'Bearbeiten' }).click();
    await page.getByLabel('Gruppenname').fill('Zu zweit');

    await page.goBack();
    await page.getByRole('button', { name: 'Verwerfen' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Anna & Ben', level: 1 })).toBeVisible();
  });
});

test.describe('US-VW-07 Rename a custom game', () => {
  test('AK-1, AK-2: unique among all games, Catan is built in', async ({ page }) => {
    await page.goto('/#/verwaltung/spiele');
    for (const name of ['Uno', 'Skyjo']) {
      await page.getByLabel('Name').fill(name);
      await page.getByRole('button', { name: 'Speichern' }).click();
      await expect(page.getByRole('link', { name: new RegExp(`^${name}`) })).toBeVisible();
    }
    // AK-2: Catan has no page.
    const supported = page.getByRole('list', { name: 'Unterstützte Spiele' });
    await expect(supported).toContainText('fest eingebaut');
    await expect(supported.getByRole('link')).toHaveCount(0);

    await page.getByRole('link', { name: /^Uno/ }).click();
    await expect(page.getByRole('heading', { name: 'Uno', level: 1 })).toBeVisible();
    await page.getByRole('button', { name: 'Umbenennen' }).click();
    const field = page.getByLabel('Neuer Spielname');
    for (const taken of ['skyjo', 'CATAN']) {
      await field.fill(taken);
      await page.getByRole('button', { name: 'Speichern' }).click();
      await expect(page.getByRole('alert')).toContainText(
        `Es gibt bereits ein Spiel namens „${taken}“.`,
      );
    }
    await field.fill('UNO');
    await page.getByRole('button', { name: 'Speichern' }).click();

    await expect(page.getByRole('heading', { name: 'UNO', level: 1 })).toBeVisible();
  });
});
