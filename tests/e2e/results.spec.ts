import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { seedDatabase, seedMatch, seedResults } from './seedDatabase';

const TABLE = { name: 'Freitagsrunde', members: ['Anna', 'Ben', 'Clara', 'David'] };

function day(back: number): string {
  const date = new Date();
  date.setDate(date.getDate() - back);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// The cards of the game list in their order.
async function gameNames(page: Page): Promise<string[]> {
  return page
    .getByRole('list', { name: 'Spiele' })
    .getByRole('listitem')
    .evaluateAll((items) =>
      items.map((item) => item.querySelector('[aria-label]')?.getAttribute('aria-label') ?? ''),
    );
}

function saved(page: Page): ReturnType<Page['getByRole']> {
  return page.getByRole('status');
}

test.describe('US-SP-01 game list and US-ER-01 entering a result (design I3-B)', () => {
  test('AK-1, AK-2: a custom game opens the result; the best score wins (US-ER-02 AK-6)', async ({
    page,
  }) => {
    await seedResults(
      page,
      TABLE,
      [{ date: day(3), game: 'Skyjo', winners: ['Ben'], scores: [9, 2, 30, 14] }],
      {
        Skyjo: 'lowest-wins',
      },
    );
    await page.getByRole('link', { name: 'Partie' }).click();
    await expect(page.getByRole('heading', { name: 'Partie', level: 1 })).toBeVisible();
    // The only table that plays Skyjo: the form opens at once (design I3-B F2).
    await page.getByRole('link', { name: 'Skyjo' }).click();
    await expect(page.getByText('Skyjo · Freitagsrunde')).toBeVisible();

    const save = page.getByRole('button', { name: 'Ergebnis speichern' });
    await expect(save).toHaveAttribute('aria-disabled', 'true');
    for (const [name, points] of [
      ['Anna', '12'],
      ['Ben', '-3'],
      ['Clara', '40'],
      ['David', '7'],
    ] as const) {
      await page.getByRole('textbox', { name: `Punkte ${name}` }).fill(points);
    }
    // Enter on the phone keyboard only leaves the field, it does not store.
    await page.getByRole('textbox', { name: 'Punkte David' }).press('Enter');
    await expect(page.getByRole('textbox', { name: 'Punkte David' })).not.toBeFocused();
    await expect(page.getByText('Skyjo · Freitagsrunde')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sieger Ben' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(save).toHaveAttribute('aria-disabled', 'false');
    await save.click();

    await expect(saved(page)).toContainText('Ben gewinnt');
    await expect(saved(page)).toContainText('Skyjo · Freitagsrunde · gespeichert');
    await page.getByRole('link', { name: 'Partie' }).click();
    await expect(page.getByRole('link', { name: 'Skyjo' })).toContainText('zuletzt heute');
  });

  test('US-ER-06: "Sieger oder Rangfolge" stores the winner alone; a tie needs no points', async ({
    page,
  }) => {
    await seedResults(page, TABLE, [{ date: day(1), game: 'Uno', winners: ['Anna'] }]);
    await page.goto('/#/partie/neu');
    await page.getByRole('link', { name: 'Uno' }).click();

    // A game without points has no points and no switch (US-ER-02 AK-1).
    await expect(page.getByRole('textbox', { name: /^Punkte/ })).toHaveCount(0);
    await expect(page.getByRole('switch')).toHaveCount(0);
    await page.getByRole('button', { name: 'Clara Platz 1' }).click();
    await page.getByRole('button', { name: 'David Platz 1' }).click();
    // Shared first place: place 2 is skipped (1, 1, 3).
    await expect(page.getByRole('button', { name: 'Anna Platz 2' })).toBeDisabled();
    await page.getByRole('button', { name: 'Ergebnis speichern' }).click();

    await expect(saved(page)).toContainText('Unentschieden: Clara und David');
    // R3: the note disappears on its own once it could be read.
    await expect(saved(page)).toHaveCount(0, { timeout: 12_000 });
  });

  test('AK-2: Catan asks first, then the table; a winner without victory points (E-49)', async ({
    page,
  }) => {
    await seedDatabase(page, [TABLE, { name: 'Zu zweit', members: ['Anna', 'Ben'] }]);
    await page.goto('/#/partie/neu');
    await page.getByRole('button', { name: 'Catan' }).click();
    const question = page.getByRole('dialog', { name: /Catan/ });
    await expect(question.getByRole('button', { name: 'Neue Partie' })).toBeVisible();
    await question.getByRole('button', { name: 'Ergebnis eintragen' }).click();

    await expect(page.getByRole('heading', { name: 'Welcher Tisch?' })).toBeVisible();
    // A search by table or person, as on "Tische".
    await page.getByRole('button', { name: 'Tische suchen' }).click();
    await page.getByRole('searchbox', { name: 'Tisch oder Person suchen' }).fill('clara');
    await expect(page.getByRole('button', { name: /^Zu zweit:/ })).toHaveCount(0);
    await page.getByRole('searchbox', { name: 'Tisch oder Person suchen' }).fill('Schach');
    await expect(page.getByText('Kein Tisch gefunden für „Schach“.')).toBeVisible();
    await page.getByRole('button', { name: 'Suche leeren und schließen' }).click();
    await page.getByRole('button', { name: /^Freitagsrunde:/ }).click();
    await expect(page.getByRole('button', { name: 'Basisspiel' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // The mode cannot be changed: an info line as in the preparation.
    await expect(page.getByRole('button', { name: 'Regeln im Modus Standard' })).toBeVisible();
    // E-49: without victory points the winner or a ranking, chosen by the person entering.
    await page.getByRole('switch', { name: /Sieger oder Rangfolge/ }).click();
    await page.getByRole('button', { name: 'Anna Platz 1' }).click();
    // Exactly one winner in Catan: Clara takes place 1 from Anna.
    await page.getByRole('button', { name: 'Clara Platz 1' }).click();
    await expect(page.getByRole('button', { name: 'Anna Platz 1' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await page.getByRole('button', { name: 'Ergebnis speichern' }).click();

    await expect(saved(page)).toContainText('Clara gewinnt');
    await expect(saved(page)).toContainText('Catan · Freitagsrunde');
  });

  test('AK-8: no day in the future; more than 8 hours asks before saving', async ({ page }) => {
    await seedDatabase(page, [TABLE]);
    await page.goto('/#/partie/neu');
    await page.getByRole('button', { name: 'Catan' }).click();
    await page.getByRole('button', { name: 'Ergebnis eintragen' }).click();

    await expect(page.getByRole('button', { name: 'Einen Tag später' })).toBeDisabled();
    await page.getByRole('button', { name: 'Einen Tag früher' }).click();
    await expect(page.getByText(/^gestern, /)).toBeVisible();
    await page.getByRole('switch', { name: /Sieger oder Rangfolge/ }).click();
    await page.getByRole('button', { name: 'Anna Platz 1' }).click();
    await page.getByRole('textbox', { name: 'Spieldauer Stunden' }).fill('20');
    await expect(page.getByText('über 8 Stunden')).toBeVisible();
    await page.getByRole('button', { name: 'Ergebnis speichern' }).click();

    const question = page.getByRole('alertdialog', { name: 'Über 8 Stunden?' });
    await expect(question).toContainText('Spieldauer 20 h 0 min');
    await question.getByRole('button', { name: 'Korrigieren' }).click();
    await expect(page.getByRole('textbox', { name: 'Spieldauer Stunden' })).toBeFocused();
  });

  test('the list sorts by the last match or A–Z and can be searched', async ({ page }) => {
    await seedResults(page, TABLE, [
      { date: day(5), game: 'Wizard', winners: ['Anna'] },
      { date: day(0), game: 'Uno', winners: ['Anna'] },
    ]);
    await page.goto('/#/partie/neu');
    await expect.poll(() => gameNames(page)).toEqual(['Uno', 'Wizard', 'Catan']);

    await page
      .getByRole('button', { name: 'Sortiert nach zuletzt gespielt, wechseln zu A–Z' })
      .click();

    await expect.poll(() => gameNames(page)).toEqual(['Catan', 'Uno', 'Wizard']);
    await expect(page.getByText('A–Z', { exact: true })).toBeVisible();
    // The order chosen last comes back.
    await page.reload();
    await expect.poll(() => gameNames(page)).toEqual(['Catan', 'Uno', 'Wizard']);

    // A search as on "Personen" and "Tische".
    await page.getByRole('button', { name: 'Spiele suchen' }).click();
    await page.getByRole('searchbox', { name: 'Spiel suchen' }).fill('wiz');
    await expect.poll(() => gameNames(page)).toEqual(['Wizard']);
    await page.getByRole('searchbox', { name: 'Spiel suchen' }).fill('Schach');
    await expect(page.getByText('Kein Spiel gefunden für „Schach“.')).toBeVisible();
    await page.getByRole('button', { name: 'Suche leeren und schließen' }).click();
    await expect.poll(() => gameNames(page)).toEqual(['Catan', 'Uno', 'Wizard']);
  });
});

// The table of `seedResults` (seedDatabase.ts: first group).
const TABLE_PAGE = '/#/verwaltung/gruppen/00000000-0000-4000-8000-000000000101';

test.describe('US-ER-04 and US-ER-05 the results of a table (design I3-C)', () => {
  test('US-ER-01 AK-1: from the table, game choice and form lead back to its list', async ({
    page,
  }) => {
    await seedResults(page, TABLE, [{ date: day(2), game: 'Uno', winners: ['Anna'] }]);
    await page.goto(TABLE_PAGE);
    // SW4: the plus in the head, in every tab.
    await page.getByRole('link', { name: 'Ergebnis eintragen' }).click();
    await expect(page.getByRole('heading', { name: 'Ergebnis eintragen', level: 1 })).toBeVisible();
    await expect(page.getByText('Freitagsrunde · zuletzt gespielt')).toBeVisible();
    // Catan without the question: the table is fixed.
    await page.getByRole('link', { name: 'Uno' }).click();
    await page.getByRole('button', { name: 'Clara Platz 1' }).click();
    await page.getByRole('button', { name: 'Ergebnis speichern' }).click();

    await expect(page.getByRole('tab', { name: 'Ergebnisse', selected: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Uno, Clara gewinnt' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Uno, Anna gewinnt' })).toBeVisible();
  });

  test('NB1: the note on the start opens the result in the list of its table', async ({ page }) => {
    await seedResults(page, TABLE, [{ date: day(2), game: 'Uno', winners: ['Anna'] }]);
    await page.getByRole('link', { name: 'Partie' }).click();
    await page.getByRole('link', { name: 'Uno' }).click();
    await page.getByRole('button', { name: 'Ben Platz 1' }).click();
    await page.getByRole('button', { name: 'Ergebnis speichern' }).click();

    await saved(page).getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'Freitagsrunde', level: 1 })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Ergebnisse', selected: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Uno, Ben gewinnt' })).toBeInViewport();
  });

  test('AK-2, US-ER-05 AK-1: a result opens; a change asks first, without one nothing is asked', async ({
    page,
  }) => {
    await seedResults(
      page,
      TABLE,
      [{ date: day(1), time: '20:15', game: 'Skyjo', winners: ['Ben'], scores: [9, 2, 30, 14] }],
      { Skyjo: 'lowest-wins' },
    );
    await page.goto(`${TABLE_PAGE}?reiter=ergebnisse`);
    await page.getByRole('link', { name: 'Skyjo, 20:15, Ben gewinnt' }).click();
    await expect(page.getByRole('heading', { name: 'Skyjo', level: 1 })).toBeVisible();
    await expect(page.getByText('Punkte · wenigste gewinnen')).toBeVisible();
    await expect(page.getByLabel('Platz 2')).toBeVisible();

    await page.getByRole('link', { name: 'Bearbeiten' }).click();
    await expect(
      page.getByRole('heading', { name: 'Ergebnis bearbeiten', level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Punkte Ben' })).toHaveValue('2');
    // Without a change: back to the result, no question.
    await page.getByRole('button', { name: 'Änderungen speichern' }).click();
    await expect(page.getByRole('heading', { name: 'Skyjo', level: 1 })).toBeVisible();

    await page.getByRole('link', { name: 'Bearbeiten' }).click();
    await page.getByRole('textbox', { name: 'Punkte Clara' }).fill('1');
    await page.getByRole('textbox', { name: 'Punkte Clara' }).blur();
    await page.getByRole('button', { name: 'Änderungen speichern' }).click();
    const ask = page.getByRole('alertdialog', { name: 'Ergebnis ändern?' });
    await expect(ask).toContainText('Die Statistik ändert sich mit');
    await ask.getByRole('button', { name: 'Speichern' }).click();

    await expect(page.getByRole('heading', { name: 'Skyjo', level: 1 })).toBeVisible();
    await expect(page.getByText(/geändert/u)).toBeVisible();
    await expect(
      page.getByRole('list', { name: 'Ergebnis' }).getByRole('listitem').first(),
    ).toContainText('Clara');
  });

  test('US-ER-05 AK-2: deleting asks first and removes the result from the list', async ({
    page,
  }) => {
    await seedResults(page, TABLE, [
      { date: day(2), game: 'Uno', winners: ['Anna'] },
      { date: day(1), game: 'Uno', winners: ['David'] },
    ]);
    await page.goto(`${TABLE_PAGE}?reiter=ergebnisse`);
    await page.getByRole('link', { name: 'Uno, David gewinnt' }).click();
    await page.getByRole('button', { name: 'Ergebnis löschen' }).click();
    await page
      .getByRole('alertdialog', { name: 'Ergebnis löschen?' })
      .getByRole('button', { name: 'Löschen' })
      .click();

    await expect(page.getByRole('tab', { name: 'Ergebnisse', selected: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Uno, Anna gewinnt' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Uno, David gewinnt' })).toHaveCount(0);
  });
});

test.describe('US-AB-06 AK-2 and US-AB-07 the result of the running match', () => {
  test('AK-1: three-digit hours keep the timer beside "Partie beenden ohne Ergebnis" (PO 23.11.2026)', async ({
    page,
  }) => {
    for (const width of [360, 384]) {
      await page.setViewportSize({ width, height: 800 });
      const start = Date.now() - (123 * 60 + 34) * 60_000;
      await seedMatch(page, {
        table: TABLE,
        clock: { startedAt: new Date(start).toISOString(), pauses: [] },
      });
      const time = page.getByRole('button', { name: /^Spieldauer 123:34 – Verlauf$/ });
      await expect(time).toBeVisible();
      const end = await page
        .getByRole('button', { name: 'Partie beenden ohne Ergebnis' })
        .boundingBox();
      const timeBox = await time.boundingBox();
      const pause = await page.getByRole('button', { name: 'Anhalten' }).boundingBox();
      if (end === null || timeBox === null || pause === null) {
        throw new Error('the end row is not shown');
      }
      // One row: the time is centred on the pill, the pause button is inside the page.
      expect(Math.abs(timeBox.y + timeBox.height / 2 - (end.y + end.height / 2))).toBeLessThan(4);
      expect(pause.x + pause.width).toBeLessThanOrEqual(width);
    }
  });

  test('AK-6: a long history opens at its end, at "jetzt" (PO 22.11.2026)', async ({ page }) => {
    // Six pauses of 10 minutes, one per hour: longer than the sheet on every device.
    const hour = 3_600_000;
    const start = Date.now() - 7 * hour;
    const pauses = [1, 2, 3, 4, 5, 6].map((at) => ({
      from: new Date(start + at * hour).toISOString(),
      to: new Date(start + at * hour + 600_000).toISOString(),
    }));
    await seedMatch(page, {
      table: TABLE,
      clock: { startedAt: new Date(start).toISOString(), pauses },
    });
    await expect(page.getByRole('heading', { name: 'Laufende Partie' })).toBeVisible();

    await page.getByRole('button', { name: /^Spieldauer .* – Verlauf$/ }).click();
    const sheet = page.getByRole('dialog', { name: 'Spieldauer' });
    await expect(sheet.getByText('Pause 6', { exact: true })).toBeInViewport();
    await expect(sheet.getByText('Beginn', { exact: true })).not.toBeInViewport();
  });

  test('AK-6, AK-7: the history of the timer; the form is filled in from the match and ends it', async ({
    page,
  }) => {
    await seedMatch(page, { table: TABLE, options: { edition: 'cities-and-knights' } });
    // As when the app starts: the entry of the overview is the router's own, so going back from
    // the sheet can be held (the seeding changed the address from outside).
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Laufende Partie' })).toBeVisible();

    // AK-1: hours and minutes, the seconds small beside them.
    const time = page.getByRole('button', { name: /^Spieldauer .* – Verlauf$/ });
    const minutesOf = async (): Promise<number> => {
      const [hours = 0, minutes = 0] = (await time.innerText()).split(':').map(Number);
      return hours * 60 + minutes;
    };
    await expect(time).toHaveText(/^\d+:\d{2}:\d{2}$/);
    const before = await minutesOf();

    // AK-6: a pause of 15 minutes is added in the played stretch and can be removed again.
    await time.click();
    const sheet = page.getByRole('dialog', { name: 'Spieldauer' });
    await expect(sheet.getByText('Beginn', { exact: true })).toBeVisible();
    await sheet.getByRole('button', { name: 'Pause in dieser Strecke nachtragen' }).click();
    await sheet.getByRole('button', { name: '15 Minuten' }).click();
    await sheet.getByRole('button', { name: 'Hinzufügen' }).click();
    await expect(sheet.getByText('Pause 1', { exact: true })).toBeVisible();
    await sheet.getByRole('button', { name: 'Pause 1 löschen' }).click();
    await expect(sheet.getByText('Pause 1', { exact: true })).toBeHidden();
    await sheet.getByRole('button', { name: 'Pause in dieser Strecke nachtragen' }).click();
    await sheet.getByRole('textbox', { name: 'Pause in Minuten' }).fill('5');
    await sheet.getByRole('button', { name: 'Hinzufügen' }).click();

    // AK-7: closing beside the sheet asks; "Übernehmen" stores the 5 minutes.
    await page.mouse.click(10, 10);
    const question = page.getByRole('alertdialog', { name: 'Änderungen übernehmen?' });
    await question.getByRole('button', { name: 'Übernehmen' }).click();
    await expect(sheet).toBeHidden();
    expect(before - (await minutesOf())).toBeGreaterThanOrEqual(4);
    expect(before - (await minutesOf())).toBeLessThanOrEqual(5);

    // Pausing acts at once; "Fertig" without a change just closes, as does going back.
    await time.click();
    await sheet.getByRole('button', { name: 'Anhalten' }).click();
    await expect(sheet.getByRole('button', { name: 'Fortsetzen' })).toBeVisible();
    await sheet.getByRole('button', { name: 'Fertig' }).click();
    await expect(sheet).toBeHidden();
    await expect(page.getByRole('button', { name: 'Fortsetzen' })).toBeVisible();
    // AK-7: going back with a change asks too; "Verwerfen" keeps the stored timer.
    await time.click();
    await sheet.getByRole('button', { name: 'Pause in dieser Strecke nachtragen' }).first().click();
    await sheet.getByRole('button', { name: 'Hinzufügen' }).click();
    await page.goBack();
    await question.getByRole('button', { name: 'Verwerfen' }).click();
    await expect(sheet).toBeHidden();
    await time.click();
    await expect(sheet.getByText('Pause 3', { exact: true })).toBeHidden();
    await page.goBack();
    await expect(sheet).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Laufende Partie' })).toBeVisible();

    await page.getByRole('link', { name: 'Ergebnis eintragen' }).click();
    await expect(page.getByText('Catan · Freitagsrunde · aus der Partie')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Städte & Ritter' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('button', { name: 'Uhrzeit löschen' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Spieldauer Minuten' })).not.toHaveValue('');
    // US-ER-01 AK-7: hours and minutes; minutes above 59 are marked.
    await page.getByRole('textbox', { name: 'Spieldauer Minuten' }).fill('95');
    await expect(page.getByRole('textbox', { name: 'Spieldauer Minuten' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await page.getByRole('textbox', { name: 'Spieldauer Stunden' }).fill('1');
    await page.getByRole('textbox', { name: 'Spieldauer Minuten' }).fill('35');
    for (const [name, points] of [
      ['Anna', '10'],
      ['Ben', '8'],
      ['Clara', '8'],
      ['David', '5'],
    ] as const) {
      await page.getByRole('textbox', { name: `Punkte ${name}` }).fill(points);
    }
    await page.getByRole('button', { name: 'Ergebnis speichern' }).click();

    await expect(saved(page)).toContainText('Anna gewinnt');
    await expect(page.getByText('spielt gerade')).toHaveCount(0);
  });
});
