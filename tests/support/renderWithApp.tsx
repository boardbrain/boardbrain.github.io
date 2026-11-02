import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  createMemoryRouter,
  RouterProvider,
  type DataRouter,
  type RouteObject,
} from 'react-router';
import { onTestFinished } from 'vitest';
import { createMasterDataService, type MasterDataService } from '@/app/services/masterDataService';
import { createSessionService, type SessionService } from '@/app/services/sessionService';
import type { BoardBrainDb } from '@/infra/db/database';
import { createDexieMasterDataStore } from '@/infra/db/masterDataStore';
import { createDexieSessionStore } from '@/infra/db/sessionStore';
import { AppDependenciesProvider } from '@/ui/AppDependencies';
import { fixedClock, sequentialIds } from './masterDataFakes';
import { SeededRandomSource } from './seededRandomSource';
import { createTestDb } from './testDatabase';

type RenderOptions = {
  /** Start address of the router. */
  readonly path?: string;
  /** Routes instead of one route for `element`, e.g. a layout route with its children. */
  readonly routes?: RouteObject[];
  /** Seed of the randomness of the session service. */
  readonly seed?: number;
  /** Wraps the real service, e.g. to hold back a save in a test. */
  readonly wrapMasterData?: (service: MasterDataService) => MasterDataService;
};

/**
 * Renders a view with an empty in-memory database, the real application services and a
 * data router like the app, so `useBlocker` works (Architecture 14.1, component tests). The
 * database is closed after the test.
 */
export function renderWithApp(
  element: ReactNode,
  { path = '/', routes, seed = 1, wrapMasterData = (service) => service }: RenderOptions = {},
): { db: BoardBrainDb; session: SessionService; router: DataRouter } {
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
  const session = createSessionService({
    store: createDexieSessionStore(db),
    clock: fixedClock(),
    rng: new SeededRandomSource(seed),
  });
  const router = createMemoryRouter(routes ?? [{ path: '*', element }], {
    initialEntries: [path],
  });
  render(
    <AppDependenciesProvider dependencies={{ db, masterData, session }}>
      <RouterProvider router={router} />
    </AppDependenciesProvider>,
  );
  return { db, session, router };
}
