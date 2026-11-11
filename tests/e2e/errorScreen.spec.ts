import { expect, test } from './fixtures';

// K-5: the views of a match load on first use. After an update the old files may be gone; the
// request is blocked here, so loading the view fails like then.
const MATCH_VIEWS = '**/*matchViews*';

test.describe('K-5 error screen instead of the developer page of React Router', () => {
  // The blocked request and the error view's own log line (RouteErrorScreen).
  test.use({
    expectedConsoleErrors:
      /^(Failed to load resource|Unexpected error in a view [\s\S]*matchViews)/,
  });

  test('shows the own error screen when a view cannot be loaded and leads back to the start', async ({
    page,
  }) => {
    await page.route(MATCH_VIEWS, (route) => route.abort());
    await page.goto('/#/partie/neu');

    const screen = page.getByRole('alert');
    await expect(screen.getByRole('heading', { name: 'Etwas ist schiefgelaufen' })).toBeVisible();
    await expect(page.getByText('Unexpected Application Error!')).toHaveCount(0);
    // O2: the whole screen, without the card hand.
    await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toHaveCount(0);

    await screen.getByRole('button', { name: 'Technische Details' }).click();
    await expect(screen.getByText(/Adresse: #\/partie\/neu/)).toBeVisible();

    await page.unroute(MATCH_VIEWS);
    await screen.getByRole('button', { name: 'Zum Start' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Start' })).toBeAttached();
    await expect(page).toHaveURL(/#\/$/);
  });
});
