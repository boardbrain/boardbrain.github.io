import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { ErrorScreen } from './ErrorScreen';

type RouteErrorScreenProps = {
  /** Records the error for the diagnostics (K-9); composed in `src/main.tsx`. */
  readonly onError?: ((error: unknown) => void) | undefined;
};

/**
 * Error view of the routes (K-5, ADR-025): React Router catches errors while drawing a view, in
 * the frame and while loading a view on demand, and shows this screen instead of its own
 * developer page. It sits on the frame route, so it fills the whole screen (design K-5, O2).
 */
export function RouteErrorScreen({ onError }: RouteErrorScreenProps): React.JSX.Element {
  const error = useRouteError();
  // External systems: the local console and the error list of the diagnostics. Error details
  // never leave the device on their own (NFA-DH-01).
  useEffect(() => {
    console.error('Unexpected error in a view', error);
    onError?.(error);
  }, [error, onError]);
  return <ErrorScreen error={error} />;
}
