import path from 'node:path';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

// ADR-005: Vitest uses the same configuration as the build.
export default mergeConfig(
  viteConfig,
  defineConfig({
    // Test helpers such as the deterministic random sources (Architecture 14.2); production
    // code must not import them (dependency-cruiser rule production-not-to-tests).
    resolve: {
      alias: { '@tests': path.resolve(import.meta.dirname, 'tests') },
    },
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            environment: 'node',
            include: ['src/**/*.test.ts', 'tests/support/**/*.test.ts'],
            exclude: ['src/ui/**'],
          },
        },
        {
          extends: true,
          test: {
            name: 'dom',
            environment: 'jsdom',
            include: ['src/ui/**/*.test.{ts,tsx}'],
            setupFiles: ['tests/support/setupDom.ts'],
          },
        },
        {
          extends: true,
          test: {
            name: 'statistical',
            environment: 'node',
            include: ['tests/statistical/**/*.stat.test.ts'],
            // Architecture 14.4: a failed test is retried exactly once.
            retry: 1,
          },
        },
      ],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx', 'src/**/*.d.ts'],
        reporter: ['text-summary', 'text', 'html'],
        // Development Guidelines 8.2: at least 90 % for core and games.
        thresholds: {
          'src/core/**': { lines: 90, branches: 90, functions: 90, statements: 90 },
          'src/games/**': { lines: 90, branches: 90, functions: 90, statements: 90 },
        },
      },
    },
  }),
);
