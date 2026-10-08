import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Architecture 14.5: end-to-end tests run against `npm run preview`. Locally over HTTPS with the
// mkcert certificate; Playwright's WebKit does not trust the Windows certificate store, so
// certificate errors are ignored (the page stays a secure context). GitHub has no certificate;
// there http://localhost counts as a secure context.
const certDir = path.join(homedir(), '.boardbrain-certs');
const hasCertificate =
  existsSync(path.join(certDir, 'cert.pem')) && existsSync(path.join(certDir, 'key.pem'));
const baseURL = `${hasCertificate ? 'https' : 'http'}://localhost:4173`;
const isCi = Boolean(process.env.CI);

// NFA-PL-04: phones in portrait, tablets in portrait and landscape, in Chromium and WebKit. Phones
// in landscape only show a hint to turn the phone (navigation.spec.ts).
const DEVICES = {
  'chromium-phone': 'Galaxy S24',
  'chromium-tablet': 'Galaxy Tab S9',
  'chromium-tablet-landscape': 'Galaxy Tab S9 landscape',
  'webkit-phone': 'iPhone 17',
  'webkit-tablet': 'iPad (gen 11)',
  'webkit-tablet-landscape': 'iPad (gen 11) landscape',
} as const;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.ts',
  // Development Guidelines 8.2: a forgotten .only fails the run on GitHub.
  forbidOnly: isCi,
  retries: 0,
  fullyParallel: true,
  reporter: isCi ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    ignoreHTTPSErrors: hasCertificate,
    trace: 'retain-on-failure',
  },
  projects: Object.entries(DEVICES).map(([name, device]) => ({
    name,
    use: { ...devices[device] },
  })),
  webServer: {
    // On GitHub the e2e job builds beforehand; locally the current state is always built.
    command: isCi ? 'npm run preview' : 'npm run build && npm run preview',
    url: baseURL,
    ignoreHTTPSErrors: true,
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
});
