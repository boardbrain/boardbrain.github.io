import { StrictMode, Suspense, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, Navigate } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { createMasterDataService } from '@/app/services/masterDataService';
import { SUPPORTED_GAMES } from '@/games/registry';
import { t } from '@/i18n/t';
import { BoardBrainDb } from '@/infra/db/database';
import { createDexieMasterDataStore } from '@/infra/db/masterDataStore';
import { readDiagnostics } from '@/infra/platform/diagnostics';
import { systemClock } from '@/infra/platform/systemClock';
import { uuidGenerator } from '@/infra/random/uuidGenerator';
import { AppDependenciesProvider, type AppDependencies } from '@/ui/AppDependencies';
import { AppLayout } from '@/ui/components/AppLayout';
import { ErrorBoundary } from '@/ui/components/ErrorBoundary';
import { ErrorScreen } from '@/ui/components/ErrorScreen';
import { installGlobalErrorHandlers } from '@/ui/globalErrorHandlers';
import { DiagnosticsView } from '@/ui/views/diagnostics/DiagnosticsView';
import { GamesView } from '@/ui/views/management/GamesView';
import { ManagementView } from '@/ui/views/management/ManagementView';
import { PersonsView } from '@/ui/views/management/PersonsView';
import { StartView } from '@/ui/views/start/StartView';
import '@/ui/styles/tokens.css';
import '@/ui/styles/global.css';

// Entry point and the only place where implementations are composed (Architecture 4.2).

const container = document.getElementById('root');
if (container === null) {
  throw new Error('Element #root is missing in index.html');
}
const root = createRoot(container);

installGlobalErrorHandlers(window, (error) => {
  console.error('Unexpected error outside a view', error);
  root.render(<ErrorScreen error={error} />);
});

// The diagnostics only read; they are determined once at startup.
const diagnostics = readDiagnostics();

const db = new BoardBrainDb();
const dependencies: AppDependencies = {
  db,
  masterData: createMasterDataService({
    store: createDexieMasterDataStore(db),
    ids: uuidGenerator,
    clock: systemClock,
    supportedGameNames: SUPPORTED_GAMES.map((game) => t(game.nameKey)),
  }),
};

// Development Guidelines 6: every view has its own error boundary.
function view(element: ReactNode): ReactNode {
  return (
    <ErrorBoundary>
      <Suspense fallback={null}>{element}</Suspense>
    </ErrorBoundary>
  );
}

// ADR-019: hash routing. The diagnostics view is reachable via #/diagnose only
// (Architecture 13.1).
const router = createHashRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: view(<StartView />) },
      { path: '/verwaltung', element: view(<ManagementView />) },
      { path: '/verwaltung/personen', element: view(<PersonsView />) },
      { path: '/verwaltung/spiele', element: view(<GamesView />) },
      {
        path: '/diagnose',
        element: view(<DiagnosticsView diagnostics={diagnostics} version={__APP_VERSION__} />),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

// Architecture 11.3: the app becomes usable only once the database is open and possible
// migrations have run.
db.open().then(
  () => {
    root.render(
      <StrictMode>
        <AppDependenciesProvider dependencies={dependencies}>
          <RouterProvider router={router} />
        </AppDependenciesProvider>
      </StrictMode>,
    );
  },
  (error: unknown) => {
    console.error('Opening the database failed', error);
    root.render(<ErrorScreen error={error} />);
  },
);
