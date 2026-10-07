import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, Navigate } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { readDiagnostics } from '@/infra/platform/diagnostics';
import { ErrorBoundary } from '@/ui/components/ErrorBoundary';
import { ErrorScreen } from '@/ui/components/ErrorScreen';
import { installGlobalErrorHandlers } from '@/ui/globalErrorHandlers';
import { DiagnosticsView } from '@/ui/views/diagnostics/DiagnosticsView';
import '@/ui/styles/tokens.css';
import '@/ui/styles/global.css';

// Einstieg und einzige Stelle, an der Implementierungen zusammengesetzt werden (Architektur 4.2).

const container = document.getElementById('root');
if (container === null) {
  throw new Error('Element #root fehlt in index.html');
}
const root = createRoot(container);

// Die Diagnose liest nur; sie wird einmal beim Start ermittelt.
const diagnostics = readDiagnostics();

// ADR-019: Hash-Routing. Im Setup ist die Diagnoseansicht die Startansicht (Architektur 13.1).
const router = createHashRouter([
  { path: '/', element: <Navigate to="/diagnose" replace /> },
  {
    path: '/diagnose',
    element: (
      <ErrorBoundary>
        <Suspense fallback={null}>
          <DiagnosticsView diagnostics={diagnostics} version={__APP_VERSION__} />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  { path: '*', element: <Navigate to="/diagnose" replace /> },
]);

installGlobalErrorHandlers(window, (error) => {
  console.error('Unerwarteter Fehler außerhalb einer Ansicht', error);
  root.render(<ErrorScreen error={error} />);
});

root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
