import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorScreen } from './ErrorScreen';

type ErrorBoundaryProps = {
  readonly children: ReactNode;
};

type ErrorBoundaryState = {
  readonly hasError: boolean;
  readonly error: unknown;
};

/**
 * Catches unexpected errors of a view and shows `ErrorScreen` (ADR-025, Development
 * Guidelines 7.2). The only class component: React offers error boundaries only as classes.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    // Log locally only; error details never leave the device (NFA-DH-01).
    console.error('Unexpected error in a view', error, info.componentStack);
  }

  override render(): ReactNode {
    return this.state.hasError ? <ErrorScreen error={this.state.error} /> : this.props.children;
  }
}
