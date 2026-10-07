import { test as base, expect } from '@playwright/test';

/**
 * Test function with network guard (Development Guidelines 8.3, NFA-DH-01): every request to a
 * foreign origin is blocked and fails the test. In addition, the console must not contain
 * errors, including Content Security Policy violations.
 */
export const test = base.extend<{ networkGuard: undefined; consoleGuard: undefined }>({
  networkGuard: [
    async ({ page, baseURL }, run) => {
      const ownOrigin = new URL(baseURL ?? 'http://localhost').origin;
      const foreignRequests: string[] = [];
      await page.context().route('**/*', async (route) => {
        const url = new URL(route.request().url());
        if (url.origin === ownOrigin || url.protocol === 'data:' || url.protocol === 'blob:') {
          await route.continue();
          return;
        }
        foreignRequests.push(url.href);
        await route.abort('blockedbyclient');
      });

      await run(undefined);

      expect(foreignRequests, 'requests to foreign origins (NFA-DH-01)').toEqual([]);
    },
    { auto: true },
  ],
  consoleGuard: [
    async ({ page }, run) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') {
          errors.push(message.text());
        }
      });
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await run(undefined);

      expect(errors, 'errors in the browser console').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
