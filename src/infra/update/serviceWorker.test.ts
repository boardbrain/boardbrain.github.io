import { describe, expect, it, vi } from 'vitest';
import { registerServiceWorker } from './serviceWorker';

describe('Architecture 11 registering the service worker', () => {
  it('registers /sw.js for the whole app', async () => {
    const register = vi.fn(() => Promise.resolve({}));

    await registerServiceWorker({ navigator: { serviceWorker: { register } } });

    expect(register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
  });

  it('does nothing without the service worker interface', async () => {
    await expect(registerServiceWorker({ navigator: {} })).resolves.toBeUndefined();
  });

  it('reports a failed registration without stopping the app', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const failure = new Error('blocked');

    await registerServiceWorker({
      navigator: { serviceWorker: { register: () => Promise.reject(failure) } },
    });

    expect(warn).toHaveBeenCalledWith('Registering the service worker failed', failure);
    warn.mockRestore();
  });
});
