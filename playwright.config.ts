import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Architektur 14.5: Ende-zu-Ende-Tests laufen gegen `npm run preview`. Lokal über HTTPS mit
// dem mkcert-Zertifikat; Playwrights WebKit vertraut dem Windows-Zertifikatsspeicher nicht,
// deshalb werden Zertifikatsfehler ignoriert (die Seite bleibt ein sicherer Kontext).
// Auf GitHub gibt es kein Zertifikat; dort gilt http://localhost als sicherer Kontext.
const certDir = path.join(homedir(), '.boardbrain-certs');
const hasCertificate =
  existsSync(path.join(certDir, 'cert.pem')) && existsSync(path.join(certDir, 'key.pem'));
const baseURL = `${hasCertificate ? 'https' : 'http'}://localhost:4173`;
const isCi = Boolean(process.env.CI);

// NFA-PL-04: Smartphone und Tablet, jeweils Hoch- und Querformat, in Chromium und WebKit.
const DEVICES = {
  'chromium-phone': 'Galaxy S24',
  'chromium-phone-landscape': 'Galaxy S24 landscape',
  'chromium-tablet': 'Galaxy Tab S9',
  'chromium-tablet-landscape': 'Galaxy Tab S9 landscape',
  'webkit-phone': 'iPhone 17',
  'webkit-phone-landscape': 'iPhone 17 landscape',
  'webkit-tablet': 'iPad (gen 11)',
  'webkit-tablet-landscape': 'iPad (gen 11) landscape',
} as const;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.ts',
  // Entwicklungsrichtlinien 8.2: ein vergessenes .only lässt den Lauf auf GitHub scheitern.
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
    // Auf GitHub baut der Job e2e vorher selbst; lokal wird immer der aktuelle Stand gebaut.
    command: isCi ? 'npm run preview' : 'npm run build && npm run preview',
    url: baseURL,
    ignoreHTTPSErrors: true,
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
});
