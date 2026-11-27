import { expect, test } from './fixtures';
import { seedResults } from './seedDatabase';

// Thirty games: the game list is long; "Spiel 01" was played first, so it stands at the end.
const RESULTS = Array.from({ length: 30 }, (_, index) => ({
  date: `2026-10-${String(index + 1).padStart(2, '0')}`,
  game: `Spiel ${String(index + 1).padStart(2, '0')}`,
  winners: ['Anna'],
}));

test.describe('PO 27.11.2026 every page starts at its top', () => {
  test('a game far down the list opens its page at the top; back returns there', async ({
    page,
  }) => {
    await seedResults(page, { name: 'Freitagsrunde', members: ['Anna', 'Ben'] }, RESULTS);
    await page.getByRole('link', { name: 'Partie' }).click();
    const game = page.getByRole('link', { name: 'Spiel 01' });
    await game.scrollIntoViewIfNeeded();
    await game.click();

    await expect(page.getByRole('heading', { name: 'Ergebnis eintragen' })).toBeInViewport();
    await page.getByRole('button', { name: 'Zurück' }).click();
    await expect(page.getByRole('link', { name: 'Spiel 01' })).toBeInViewport();
  });
});
