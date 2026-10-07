import { CONTENT_SECURITY_POLICY } from '../../vite.config.ts';
import { expect, test } from './fixtures';

test.describe('Architektur 12.4 Content-Security-Policy', () => {
  test('der Produktions-Build enthält das Meta-Tag mit der festgelegten Richtlinie', async ({
    page,
  }) => {
    await page.goto('/');

    const meta = page.locator('meta[http-equiv="Content-Security-Policy"]');
    await expect(meta).toHaveCount(1);
    await expect(meta).toHaveAttribute('content', CONTENT_SECURITY_POLICY);
  });

  test('die App läuft unter der Richtlinie ohne Verstöße', async ({ page }) => {
    // Verstöße erscheinen als Fehler in der Konsole; der consoleGuard der Fixture prüft das.
    await page.goto('/#/diagnose');

    await expect(page.getByRole('heading', { name: 'Diagnose' })).toBeVisible();
  });
});
