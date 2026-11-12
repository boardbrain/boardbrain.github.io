import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, type Plugin, type ServerOptions } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import packageJson from './package.json' with { type: 'json' };
import { de } from './src/i18n/de.ts';

// Architecture 12.4: own origin only. Directives that only work as HTTP headers
// (e.g. frame-ancestors) are omitted because GitHub Pages does not allow custom headers.
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

// Adds the Content Security Policy to the production build only; the dev server injects its
// own scripts and styles and therefore runs without a policy.
function contentSecurityPolicy(): Plugin {
  return {
    name: 'boardbrain-content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
        injectTo: 'head-prepend',
      },
    ],
  };
}

// NFA-GB-05: the manifest and the status bar need a colour value; it is read from the design
// tokens (surface of the default design "Holz") instead of being written down a second time.
function surfaceColor(): string {
  const tokens = readFileSync(path.join(import.meta.dirname, 'src/ui/styles/tokens.css'), 'utf8');
  const match = /:root\[data-theme='wood'\]\s*\{[^}]*?--color-surface:\s*([^;]+);/.exec(tokens);
  if (match?.[1] === undefined) {
    throw new Error('--color-surface of the design wood is missing in tokens.css');
  }
  return match[1].trim();
}

const SURFACE_COLOR = surfaceColor();

// E-40, Architecture 16.6: the build mode "acceptance" (npm run build:acceptance, then
// npm run preview:acceptance) turns the local acceptance app into an app of its own on the home
// screen, with its own name and violet icons. Its origin differs from the published app anyway,
// so both install side by side with separate data. It has its own folder and port, so the
// end-to-end tests on port 4173 never pick up its build. Every other mode builds the published
// app unchanged.
const ACCEPTANCE_MODE = 'acceptance';
const ACCEPTANCE_ICON_SOURCE = path.join(import.meta.dirname, 'public-acceptance', 'icons');

type AppIdentity = Readonly<{ name: string; iconDir: string; outDir: string; previewPort: number }>;

function appIdentity(mode: string): AppIdentity {
  return mode === ACCEPTANCE_MODE
    ? {
        name: de.app.nameAbnahme,
        iconDir: '/icons-acceptance',
        outDir: 'dist-acceptance',
        previewPort: 4174,
      }
    : { name: de.app.name, iconDir: '/icons', outDir: 'dist', previewPort: 4173 };
}

// Ships the violet icons in the acceptance build only; the published build does not contain them.
function acceptanceIcons(mode: string): Plugin {
  return {
    name: 'boardbrain-acceptance-icons',
    apply: () => mode === ACCEPTANCE_MODE,
    generateBundle() {
      for (const file of readdirSync(ACCEPTANCE_ICON_SOURCE)) {
        this.emitFile({
          type: 'asset',
          fileName: `icons-acceptance/${file}`,
          source: readFileSync(path.join(ACCEPTANCE_ICON_SOURCE, file)),
        });
      }
    },
  };
}

// Architecture 12.1: icons and status bar for the home screen of iOS and iPadOS; Android and
// Windows read the manifest.
function homeScreenTags(identity: AppIdentity): Plugin {
  return {
    name: 'boardbrain-home-screen',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { name: 'theme-color', content: SURFACE_COLOR }, injectTo: 'head' },
      {
        tag: 'link',
        attrs: { rel: 'apple-touch-icon', href: `${identity.iconDir}/apple-touch-icon.png` },
        injectTo: 'head',
      },
      {
        tag: 'meta',
        attrs: { name: 'apple-mobile-web-app-title', content: identity.name },
        injectTo: 'head',
      },
      {
        tag: 'meta',
        attrs: { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        injectTo: 'head',
      },
    ],
  };
}

// Architecture 11, 12.1 and 19 (increment I1): manifest and own service worker (injectManifest).
// The service worker is registered by infra/update in the production build only; the dev server
// runs without it (Architecture 11.4).
function progressiveWebApp(identity: AppIdentity): Plugin[] {
  return VitePWA({
    strategies: 'injectManifest',
    srcDir: 'src/sw',
    filename: 'sw.ts',
    injectRegister: false,
    injectManifest: {
      rollupFormat: 'iife',
      globPatterns: ['**/*.{html,js,css,svg,png,webp,woff2,webmanifest}'],
    },
    manifest: {
      id: '/',
      name: identity.name,
      short_name: identity.name,
      description: de.app.beschreibung,
      lang: 'de',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      // E-29: no orientation lock; phones in landscape show a hint instead (Architecture 13.1).
      background_color: SURFACE_COLOR,
      theme_color: SURFACE_COLOR,
      icons: [
        {
          src: `${identity.iconDir}/icon-192.png`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: `${identity.iconDir}/icon-512.png`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: `${identity.iconDir}/icon-maskable-512.png`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
  });
}

// Architecture 16.6: the mkcert server certificate lives outside the repository. If it exists,
// dev and preview run over HTTPS and are reachable on the local network; otherwise (e.g. on
// GitHub) over http://localhost.
function localServerOptions(): Pick<ServerOptions, 'https' | 'host'> {
  const certDir = path.join(homedir(), '.boardbrain-certs');
  const certFile = path.join(certDir, 'cert.pem');
  const keyFile = path.join(certDir, 'key.pem');
  if (!existsSync(certFile) || !existsSync(keyFile)) {
    return { host: 'localhost' };
  }
  return {
    https: { cert: readFileSync(certFile), key: readFileSync(keyFile) },
    host: true,
  };
}

const serverOptions = localServerOptions();

// K-9: the diagnostics name the build, because test versions share one version number. Without
// Git (e.g. a copy of the sources) the build has no commit; the diagnostics then show "unknown".
function buildCommit(): string {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch (error: unknown) {
    console.warn('Reading the Git commit for the diagnostics failed', error);
    return '';
  }
}

export default defineConfig(({ mode }) => {
  const identity = appIdentity(mode);
  return {
    base: '/',
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      contentSecurityPolicy(),
      homeScreenTags(identity),
      acceptanceIcons(mode),
      progressiveWebApp(identity),
    ],
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, 'src') },
    },
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
      __BUILD_COMMIT__: JSON.stringify(buildCommit()),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    server: { ...serverOptions, port: 5173, strictPort: true },
    build: { outDir: identity.outDir },
    preview: { ...serverOptions, port: identity.previewPort, strictPort: true },
  };
});
