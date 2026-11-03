import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { useSeededRandom } from './seededRandom';

// I2-C: every run draws the same steps (variant A); real randomness is checked in
// tests/statistical.
// Whole matches with every reveal take longer than the default timeout, above all in WebKit.
test.beforeEach(async ({ page }) => {
  test.slow();
  await useSeededRandom(page, 7);
});

// The card hand sits at the bottom of the screen; a control in the middle is easy to tap on
// every device.
async function tap(locator: Locator): Promise<void> {
  await locator.evaluate((element) => {
    element.scrollIntoView({ block: 'center' });
  });
  await locator.click();
}

async function createTable(page: Page, ...names: string[]): Promise<void> {
  await page.goto('/#/verwaltung/personen');
  for (const name of names) {
    await page.getByLabel('Name').fill(name);
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByRole('list', { name: 'Alle Personen' })).toContainText(name);
  }
  await page.goto('/#/verwaltung/gruppen');
  await page.getByRole('button', { name: 'Neuer Tisch' }).click();
  const editor = page.getByRole('dialog', { name: 'Neuer Tisch' });
  for (const name of names) {
    await editor.getByRole('button', { name, exact: true }).click();
  }
  await tap(page.getByRole('button', { name: 'Gruppe anlegen' }));
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

// Start → "Partie" → Catan → the table, up to the options.
async function openOptions(page: Page, table: RegExp): Promise<void> {
  await page.goto('/#/');
  await tap(page.getByRole('link', { name: 'Partie' }));
  await tap(page.getByRole('link', { name: 'Catan' }));
  await tap(page.getByRole('button', { name: table }));
  await expect(page.getByRole('heading', { name: 'Wie spielt ihr?' })).toBeVisible();
}

async function startGeneration(page: Page): Promise<void> {
  await tap(page.getByRole('button', { name: 'Weiter zu den Farben' }));
  await expect(page.getByRole('heading', { name: 'Welche Farben?' })).toBeVisible();
  await tap(page.getByRole('button', { name: 'Generierung starten' }));
}

function progress(page: Page): Locator {
  return page.getByRole('list', { name: 'Fortschritt' });
}

// Taps the forward button ("Losen", at the end "Zur Übersicht") until the overview shows. Returns
// the current phase of every step shown, as in the progress ("Platzierung 3/16").
async function drawAll(page: Page): Promise<string[]> {
  const phases: string[] = [];
  const overview = page.getByRole('heading', { name: 'Laufende Partie' });
  const current = progress(page).getByRole('listitem').filter({ hasText: '/' });
  while (!(await overview.isVisible())) {
    const shown = await current.innerText();
    phases.push(shown);
    await tap(page.getByRole('button', { name: /^(Losen|Zur Übersicht)$/ }));
    await expect(overview.or(current.filter({ hasNotText: shown }))).toBeVisible();
  }
  return phases;
}

function count(phases: readonly string[], phase: string): number {
  return phases.filter((shown) => shown.startsWith(`${phase} `)).length;
}

test.describe('US-AB-01 and US-AB-02 a new match from the start to the overview', () => {
  test('AK-1 to AK-4: four persons, base game, all steps drawn and kept after a reload', async ({
    page,
  }) => {
    await createTable(page, 'Anna', 'Ben', 'Clara', 'David');
    await openOptions(page, /^Anna, Ben, Clara & David:/);
    await startGeneration(page);

    await expect(page.getByRole('heading', { name: 'Losen' })).toBeVisible();
    await expect(progress(page)).toContainText('Losen 1/3');
    const phases = await drawAll(page);

    expect(count(phases, 'Losen')).toBe(3);
    expect(count(phases, 'Reihenfolge')).toBe(3);
    expect(count(phases, 'Platzierung')).toBe(16);
    expect(count(phases, 'Rohstoffe')).toBe(0);
    await expect(page.getByTestId('board-settlement')).toHaveCount(8);
    await expect(page.getByTestId('board-road')).toHaveCount(8);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Laufende Partie' })).toBeVisible();
    await tap(page.getByRole('button', { name: 'Zurück' }));
    await tap(page.getByRole('link', { name: 'Partie' }));
    await expect(page.getByRole('heading', { name: 'Laufende Partie' })).toBeVisible();
  });

  test('US-SP-04, US-SR-01: three persons, Cities & Knights, resources without replacement', async ({
    page,
  }) => {
    await createTable(page, 'Anna', 'Ben', 'Clara');
    await openOptions(page, /^Anna, Ben & Clara:/);
    await tap(page.getByRole('button', { name: /^Städte & Ritter/ }));
    await tap(page.getByRole('switch', { name: 'Startrohstoffe ziehen' }));
    await tap(page.getByRole('button', { name: 'ohne Zurücklegen' }));
    await startGeneration(page);

    const phases = await drawAll(page);

    expect(count(phases, 'Reihenfolge')).toBe(2);
    expect(count(phases, 'Platzierung')).toBe(12);
    expect(count(phases, 'Rohstoffe')).toBe(3);
    await expect(page.getByTestId('board-settlement')).toHaveCount(3);
    await expect(page.getByTestId('board-city')).toHaveCount(3);
    await tap(page.getByRole('tab', { name: 'Ergebnisse' }));
    await expect(page.getByRole('heading', { name: 'Startrohstoffe' })).toBeVisible();
  });

  test('FA-LS-07: two persons with an order set by hand and resources with replacement', async ({
    page,
  }) => {
    await createTable(page, 'Anna', 'Ben');
    await openOptions(page, /^Anna & Ben:/);
    await tap(page.getByRole('switch', { name: 'Reihenfolge losen' }));
    const next = page.getByRole('button', { name: 'Weiter zu den Farben' });
    await expect(next).toBeDisabled();
    await tap(page.getByRole('button', { name: 'Ben', exact: true }));
    await expect(next).toBeEnabled();
    await tap(page.getByRole('switch', { name: 'Startrohstoffe ziehen' }));
    await startGeneration(page);

    const phases = await drawAll(page);

    expect(count(phases, 'Reihenfolge')).toBe(0);
    expect(count(phases, 'Platzierung')).toBe(8);
    expect(count(phases, 'Rohstoffe')).toBe(2);
    await tap(page.getByRole('tab', { name: 'Ergebnisse' }));
    await expect(page.getByRole('heading', { name: 'Reihenfolge', exact: true })).toBeVisible();
  });

  test('FA-LS-07, US-PL-05 AK-3: without placement no buildings, the seats of the table', async ({
    page,
  }) => {
    await createTable(page, 'Anna', 'Ben');
    await openOptions(page, /^Anna & Ben:/);
    await tap(page.getByRole('switch', { name: 'Reihenfolge losen' }));
    await tap(page.getByRole('button', { name: 'Ohne Platzierung' }));
    await startGeneration(page);

    const phases = await drawAll(page);

    expect(phases).toEqual(['Losen 1/3', 'Losen 2/3', 'Losen 3/3']);
    await expect(page.getByText('Ohne Platzierung')).toBeVisible();
    await expect(page.getByTestId('board-settlement')).toHaveCount(0);
    await tap(page.getByRole('tab', { name: 'Ergebnisse' }));
    await expect(page.getByRole('heading', { name: 'Reihenfolge am Tisch' })).toBeVisible();
  });
});

test.describe('US-AB-03, US-PL-05, US-AB-06 repeat, skip and end', () => {
  test.beforeEach(async ({ page }) => {
    await createTable(page, 'Anna', 'Ben', 'Clara');
    await openOptions(page, /^Anna, Ben & Clara:/);
    for (const draw of ['Landschaftsfelder', 'Häfen', 'Zahlenchips']) {
      await tap(page.getByRole('switch', { name: draw }));
    }
    await startGeneration(page);
    await expect(page.getByRole('heading', { name: 'Reihenfolge' })).toBeVisible();
  });

  test('US-AB-03 AK-1: repeating a step asks first and keeps the flow on it', async ({ page }) => {
    await tap(page.getByRole('button', { name: 'Wiederholen' }));
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('Reihenfolge, Platz 1 wiederholen?');
    await dialog.getByRole('button', { name: 'Wiederholen' }).click();

    await expect(dialog).toHaveCount(0);
    await expect(progress(page)).toContainText('Reihenfolge 1/2');
  });

  test('US-PL-05 AK-1, AK-2: the placement can be skipped on the last spin', async ({ page }) => {
    const skip = page.getByRole('button', { name: 'Platzierung überspringen' });
    await expect(skip).toHaveCount(0);
    await tap(page.getByRole('button', { name: 'Losen' }));
    await tap(skip);
    await page.getByRole('alertdialog').getByRole('button', { name: 'Überspringen' }).click();

    await expect(page.getByRole('heading', { name: 'Laufende Partie' })).toBeVisible();
    await expect(page.getByText('Platzierung übersprungen')).toBeVisible();
  });

  test('US-AB-06 AK-1: ending without a result leads to the start, a new match can begin', async ({
    page,
  }) => {
    await tap(page.getByRole('button', { name: 'Partie beenden ohne Ergebnis' }));
    await page.getByRole('alertdialog').getByRole('button', { name: 'Beenden' }).click();

    await expect(page.getByRole('navigation', { name: 'Karten' })).toBeVisible();
    await tap(page.getByRole('link', { name: 'Partie' }));
    await expect(page.getByRole('heading', { name: 'Neue Partie' })).toBeVisible();
  });
});
