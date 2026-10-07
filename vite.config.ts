import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, type Plugin, type ServerOptions } from 'vite';
import packageJson from './package.json' with { type: 'json' };

// Architektur 12.4: nur eigene Herkunft. Direktiven, die nur als HTTP-Header wirken
// (z. B. frame-ancestors), entfallen, weil GitHub Pages keine eigenen Header erlaubt.
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

// Fügt die Content-Security-Policy nur im Produktions-Build ein; der Entwicklungsserver
// schleust eigene Skripte und Stile ein und läuft deshalb ohne Richtlinie.
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

// Architektur 16.6: Das Serverzertifikat von mkcert liegt außerhalb des Repositorys.
// Ist es vorhanden, laufen dev und preview über HTTPS und sind im WLAN erreichbar;
// sonst (z. B. auf GitHub) über http://localhost.
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
