import { CONTENT_SECURITY_POLICY } from '../../vite.config.ts';
import { expect, test } from './fixtures';

test.describe('Architecture 12.4 Content Security Policy', () => {
  test('the production build contains the meta tag with the defined policy', async ({ page }) => {
    await page.goto('/');

    const meta = page.locator('meta[http-equiv="Content-Security-Policy"]');
    await expect(meta).toHaveCount(1);
    await expect(meta).toHaveAttribute('content', CONTENT_SECURITY_POLICY);
  });

  test('the app runs under the policy without violations', async ({ page }) => {
    // Violations appear as console errors; the consoleGuard fixture checks for them.
    await page.goto('/#/diagnose');

    await expect(page.getByRole('heading', { name: 'Diagnose' })).toBeVisible();
  });
});
