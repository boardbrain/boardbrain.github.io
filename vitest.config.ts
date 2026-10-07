import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

// ADR-005: Vitest nutzt dieselbe Konfiguration wie der Build.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            environment: 'node',
            include: ['src/**/*.test.ts'],
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
            // Architektur 14.4: ein fehlgeschlagener Test wird genau einmal wiederholt.
            retry: 1,
          },
        },
      ],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx', 'src/**/*.d.ts'],
        reporter: ['text-summary', 'text', 'html'],
        // Entwicklungsrichtlinien 8.2: mindestens 90 % für core und games.
        thresholds: {
          'src/core/**': { lines: 90, branches: 90, functions: 90, statements: 90 },
          'src/games/**': { lines: 90, branches: 90, functions: 90, statements: 90 },
        },
      },
    },
  }),
);
