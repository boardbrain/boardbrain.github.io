import { existsSync, readFileSync } from 'node:fs';
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

// Architecture 12.1: icons and status bar for the home screen of iOS and iPadOS; Android and
// Windows read the manifest.
function homeScreenTags(): Plugin {
  return {
    name: 'boardbrain-home-screen',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { name: 'theme-color', content: SURFACE_COLOR }, injectTo: 'head' },
      {
        tag: 'link',
        attrs: { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
        injectTo: 'head',
      },
      {
        tag: 'meta',
        attrs: { name: 'apple-mobile-web-app-title', content: de.app.name },
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
function progressiveWebApp(): Plugin[] {
  return VitePWA({
    strategies: 'injectManifest',
    srcDir: 'src/sw',
    filename: 'sw.ts',
    injectRegister: false,
    injectManifest: {
      rollupFormat: 'iife',
      globPatterns: ['**/*.{html,js,css,svg,png,woff2,webmanifest}'],
    },
    manifest: {
      id: '/',
      name: de.app.name,
      short_name: de.app.name,
      description: de.app.beschreibung,
      lang: 'de',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      // E-29: no orientation lock; phones in landscape show a hint instead (Architecture 13.1).
      background_color: SURFACE_COLOR,
      theme_color: SURFACE_COLOR,
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        {
          src: '/icons/icon-maskable-512.png',
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

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    contentSecurityPolicy(),
    homeScreenTags(),
    progressiveWebApp(),
  ],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  server: { ...serverOptions, port: 5173, strictPort: true },
  preview: { ...serverOptions, port: 4173, strictPort: true },
});
