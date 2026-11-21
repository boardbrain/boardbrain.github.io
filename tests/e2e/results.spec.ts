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

test.describe('US-AB-06 AK-2 and US-AB-07 the result of the running match', () => {
  test('AK-6: the timer is corrected; the form is filled in from the match and ends it', async ({
    page,
  }) => {
    await seedMatch(page, { table: TABLE, options: { edition: 'cities-and-knights' } });
    await expect(page.getByRole('heading', { name: 'Laufende Partie' })).toBeVisible();

    const time = page.getByRole('button', { name: /^Spieldauer .* – Details$/ });
    const shown = await time.innerText();
    await time.click();
    const details = page.getByRole('alertdialog');
    // The details show the same time as the overview (no minute added) and add 5 minutes.
    const minutesOf = (text: string): number => {
      const [hours = 0, rest = 0] = text.split(':').map(Number);
      return hours * 60 + rest;
    };
    const big = details
      .getByRole('heading', { name: 'Spieldauer' })
      .locator('xpath=preceding-sibling::span[1]');
    expect(minutesOf(await big.innerText())).toBe(minutesOf(shown));
    await details.getByRole('button', { name: 'plus 5 Minuten' }).click();
    expect(minutesOf(await big.innerText())).toBe(minutesOf(shown) + 5);
    await details.getByRole('button', { name: 'Anhalten' }).click();
    await details.getByRole('button', { name: 'Übernehmen' }).click();
    await expect(page.getByRole('button', { name: 'Fortsetzen' })).toBeVisible();

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
