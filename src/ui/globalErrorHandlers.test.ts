import { describe, expect, it, vi } from 'vitest';
import { installGlobalErrorHandlers } from './globalErrorHandlers';

describe('Entwicklungsrichtlinien 7.2 globale Fehlerbehandlung', () => {
  it('meldet ein error-Ereignis mit dem Fehlerobjekt', () => {
    const onError = vi.fn();
    const uninstall = installGlobalErrorHandlers(window, onError);
    const error = new Error('global');

    window.dispatchEvent(new ErrorEvent('error', { error, message: 'global' }));
    uninstall();

    expect(onError).toHaveBeenCalledWith(error);
  });

  it('meldet ein error-Ereignis ohne Fehlerobjekt mit der Nachricht', () => {
    const onError = vi.fn();
    const uninstall = installGlobalErrorHandlers(window, onError);

    window.dispatchEvent(new ErrorEvent('error', { message: 'Skriptfehler' }));
    uninstall();

    expect(onError).toHaveBeenCalledWith('Skriptfehler');
  });

  it('meldet ein nicht behandeltes Promise mit dem Grund', () => {
    const onError = vi.fn();
    const uninstall = installGlobalErrorHandlers(window, onError);
    const event = new Event('unhandledrejection');
    Object.defineProperty(event, 'reason', { value: 'abgelehnt' });

    window.dispatchEvent(event);
    uninstall();

    expect(onError).toHaveBeenCalledWith('abgelehnt');
  });

  it('entfernt die Behandler wieder', () => {
    const onError = vi.fn();
    const uninstall = installGlobalErrorHandlers(window, onError);
    uninstall();

    window.dispatchEvent(new ErrorEvent('error', { message: 'später' }));

    expect(onError).not.toHaveBeenCalled();
  });
});
