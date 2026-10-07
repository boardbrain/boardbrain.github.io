import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { onTestFinished } from 'vitest';
import { createMasterDataService } from '@/app/services/masterDataService';
import type { BoardBrainDb } from '@/infra/db/database';
import { createDexieMasterDataStore } from '@/infra/db/masterDataStore';
import { AppDependenciesProvider } from '@/ui/AppDependencies';
import { fixedClock, sequentialIds } from './masterDataFakes';
import { createTestDb } from './testDatabase';

/**
 * Renders a view with an empty in-memory database, the real application services and a
 * router (Architecture 14.1, component tests). The database is closed after the test.
 */
export function renderWithApp(element: ReactNode, path = '/'): { db: BoardBrainDb } {
  const db = createTestDb();
  onTestFinished(() => {
    db.close();
  });
  const masterData = createMasterDataService({
    store: createDexieMasterDataStore(db),
    ids: sequentialIds(),
    clock: fixedClock(),
    supportedGameNames: ['Catan'],
  });
  render(
    <AppDependenciesProvider dependencies={{ db, masterData }}>
      <MemoryRouter initialEntries={[path]}>{element}</MemoryRouter>
    </AppDependenciesProvider>,
  );
  return { db };
}
