import { test as base, expect } from '@playwright/test';

/**
 * Testfunktion mit Netzwerkwächter (Entwicklungsrichtlinien 8.3, NFA-DH-01): Jede Anfrage
 * an eine fremde Adresse wird blockiert und lässt den Test fehlschlagen. Außerdem darf die
 * Konsole keine Fehler enthalten, auch keine Verstöße gegen die Content-Security-Policy.
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

      expect(foreignRequests, 'Anfragen an fremde Adressen (NFA-DH-01)').toEqual([]);
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

      expect(errors, 'Fehler in der Browser-Konsole').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
