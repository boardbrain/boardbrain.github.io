import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, type Plugin, type ServerOptions } from 'vite';
import packageJson from './package.json' with { type: 'json' };

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
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), contentSecurityPolicy()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  server: { ...serverOptions, port: 5173, strictPort: true },
  preview: { ...serverOptions, port: 4173, strictPort: true },
});
