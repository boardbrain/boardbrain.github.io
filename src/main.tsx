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

// Entry point and the only place where implementations are composed (Architecture 4.2).

const container = document.getElementById('root');
if (container === null) {
  throw new Error('Element #root is missing in index.html');
}
const root = createRoot(container);

// The diagnostics only read; they are determined once at startup.
const diagnostics = readDiagnostics();

// ADR-019: hash routing. During setup the diagnostics view is the start view (Architecture 13.1).
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
  console.error('Unexpected error outside a view', error);
  root.render(<ErrorScreen error={error} />);
});

root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
