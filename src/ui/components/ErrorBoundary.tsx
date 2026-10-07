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
 * Fängt unerwartete Fehler einer Ansicht ab und zeigt `ErrorScreen` (ADR-025,
 * Entwicklungsrichtlinien 7.2). Einzige Klassenkomponente: React bietet Error Boundaries
 * nur als Klasse an.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    // Nur lokal protokollieren; Fehlerdetails verlassen das Gerät nie (NFA-DH-01).
    console.error('Unerwarteter Fehler in einer Ansicht', error, info.componentStack);
  }

  override render(): ReactNode {
    return this.state.hasError ? <ErrorScreen error={this.state.error} /> : this.props.children;
  }
}
