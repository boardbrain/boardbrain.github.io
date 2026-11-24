import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { seedScorePadGames } from './seedDatabase';

const TABLE = { name: 'Freitagsrunde', members: ['Anna', 'Ben', 'Clara'] };
const GAMES = { Skyjo: 'lowest-wins', Uno: null } as const;

// Types a number into the field above the keyboard and moves on with "Weiter".
async function type(page: Page, value: string): Promise<void> {
  const field = page.locator('input[enterkeyhint]').last();
  await field.fill(value);
  await field.press('Enter');
}

test.describe('US-NB-01 to US-NB-05 score pad (design I3-C2)', () => {
  test('main path: start, enter a round, restart, store the result, read the rounds', async ({
    page,
  }) => {
    await seedScorePadGames(page, TABLE, GAMES);

    // US-NB-01 AK-1: only custom games with points; one table plays Skyjo, so no table choice.
    await page.getByRole('link', { name: /^Notizblock/ }).click();
    await expect(page.getByText('Welches Spiel? · nur mit Punkten')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Uno' })).toHaveCount(0);
    await page.getByRole('link', { name: 'Skyjo' }).click();

    // US-NB-03 AK-1: the sheet "Los geht’s" once, without a target by default.
    const sheet = page.getByRole('dialog', { name: 'Los geht’s' });
    await expect(sheet.getByRole('button', { name: 'Kein Ziel' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await sheet.getByRole('button', { name: 'Punkte' }).click();
    await sheet.getByRole('button', { name: '100', exact: true }).click();
    await sheet.getByRole('button', { name: 'Starten' }).click();
    await expect(page.getByRole('button', { name: 'Ziel 100P, ändern' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ergebnis speichern' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );

    // US-NB-02 AK-2, AK-3: the keyboard moves on; the complete round stores itself.
    await page.getByRole('button', { name: 'Runde 1, Anna' }).click();
    await type(page, '12');
    await type(page, '25');
    // The iPhone has no minus on its keypad: ± changes the sign.
    const field = page.locator('input[enterkeyhint]').last();
    await field.fill('2');
    await page.getByRole('button', { name: 'Vorzeichen wechseln' }).click();
    // The field shows a real minus sign, the key stays pressed.
    await expect(field).toHaveValue('−2');
    await expect(page.getByRole('button', { name: 'Vorzeichen wechseln' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await field.press('Enter');
    await expect(
      page.getByRole('button', { name: 'Runde 1, Clara: Stand -2, ändern' }),
    ).toBeVisible();

    // US-NB-01 AK-5: the score pad survives a restart; the start shows it.
    await page.reload();
    await expect(
      page.getByRole('button', { name: 'Runde 1, Anna: Stand 12, ändern' }),
    ).toBeVisible();
    // "Zurück" leads to the start, not to the choice of game or table (PO 24.11.2026).
    await page.getByRole('button', { name: 'Zurück' }).click();
    await expect(
      page.getByRole('link', { name: /Notizblock.*Skyjo · Freitagsrunde · Runde 2/ }),
    ).toBeVisible();
    // The back key of the device: the choice of the running score pad leads to the start, too.
    await page.goBack();
    await expect(
      page.getByRole('link', { name: /Notizblock.*Skyjo · Freitagsrunde · Runde 2/ }),
    ).toBeVisible();

    // E-51: at most one running match.
    await page.getByRole('button', { name: 'Partie' }).click();
    const running = page.getByRole('alertdialog', { name: 'Notizblock läuft' });
    await running.getByRole('button', { name: 'Zum Notizblock' }).click();

    // US-NB-04 AK-1, AK-2: the form with the sums; storing ends the score pad.
    await page.getByRole('button', { name: 'Ergebnis speichern' }).click();
    await expect(page.getByText('Skyjo · Freitagsrunde · aus dem Notizblock')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Punkte Clara' })).toHaveValue('-2');
    await page.getByRole('button', { name: 'Ergebnis speichern' }).click();
    await expect(page.getByRole('status')).toContainText('Clara');
    await expect(
      page.getByRole('link', { name: /Notizblock.*Punkte live mitschreiben/ }),
    ).toBeVisible();

    // US-NB-05 AK-1: the rounds in the detail.
    await page.getByRole('status').getByRole('button').click();
    await page.getByRole('link', { name: /Skyjo/ }).first().click();
    await page.getByRole('button', { name: 'Runden zeigen' }).click();
    await expect(page.getByLabel('Runde 1, Ben: Stand 25')).toBeVisible();
  });

  test('US-NB-02 AK-3, AK-4: a missing person is marked; a round can be changed and deleted', async ({
    page,
  }) => {
    await seedScorePadGames(page, TABLE, GAMES, [[12, 25, -2]]);
    await page.getByRole('link', { name: /^Notizblock/ }).click();

    await page.getByRole('button', { name: 'Runde 2, Anna' }).click();
    await page.locator('input[enterkeyhint]').last().fill('3');
    await page.locator('input[enterkeyhint]').last().blur();
    await expect(page.getByText('Noch nicht alle eingetragen')).toBeVisible();

    await page.getByRole('button', { name: 'Runde 1, Ben: Stand 25, ändern' }).click();
    await type(page, '20');
    await expect(
      page.getByRole('button', { name: 'Runde 1, Ben: Stand 20, ändern' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Runde 1 löschen' }).click();
    await page
      .getByRole('alertdialog', { name: 'Runde 1 löschen?' })
      .getByRole('button', { name: 'Löschen' })
      .click();
    await expect(page.getByRole('button', { name: 'Runde 1, Anna' })).toBeVisible();
  });

  test('US-NB-04 AK-3: "Beenden ohne Ergebnis" discards the score pad after asking', async ({
    page,
  }) => {
    await seedScorePadGames(page, TABLE, GAMES, [[12, 25, -2]]);
    await page.getByRole('link', { name: /^Notizblock/ }).click();
    await page.getByRole('button', { name: 'Beenden ohne Ergebnis' }).click();
    const ask = page.getByRole('alertdialog', { name: 'Notizblock beenden?' });
    await expect(ask).toContainText('1 Runde wird verworfen');
    await ask.getByRole('button', { name: 'Beenden' }).click();
    await expect(
      page.getByRole('link', { name: /Notizblock.*Punkte live mitschreiben/ }),
    ).toBeVisible();
  });
});
