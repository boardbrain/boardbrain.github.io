/**
 * Reports all errors that no error boundary catches: `error` and `unhandledrejection`
 * (Development Guidelines 7.2). Returns a function that removes the handlers.
 */
export function installGlobalErrorHandlers(
  target: Window,
  onError: (error: unknown) => void,
): () => void {
  const handleError = (event: ErrorEvent): void => {
    const error: unknown = event.error;
    onError(error ?? event.message);
  };
  const handleRejection = (event: PromiseRejectionEvent): void => {
    const reason: unknown = event.reason;
    onError(reason);
  };
  target.addEventListener('error', handleError);
  target.addEventListener('unhandledrejection', handleRejection);
  return () => {
    target.removeEventListener('error', handleError);
    target.removeEventListener('unhandledrejection', handleRejection);
  };
}
