import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { CATAN_DEFAULT_STARTING_RESOURCES } from '@/games/catan';
import { seedDatabase, seedMatch, type SeedTable } from './seedDatabase';
import { useSeededRandom } from './seededRandom';

// The card movements of design I2-E jump to their end, as with "Bewegung reduzieren"; their tempo
// is tested in cardDraw.spec.ts.
test.use({ reducedMotion: 'reduce' });

// I2-C: every run draws the same steps (variant A); real randomness is checked in
// tests/statistical.
// Whole matches with every reveal take longer than the default timeout, above all in WebKit.
test.beforeEach(async ({ page }) => {
  test.slow();
  await useSeededRandom(page, 7);
});

const FORWARD = /^(Losen|Weiter|Blättern|Alle umdrehen|Zur Übersicht)$/;

// The card hand sits at the bottom of the screen; a control in the middle is easy to tap on
// every device.
async function tap(locator: Locator): Promise<void> {
  await locator.evaluate((element) => {
    element.scrollIntoView({ block: 'center' });
  });
  await locator.click();
}

// The persons of a table as the starting point; creating them in the user interface is tested by
// persons.spec.ts and groups.spec.ts.
async function seedTable(page: Page, name: string, ...members: string[]): Promise<void> {
  await seedDatabase(page, [{ name, members }]);
}

// From the start view: "Partie" → Catan → the table, up to the options.
async function openOptions(page: Page, table: RegExp): Promise<void> {
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

function forward(page: Page): Locator {
  // The last button of the view; the note "Rückblick" may lead "Zur Übersicht" as well.
  return page.getByRole('main').getByRole('button', { name: FORWARD }).last();
}

// The page of the flow and what its forward button does (attribute of the view).
async function pageMark(page: Page): Promise<string> {
  return (await page.getByRole('main').getAttribute('data-page')) ?? '';
}

// Waits until the flow shows another page than `mark`, or the overview.
async function waitForPage(page: Page, mark: string): Promise<void> {
  const overview = page.getByRole('heading', { name: 'Laufende Partie' });
  const changed = page.locator(`main[data-page]:not([data-page="${mark}"])`);
  await expect(overview.or(changed).first()).toBeVisible();
}

// Taps the forward button once and waits until the page has changed.
async function tapForward(page: Page, name: string): Promise<void> {
  await expect(forward(page)).toHaveText(name);
  const mark = await pageMark(page);
  await tap(forward(page));
  await waitForPage(page, mark);
}

// Taps the forward button ("Losen", "Weiter", "Alle umdrehen", at the end "Zur Übersicht")
// until the overview shows. Returns the current phase of every step drawn, as in the progress
// ("Platzierung 3/16"), and the number of taps.
async function drawAll(page: Page): Promise<{ phases: string[]; taps: number }> {
  const phases: string[] = [];
  const overview = page.getByRole('heading', { name: 'Laufende Partie' });
  const current = progress(page).getByRole('listitem').filter({ hasText: '/' });
  let taps = 0;
  for (;;) {
    // After the last step the overview opens; until then a page with its forward button.
    await expect(overview.or(page.locator('main[data-page]')).first()).toBeVisible();
    if (await overview.isVisible()) {
      break;
    }
    const mark = await pageMark(page);
    const label = mark.slice(mark.lastIndexOf(':') + 1);
    await tap(forward(page));
    taps++;
    await waitForPage(page, mark);
    if (label === 'draw' && !(await overview.isVisible())) {
      phases.push(await current.innerText());
    }
  }
  return { phases, taps };
}

function count(phases: readonly string[], phase: string): number {
  return phases.filter((shown) => shown.startsWith(`${phase} `)).length;
}

// K-6: tests of what comes after the draws start with a match drawn so far, written straight into
// the database; tapping through a whole match is tested by the first describe block.
const TWO: SeedTable = { name: 'Zu zweit', members: ['Anna', 'Ben'] };
const NO_PERSON_DRAWS = { personDraws: { landscapes: false, harbors: false, numbers: false } };
const WITH_RESOURCES = { startingResources: CATAN_DEFAULT_STARTING_RESOURCES };

test.describe('US-AB-01 and US-AB-02 a new match from the start to the overview', () => {
  test('AK-1 to AK-4: four persons, base game, all steps drawn and kept after a reload', async ({
    page,
  }) => {
    await seedTable(page, 'Freitagsrunde', 'Anna', 'Ben', 'Clara', 'David');
    await openOptions(page, /^Freitagsrunde:/);
    await startGeneration(page);

    // US-AB-02 AK-3: the first step without a result.
    await expect(page.getByRole('heading', { name: 'Losen' })).toBeVisible();
    await expect(progress(page)).toContainText('Losen 0/3');
    await expect(page.getByText('Wer?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Wiederholen' })).toBeDisabled();
    const { phases, taps } = await drawAll(page);

    expect(count(phases, 'Losen')).toBe(3);
    expect(count(phases, 'Reihenfolge')).toBe(3);
    expect(count(phases, 'Platzierung')).toBe(16);
    expect(count(phases, 'Rohstoffe')).toBe(0);
    // Design I2-D: 22 draws, a "Weiter" after each draw of a person, the order and the
    // placement.
    expect(taps).toBe(27);
    await expect(page.getByTestId('board-settlement')).toHaveCount(8);
    await expect(page.getByTestId('board-road')).toHaveCount(8);

    // Design I2-D: from the flow, "Zurück" leads to its last step in the look back.
    await tap(page.getByRole('button', { name: 'Zurück' }));
    await expect(page.getByText('Rückblick')).toBeVisible();
    await expect(progress(page)).toContainText('Platzierung 16/16');

    // US-AB-05 AK-1: after a restart the overview opens again from the start.
    await page.reload();
    await page.goto('/#/');
    await tap(page.getByRole('link', { name: 'Partie' }));
    await expect(page.getByRole('heading', { name: 'Laufende Partie' })).toBeVisible();
    await tap(page.getByRole('button', { name: 'Zurück' }));
    await expect(page.getByRole('link', { name: 'Partie' })).toBeVisible();
  });

  test('US-SP-04, US-SR-01: three persons, Cities & Knights, resources without replacement', async ({
    page,
  }) => {
    await seedTable(page, 'Dreier', 'Anna', 'Ben', 'Clara');
    await openOptions(page, /^Dreier:/);
    await tap(page.getByRole('button', { name: /^Städte & Ritter/ }));
    await tap(page.getByRole('switch', { name: 'Startrohstoffe ziehen' }));
    await tap(page.getByRole('button', { name: 'ohne Zurücklegen' }));
    await startGeneration(page);

    const { phases } = await drawAll(page);

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
    await seedTable(page, 'Zu zweit', 'Anna', 'Ben');
    await openOptions(page, /^Zu zweit:/);
    await tap(page.getByRole('switch', { name: 'Reihenfolge losen' }));
    const next = page.getByRole('button', { name: 'Weiter zu den Farben' });
    await expect(next).toBeDisabled();
    await tap(page.getByRole('button', { name: 'Ben', exact: true }));
    await expect(next).toBeEnabled();
    await tap(page.getByRole('switch', { name: 'Startrohstoffe ziehen' }));
    await startGeneration(page);

    const { phases } = await drawAll(page);

    expect(count(phases, 'Reihenfolge')).toBe(0);
    expect(count(phases, 'Platzierung')).toBe(8);
    expect(count(phases, 'Rohstoffe')).toBe(2);
    await tap(page.getByRole('tab', { name: 'Ergebnisse' }));
    await expect(page.getByRole('heading', { name: 'Reihenfolge', exact: true })).toBeVisible();
  });

  test('FA-LS-07, US-PL-05 AK-3: without placement no buildings, the seats of the table', async ({
    page,
  }) => {
    await seedTable(page, 'Zu zweit', 'Anna', 'Ben');
    await openOptions(page, /^Zu zweit:/);
    await tap(page.getByRole('switch', { name: 'Reihenfolge losen' }));
    await tap(page.getByRole('button', { name: 'Ohne Platzierung' }));
    await startGeneration(page);

    const { phases } = await drawAll(page);

    expect(phases).toEqual(['Losen 1/3', 'Losen 2/3', 'Losen 3/3']);
    await expect(page.getByText('Ohne Platzierung')).toBeVisible();
    await expect(page.getByTestId('board-settlement')).toHaveCount(0);
    await tap(page.getByRole('tab', { name: 'Ergebnisse' }));
    await expect(page.getByRole('heading', { name: 'Personen am Tisch' })).toBeVisible();
  });
});

test.describe('US-AB-03, US-AB-04, US-PL-05, US-AB-06 repeat, look back, skip and end', () => {
  test.beforeEach(async ({ page }) => {
    await seedMatch(page, {
      table: { name: 'Dreier', members: ['Anna', 'Ben', 'Clara'] },
      options: NO_PERSON_DRAWS,
      steps: 0,
    });
    await expect(page.getByRole('heading', { name: 'Reihenfolge' })).toBeVisible();
  });

  test('US-AB-03 AK-1: repeating a step asks first and shows it without a result', async ({
    page,
  }) => {
    await tapForward(page, 'Losen');
    await tap(page.getByRole('button', { name: 'Wiederholen' }));
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('Reihenfolge, Platz 1 wiederholen?');
    await dialog.getByRole('button', { name: 'Wiederholen' }).click();

    await expect(dialog).toHaveCount(0);
    await expect(progress(page)).toContainText('Reihenfolge 0/2');
    await expect(page.getByRole('button', { name: 'Wiederholen' })).toBeDisabled();
  });

  test('US-AB-04 AK-3, AK-4: the look back shows an earlier view without drawing', async ({
    page,
  }) => {
    const back = page.getByRole('button', { name: 'Zurück' });
    await tapForward(page, 'Losen');
    // The spins of the order make one view: it is the first, there is nothing before it.
    await expect(back).toBeDisabled();
    await tapForward(page, 'Losen');
    await tapForward(page, 'Weiter');
    await tapForward(page, 'Losen');
    await tapForward(page, 'Losen');
    await expect(progress(page)).toContainText('Platzierung 2/12');

    // PO 10.11.2026: back from the placement to the whole order, not piece by piece.
    await tap(back);
    await expect(page.getByText('Rückblick')).toBeVisible();
    await expect(page).toHaveURL(/#\/partie\?schritt=0$/);
    await expect(page.getByRole('heading', { name: 'Reihenfolge' })).toBeVisible();
    await expect(progress(page)).toContainText('Reihenfolge 2/2');
    await tapForward(page, 'Blättern');
    await expect(page.getByText('Rückblick')).toHaveCount(0);
    await expect(progress(page)).toContainText('Platzierung 2/12');
    await expect(page.getByTestId('board-road')).toHaveCount(1);
    await expect(forward(page)).toHaveText('Losen');
  });

  test('US-PL-05 AK-1, AK-2: the placement can be skipped on the empty board', async ({ page }) => {
    const skip = page.getByRole('button', { name: 'Platzierung überspringen' });
    await tapForward(page, 'Losen');
    await tapForward(page, 'Losen');
    await expect(skip).toHaveCount(0);
    await tapForward(page, 'Weiter');
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

test.describe('US-AB-04, US-AB-05 a running match (design I2-D)', () => {
  test('US-AB-03 AK-6: a step of the overview is repeated in the flow, the rest is browsed', async ({
    page,
  }) => {
    await seedMatch(page, { table: TWO, options: { order: { mode: 'none' } } });

    await tap(page.getByRole('tab', { name: 'Ergebnisse' }));
    await tap(page.getByRole('button', { name: /^Häfen/ }));
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('Häfen wiederholen?');
    await dialog.getByRole('button', { name: 'Wiederholen' }).click();

    await expect(page.getByText('Wer?')).toBeVisible();
    await expect(progress(page)).toContainText('Losen 1/3');
    await tapForward(page, 'Losen');
    await tapForward(page, 'Blättern');
    await tapForward(page, 'Zur Übersicht');
    await expect(page.getByRole('heading', { name: 'Laufende Partie' })).toBeVisible();
  });

  test('US-AB-03 AK-6: a new order leads to the placement before the starting resources', async ({
    page,
  }) => {
    await seedMatch(page, { table: TWO, options: WITH_RESOURCES });

    await tap(page.getByRole('tab', { name: 'Ergebnisse' }));
    await tap(page.getByRole('main').getByRole('button').filter({ hasText: /^1/ }).first());
    await page.getByRole('alertdialog').getByRole('button', { name: 'Wiederholen' }).click();
    await expect(page.getByRole('heading', { name: 'Reihenfolge' })).toBeVisible();

    // PO 10.11.2026: the drawn starting resources come after the new placement, not between.
    await tapForward(page, 'Losen');
    await tapForward(page, 'Weiter');
    await expect(page.getByRole('heading', { name: 'Platzierung' })).toBeVisible();
    await tapForward(page, 'Losen');
    await expect(page.getByText('Als Nächstes')).toBeVisible();
    await expect(forward(page)).toHaveText('Losen');
  });

  test('US-AB-03 AK-3: a road of the overview is drawn again, the other pieces stay', async ({
    page,
  }) => {
    await seedMatch(page, { table: TWO });

    await tap(page.getByRole('tab', { name: 'Ergebnisse' }));
    await tap(page.getByRole('button', { name: /Straße.*wiederholen/ }).first());
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('Nur dieser Schritt wird neu gelost');
    await dialog.getByRole('button', { name: 'Wiederholen' }).click();

    // PO 10.11.2026: the kept pieces neither vanish nor are browsed one by one.
    await expect(page.getByTestId('board-road')).toHaveCount(3);
    await tapForward(page, 'Losen');
    await expect(page.getByTestId('board-road')).toHaveCount(4);
    await expect(page.getByTestId('board-settlement')).toHaveCount(4);
    await expect(page.getByText('Platzierung fertig')).toBeVisible();
    await tapForward(page, 'Zur Übersicht');
    await expect(page.getByRole('heading', { name: 'Laufende Partie' })).toBeVisible();
  });

  test('AK-2: the start leads back; a new match asks first (Q1)', async ({ page }) => {
    await seedTable(page, 'Zu zweit', 'Anna', 'Ben');
    await openOptions(page, /^Zu zweit:/);
    await startGeneration(page);
    await tapForward(page, 'Losen');

    await page.goto('/#/');
    await expect(page.getByText('spielt gerade')).toBeVisible();
    await tap(page.getByRole('link', { name: 'Weiter' }));
    await expect(page.getByText('legt sie aus')).toBeVisible();

    await page.goto('/#/partie/neu');
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('Zu zweit spielt gerade');
    await dialog.getByRole('button', { name: 'Zur Partie' }).click();
    await expect(page.getByRole('heading', { name: 'Losen' })).toBeVisible();

    await page.goto('/#/partie/neu');
    await page.getByRole('alertdialog').getByRole('button', { name: 'Neu beginnen' }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await page.goto('/#/');
    await expect(page.getByText('spielt gerade')).toHaveCount(0);
  });

  test('US-AB-05 AK-1, US-SR-01 AK-6: turned resources stay turned after a restart', async ({
    page,
  }) => {
    await seedTable(page, 'Zu zweit', 'Anna', 'Ben');
    await openOptions(page, /^Zu zweit:/);
    await tap(page.getByRole('switch', { name: 'Reihenfolge losen' }));
    await tap(page.getByRole('button', { name: 'Ohne Platzierung' }));
    for (const draw of ['Landschaftsfelder', 'Häfen', 'Zahlenchips']) {
      await tap(page.getByRole('switch', { name: draw }));
    }
    await tap(page.getByRole('switch', { name: 'Startrohstoffe ziehen' }));
    await startGeneration(page);

    await tapForward(page, 'Losen');
    await expect(page.getByText('Antippen')).toHaveCount(2);
    await tap(page.getByRole('button', { name: 'Karte 2 umdrehen' }));
    await expect(page.getByText('Antippen')).toHaveCount(1);

    await page.reload();
    await expect(page.getByText('Antippen')).toHaveCount(1);
    await expect(forward(page)).toHaveText('Alle umdrehen');
    await tapForward(page, 'Alle umdrehen');
    await expect(page.getByText('Antippen')).toHaveCount(0);
    await expect(forward(page)).toHaveText('Weiter');
  });

  test('US-VW-02 AK-5: the game of the table is locked in the editor (S1)', async ({ page }) => {
    await seedTable(page, 'Zu zweit', 'Anna', 'Ben');
    await openOptions(page, /^Zu zweit:/);
    await startGeneration(page);
    await expect(page.getByText('Wer?')).toBeVisible();

    await page.goto('/#/verwaltung/gruppen');
    await tap(page.getByRole('link', { name: /Zu zweit/ }).first());
    await tap(page.getByRole('link', { name: 'Bearbeiten' }));
    const editor = page.getByRole('dialog', { name: 'Tisch bearbeiten' });
    await expect(editor.getByText('Partie läuft · Spiel bis zum Ende fest')).toBeVisible();
    await expect(editor.getByRole('button', { name: 'Alle Spiele' })).toBeDisabled();

    await tap(editor.getByRole('button', { name: 'Partie beenden' }));
    await page.getByRole('alertdialog').getByRole('button', { name: 'Beenden' }).click();

    await expect(editor.getByRole('button', { name: 'Alle Spiele' })).toBeEnabled();
  });
});

// Taps a piece on the board where its tap area is centred, as a finger does (design I2-H): the
// tap areas overlap, the app decides from the point which piece is meant.
async function tapPiece(page: Page, piece: Locator): Promise<void> {
  const box = await piece.boundingBox();
  if (box === null) {
    throw new Error('The piece has no tap area on the screen');
  }
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

function spotlight(page: Page): Locator {
  return page.getByTestId('board-spotlight');
}

test.describe('US-AB-03 AK-8 tapping pieces on the board (design I2-H)', () => {
  test('AK-3: a road tapped in the overview is drawn again alone, marked while asked', async ({
    page,
  }) => {
    await seedMatch(page, { table: TWO });
    await expect(page.getByText('Stein antippen zum Wiederholen')).toBeVisible();

    const roads = page.getByRole('button', { name: /^Straße von .* wiederholen$/ });
    await expect(roads).toHaveCount(4);
    const name = (await roads.nth(1).getAttribute('aria-label')) ?? '';
    await tapPiece(page, roads.nth(1));
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText(`${name.replace(/ wiederholen$/, '')} wiederholen?`);
    await expect(dialog).toContainText('Nur dieser Schritt wird neu gelost');
    await expect(spotlight(page).getByTestId('board-road')).toHaveCount(1);
    await expect(spotlight(page).getByTestId('board-settlement')).toHaveCount(0);

    await dialog.getByRole('button', { name: 'Wiederholen' }).click();
    await expect(page.getByTestId('board-road')).toHaveCount(3);
    await tapForward(page, 'Losen');
    await expect(page.getByTestId('board-road')).toHaveCount(4);
    await expect(page.getByTestId('board-settlement')).toHaveCount(4);
  });

  test('AK-4: a building tapped in the overview marks its road and all later pieces', async ({
    page,
  }) => {
    await seedMatch(page, { table: TWO });

    const buildings = page.getByRole('button', { name: /^Siedlung von .* wiederholen$/ });
    await expect(buildings).toHaveCount(4);
    // The third building of the placement: its road and the fourth building with its road go.
    await tapPiece(page, buildings.nth(2));
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('Verworfen und neu gelost');
    await expect(spotlight(page).getByTestId('board-settlement')).toHaveCount(2);
    await expect(spotlight(page).getByTestId('board-road')).toHaveCount(2);

    await dialog.getByRole('button', { name: 'Abbrechen' }).click();
    await expect(spotlight(page)).toHaveCount(0);
    await tapPiece(page, buildings.nth(2));
    await page.getByRole('alertdialog').getByRole('button', { name: 'Wiederholen' }).click();
    await expect(page.getByRole('heading', { name: 'Platzierung' })).toBeVisible();
    await expect(page.getByTestId('board-settlement')).toHaveCount(2);
    await expect(page.getByTestId('board-road')).toHaveCount(2);
  });

  test('decision A: "Wiederholen" on a kept placement repeats its last piece', async ({ page }) => {
    await seedMatch(page, { table: TWO });
    await tap(page.getByRole('tab', { name: 'Ergebnisse' }));
    await tap(page.getByRole('button', { name: /^Häfen/ }));
    await page.getByRole('alertdialog').getByRole('button', { name: 'Wiederholen' }).click();

    await tapForward(page, 'Losen');
    while (!(await page.getByRole('heading', { name: 'Platzierung' }).isVisible())) {
      await tapForward(page, 'Blättern');
    }
    await expect(page.getByTestId('board-road')).toHaveCount(4);
    // PO 10.11.2026: the progress counts every piece the whole view shows.
    await expect(progress(page)).toContainText('Platzierung 8/8');
    await tap(page.getByRole('button', { name: 'Wiederholen', exact: true }));

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText(/^Straße von .* wiederholen\?/);
    await expect(spotlight(page).getByTestId('board-road')).toHaveCount(1);
  });

  test('PO 10.11.: a road drawn again shows the whole board once, also going back', async ({
    page,
  }) => {
    await seedMatch(page, { table: TWO, options: WITH_RESOURCES });

    await tapPiece(page, page.getByRole('button', { name: /^Straße von .* wiederholen$/ }).first());
    await page.getByRole('alertdialog').getByRole('button', { name: 'Wiederholen' }).click();
    await tapForward(page, 'Losen');
    await expect(progress(page)).toContainText('Platzierung 8/8');
    await tapForward(page, 'Blättern');
    await expect(page.getByRole('heading', { name: 'Startrohstoffe' })).toBeVisible();

    const back = page.getByRole('button', { name: 'Zurück' });
    await tap(back);
    await expect(page.getByRole('heading', { name: 'Platzierung' })).toBeVisible();
    await expect(progress(page)).toContainText('Platzierung 8/8');
    await expect(page.getByTestId('board-road')).toHaveCount(4);
    // One more step back is the look back before the road, not the same board again.
    await tap(back);
    await expect(page.getByTestId('board-road')).toHaveCount(0);
  });

  test('PO 10.11.: the overview reached from the look back leads back into the flow', async ({
    page,
  }) => {
    await seedMatch(page, { table: TWO });

    const back = page.getByRole('button', { name: 'Zurück' });
    const overview = page.getByRole('heading', { name: 'Laufende Partie' });
    await tap(back);
    await expect(page.getByRole('heading', { name: 'Platzierung' })).toBeVisible();
    await tap(back);
    await expect(page.getByRole('heading', { name: 'Reihenfolge' })).toBeVisible();
    // The note of the look back leads to the overview once the match is running.
    await tap(page.getByRole('button', { name: 'Zum aktuellen Schritt' }));
    await expect(overview).toBeVisible();
    await tap(back);
    await expect(page.getByRole('heading', { name: 'Platzierung' })).toBeVisible();
  });

  test('R7: the marked piece lies bright over the board, the question leaves it free', async ({
    page,
  }) => {
    await seedMatch(page, { table: TWO });

    await tapPiece(page, page.getByRole('button', { name: /^Straße von .* wiederholen$/ }).nth(2));
    const board = await page.getByRole('img', { name: /^Brett mit/ }).boundingBox();
    const spot = await spotlight(page).boundingBox();
    const mark = await spotlight(page).getByTestId('board-road').boundingBox();
    const dialog = await page.getByRole('alertdialog').boundingBox();
    if (board === null || spot === null || mark === null || dialog === null) {
      throw new Error('The question about the piece is not on the screen');
    }
    // Exactly over the board, so the bright piece covers the dark one.
    for (const key of ['x', 'y', 'width', 'height'] as const) {
      expect(Math.abs(spot[key] - board[key])).toBeLessThan(1);
    }
    const centre = { x: mark.x + mark.width / 2, y: mark.y + mark.height / 2 };
    const isCovered =
      centre.x > dialog.x &&
      centre.x < dialog.x + dialog.width &&
      centre.y > dialog.y &&
      centre.y < dialog.y + dialog.height;
    expect(isCovered).toBe(false);
  });

  test('a piece tapped in the look back is repeated', async ({ page }) => {
    await seedMatch(page, { table: TWO });
    await tap(page.getByRole('button', { name: 'Zurück' }));
    // The whole placement in the look back (PO 10.11.2026).
    await expect(page.getByText('Rückblick')).toBeVisible();
    await expect(page.getByTestId('board-settlement')).toHaveCount(4);

    await tapPiece(
      page,
      page.getByRole('button', { name: /^Siedlung von .* wiederholen$/ }).nth(2),
    );
    await page.getByRole('alertdialog').getByRole('button', { name: 'Wiederholen' }).click();

    await expect(page.getByTestId('board-settlement')).toHaveCount(2);
    await expect(page.getByTestId('board-road')).toHaveCount(2);
    await expect(forward(page)).toHaveText('Losen');
  });

  test('PO 10.11.: back from the overview the note "Rückblick" covers no card', async ({
    page,
  }) => {
    await seedMatch(page, {
      table: { name: 'Freitagsrunde', members: ['Anna', 'Ben', 'Clara', 'David'] },
      options: WITH_RESOURCES,
    });

    await tap(page.getByRole('button', { name: 'Zurück' }));
    await expect(page.getByRole('heading', { name: 'Startrohstoffe' })).toBeVisible();
    const note = page.getByText('Rückblick', { exact: true }).locator('..');
    await expect(note).toBeVisible();
    // The cards appear once their table is measured; the note must give way to them as well.
    await expect
      .poll(async () => {
        const box = await note.boundingBox();
        const parts = await page.locator('main [data-solid]').evaluateAll((elements) =>
          elements.map((element) => {
            const { top, bottom, left, right } = element.getBoundingClientRect();
            return { top, bottom, left, right };
          }),
        );
        return (
          box !== null &&
          parts.some(
            (part) =>
              part.bottom > part.top &&
              part.top < box.y + box.height &&
              part.bottom > box.y &&
              part.left < box.x + box.width &&
              part.right > box.x,
          )
        );
      })
      .toBe(false);
  });

  test('a piece tapped in the flow is repeated there', async ({ page }) => {
    // The spin of the order and two buildings with the road between them.
    await seedMatch(page, { table: TWO, options: NO_PERSON_DRAWS, steps: 4 });
    await expect(page.getByTestId('board-settlement')).toHaveCount(2);

    await tapPiece(
      page,
      page.getByRole('button', { name: /^Siedlung von .* wiederholen$/ }).first(),
    );
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('Verworfen und neu gelost');
    await dialog.getByRole('button', { name: 'Wiederholen' }).click();

    await expect(page.getByTestId('board-settlement')).toHaveCount(0);
    await expect(forward(page)).toHaveText('Losen');
  });
});

test.describe('Architecture ADR-030 pictures of a match', () => {
  test('the Catan card and all resource cards are pictures that load', async ({ page }) => {
    await page.goto('/#/partie/neu');
    const landscape = page.getByRole('link', { name: 'Catan' }).locator('img');
    await expect(landscape).toBeVisible();
    // Visible does not mean loaded: under load the picture may still be on its way (K-5 run,
    // 11.11.2026), so the test waits until it is complete.
    await expect
      .poll(() =>
        landscape.evaluate((image: HTMLImageElement) => (image.complete ? image.naturalWidth : -1)),
      )
      .toBe(1200);

    for (const card of ['wood', 'brick', 'wool', 'grain', 'ore']) {
      const response = await page.request.get(`/art/card-${card}.webp`);
      expect(response.ok(), card).toBe(true);
      expect(response.headers()['content-type'], card).toBe('image/webp');
    }
  });
});
