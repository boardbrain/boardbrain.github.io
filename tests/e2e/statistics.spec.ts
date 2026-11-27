import { expect, test } from './fixtures';
import { seedDatabase, seedResults } from './seedDatabase';

const TABLE = { name: 'Freitagsrunde', members: ['Anna', 'Ben', 'Clara', 'David'] };

function day(back: number): string {
  const date = new Date();
  date.setDate(date.getDate() - back);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Two Catan matches with a duration, then Uno; Ben wins the last two in a row.
const RESULTS = [
  { date: day(30), winners: ['Anna'], scores: [10, 8, 7, 6], durationMinutes: 75 },
  { date: day(20), winners: ['Ben'], scores: [6, 10, 9, 5], durationMinutes: 50 },
  { date: day(10), game: 'Uno', winners: ['Clara'] },
  { date: day(5), game: 'Uno', winners: ['Ben'] },
  { date: day(2), game: 'Uno', winners: ['Ben'] },
];

test.describe('US-ST-01 to US-ST-05 statistics of a table (design I3-D)', () => {
  test('the card "Statistik" leads to the table; criterion, game, record and period work', async ({
    page,
  }) => {
    await seedResults(page, TABLE, RESULTS);

    // US-ST-01 AK-7: the third card of the hand, then the table.
    await page
      .getByRole('navigation', { name: 'Hauptnavigation' })
      .getByRole('link', { name: 'Statistik' })
      .click();
    await expect(page.getByRole('heading', { name: 'Statistik', level: 1 })).toBeVisible();
    await page.getByRole('link', { name: 'Freitagsrunde, 5 Partien, vorn Ben, 3 Siege' }).click();
    await expect(page.getByRole('heading', { name: 'Freitagsrunde', level: 1 })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Statistik', selected: true })).toBeVisible();

    // US-ST-01 AK-1, AK-6: podium by wins and the current series of Ben.
    const podium = page.getByRole('region', { name: 'Podest nach Siege' });
    await expect(podium.getByRole('listitem', { name: 'Platz 1: Ben, 3 Siege' })).toBeVisible();
    await page.getByRole('button', { name: 'Ben, 2 Siege in Folge, Kennzahlen zeigen' }).click();
    await expect(page.getByRole('group', { name: 'Kennzahlen von Ben' })).toBeVisible();

    // US-ST-02: another criterion.
    await page.getByRole('radio', { name: 'Längste Serie' }).click();
    await expect(page.getByRole('region', { name: 'Podest nach Längste Serie' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rang 1, Ben, 2 Siege in Folge' })).toBeVisible();

    // US-ST-03 AK-1: only Catan, with victory points.
    await page
      .getByRole('radiogroup', { name: 'Spiel' })
      .getByRole('radio', { name: /Catan/u })
      .click();
    await expect(page.getByRole('radio', { name: 'Ø Siegpunkte' })).toBeVisible();
    await page.getByRole('radio', { name: 'Ø Siegpunkte' }).click();
    await expect(page.getByRole('button', { name: 'Rang 1, Ben, 9,0 Ø Siegpunkte' })).toBeVisible();

    // US-ST-05: a record opens its match; back returns to the same view.
    await page.getByRole('link', { name: 'Kürzeste Partie: 50 min, Partie ansehen' }).click();
    await expect(page.getByRole('heading', { name: 'Catan', level: 1 })).toBeVisible();
    await page.getByRole('button', { name: 'Zurück' }).click();
    await expect(page.getByRole('radio', { name: 'Ø Siegpunkte' })).toBeChecked();

    // PO 27.11.2026: the eternal streak shows its matches.
    await page.getByRole('radio', { name: /Alle/u }).click();
    await page.getByRole('button', { name: 'Ewige Serie: 2 Siege, Partien ansehen' }).click();
    const series = page.getByRole('dialog', { name: 'Ewige Serie' });
    await expect(series.getByRole('link')).toHaveCount(2);
    await page.keyboard.press('Escape');
    await expect(series).toBeHidden();

    // US-ST-03 AK-6: an own period.
    await page.getByRole('button', { name: 'Zeitraum wählen, jetzt Gesamt' }).click();
    const sheet = page.getByRole('dialog', { name: 'Zeitraum' });
    await sheet.getByLabel('Von').fill(day(12));
    await sheet.getByLabel('Bis').fill(day(1));
    await sheet.getByRole('button', { name: '3 Partien zeigen' }).click();
    await expect(sheet).toBeHidden();
    await expect(page.getByRole('button', { name: 'Rang 1, Ben, 2 Siege' })).toBeVisible();
  });

  test('a table without results invites to enter the first one', async ({ page }) => {
    await seedDatabase(page, [TABLE]);

    await page.goto('/#/statistik');
    await page.getByRole('link', { name: 'Freitagsrunde, noch keine Partien' }).click();

    await expect(page.getByText('Noch keine Ergebnisse')).toBeVisible();
    await expect(
      page.getByRole('tabpanel', { name: 'Statistik' }).getByRole('link', {
        name: 'Ergebnis eintragen',
      }),
    ).toBeVisible();
  });
});
