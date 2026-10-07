import { describe, expect, it, vi } from 'vitest';
import { installGlobalErrorHandlers } from './globalErrorHandlers';

describe('Development Guidelines 7.2 global error handling', () => {
  it('reports an error event with the error object', () => {
    const onError = vi.fn();
    const uninstall = installGlobalErrorHandlers(window, onError);
    const error = new Error('global');

    window.dispatchEvent(new ErrorEvent('error', { error, message: 'global' }));
    uninstall();

    expect(onError).toHaveBeenCalledWith(error);
  });

  it('reports an error event without an error object with its message', () => {
    const onError = vi.fn();
    const uninstall = installGlobalErrorHandlers(window, onError);

    window.dispatchEvent(new ErrorEvent('error', { message: 'script error' }));
    uninstall();

    expect(onError).toHaveBeenCalledWith('script error');
  });

  it('reports an unhandled rejection with its reason', () => {
    const onError = vi.fn();
    const uninstall = installGlobalErrorHandlers(window, onError);
    const event = new Event('unhandledrejection');
    Object.defineProperty(event, 'reason', { value: 'rejected' });

    window.dispatchEvent(event);
    uninstall();

    expect(onError).toHaveBeenCalledWith('rejected');
  });

  it('removes the handlers again', () => {
    const onError = vi.fn();
    const uninstall = installGlobalErrorHandlers(window, onError);
    uninstall();

    window.dispatchEvent(new ErrorEvent('error', { message: 'later' }));

    expect(onError).not.toHaveBeenCalled();
  });
});
