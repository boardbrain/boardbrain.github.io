// Gemeinsame Vorbereitung der Komponententests (Projekt „dom“ in vitest.config.ts).
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
