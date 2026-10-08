// Shared setup for component tests (project "dom" in vitest.config.ts).
import '@testing-library/jest-dom/vitest';
// Dexie's live queries (useLiveQuery) rely on a global IndexedDB, which jsdom lacks; in the
// browser it always exists. Each test still gets its own empty database (testDatabase.ts).
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom has no matchMedia; component tests run as on a phone (no media query matches).
Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }),
});

afterEach(() => {
  cleanup();
});
