import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { onTestFinished } from 'vitest';
import { createMasterDataService, type MasterDataService } from '@/app/services/masterDataService';
import type { BoardBrainDb } from '@/infra/db/database';
import { createDexieMasterDataStore } from '@/infra/db/masterDataStore';
import { AppDependenciesProvider } from '@/ui/AppDependencies';
import { fixedClock, sequentialIds } from './masterDataFakes';
import { createTestDb } from './testDatabase';

type RenderOptions = {
  /** Start address of the router. */
  readonly path?: string;
  /** Wraps the real service, e.g. to hold back a save in a test. */
  readonly wrapMasterData?: (service: MasterDataService) => MasterDataService;
};

/**
 * Renders a view with an empty in-memory database, the real application services and a
 * router (Architecture 14.1, component tests). The database is closed after the test.
 */
export function renderWithApp(
  element: ReactNode,
  { path = '/', wrapMasterData = (service) => service }: RenderOptions = {},
): { db: BoardBrainDb } {
  const db = createTestDb();
  onTestFinished(() => {
    db.close();
  });
  const masterData = wrapMasterData(
    createMasterDataService({
      store: createDexieMasterDataStore(db),
      ids: sequentialIds(),
      clock: fixedClock(),
      supportedGameNames: ['Catan'],
    }),
  );
  render(
    <AppDependenciesProvider dependencies={{ db, masterData }}>
      <MemoryRouter initialEntries={[path]}>{element}</MemoryRouter>
    </AppDependenciesProvider>,
  );
  return { db };
}
