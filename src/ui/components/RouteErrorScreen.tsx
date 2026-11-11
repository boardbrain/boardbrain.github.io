import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { ErrorScreen } from './ErrorScreen';

/**
 * Error view of the routes (K-5, ADR-025): React Router catches errors while drawing a view, in
 * the frame and while loading a view on demand, and shows this screen instead of its own
 * developer page. It sits on the frame route, so it fills the whole screen (design K-5, O2).
 */
export function RouteErrorScreen(): React.JSX.Element {
  const error = useRouteError();
  // External system: the local console. Error details never leave the device (NFA-DH-01).
  useEffect(() => {
    console.error('Unexpected error in a view', error);
  }, [error]);
  return <ErrorScreen error={error} />;
}
