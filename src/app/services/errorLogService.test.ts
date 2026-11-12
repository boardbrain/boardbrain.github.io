import { describe, expect, it, vi } from 'vitest';
import type { Clock, ErrorLogEntry, ErrorLogStore } from '@/app/ports';
import {
  createErrorLogService,
  ERROR_LOG_LIMIT,
  ERROR_MESSAGE_MAX_LENGTH,
  ERROR_REPEAT_WINDOW_MS,
} from './errorLogService';

/** In-memory store that keeps the entries like the database does. */
function memoryStore(initial: readonly ErrorLogEntry[] = []): ErrorLogStore & {
  entries: readonly ErrorLogEntry[];
} {
  const store = {
    entries: initial,
    update: (change: (entries: readonly ErrorLogEntry[]) => readonly ErrorLogEntry[]) => {
      store.entries = change(store.entries);
      return Promise.resolve();
    },
  };
  return store;
}

/** Clock that returns the given times one after another. */
function clockAt(...times: string[]): Clock {
  let index = 0;
  return {
    now: () => {
      const time = times[Math.min(index, times.length - 1)] ?? '';
      index += 1;
      return time;
    },
  };
}

const T0 = '2026-11-12T20:00:00.000Z';

describe('K-9 error log service', () => {
  it('records message, origin, address, time and version', async () => {
    const store = memoryStore();
    const service = createErrorLogService({ store, clock: clockAt(T0), version: '0.1.0' });
    const error = new TypeError('seat is undefined');
    error.stack = 'TypeError: seat is undefined\n    at PlacementBand (matchViews.js:1:48)\n';

    await service.record(error, '#/partie');

    expect(store.entries).toEqual([
      {
        at: T0,
        address: '#/partie',
        message: 'TypeError: seat is undefined',
        origin: 'at PlacementBand (matchViews.js:1:48)',
        version: '0.1.0',
      },
    ]);
  });

  it('records plain values and the start address for an empty hash', async () => {
    const store = memoryStore();
    const service = createErrorLogService({
      store,
      clock: clockAt(T0, '2026-11-12T20:01:00.000Z', '2026-11-12T20:02:00.000Z'),
      version: '0.1.0',
    });
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;

    await service.record('plain text', '');
    await service.record({ code: 7 }, '#/');
    await service.record(cyclic, '#/');

    expect(store.entries.map((entry) => entry.message)).toEqual([
      '[object Object]',
      '{"code":7}',
      'plain text',
    ]);
    expect(store.entries[2]?.address).toBe('#/');
    expect(store.entries[2]?.origin).toBeUndefined();
  });

  it('records an error without a stack without origin', async () => {
    const store = memoryStore();
    const service = createErrorLogService({ store, clock: clockAt(T0), version: '0.1.0' });
    const error = new Error('no stack');
    delete error.stack;

    await service.record(error, '#/');

    expect(store.entries[0]?.origin).toBeUndefined();
  });

  it('keeps only the newest entries, newest first', async () => {
    const times = Array.from(
      { length: ERROR_LOG_LIMIT + 2 },
      (_, index) => `2026-11-12T20:0${String(index)}:00.000Z`,
    );
    const store = memoryStore();
    const service = createErrorLogService({ store, clock: clockAt(...times), version: '0.1.0' });

    for (const index of times.keys()) {
      await service.record(new Error(`error ${String(index)}`), '#/');
    }

    expect(store.entries).toHaveLength(ERROR_LOG_LIMIT);
    expect(store.entries[0]?.message).toBe(`Error: error ${String(ERROR_LOG_LIMIT + 1)}`);
  });

  it('does not store the same error twice within a short time', async () => {
    const later = new Date(Date.parse(T0) + ERROR_REPEAT_WINDOW_MS).toISOString();
    const store = memoryStore();
    const service = createErrorLogService({
      store,
      clock: clockAt(T0, T0, later),
      version: '0.1.0',
    });

    await service.record(new Error('twice'), '#/');
    await service.record(new Error('twice'), '#/');
    await service.record(new Error('twice'), '#/');

    expect(store.entries).toHaveLength(2);
  });

  it('cuts long messages', async () => {
    const store = memoryStore();
    const service = createErrorLogService({ store, clock: clockAt(T0), version: '0.1.0' });

    await service.record('x'.repeat(ERROR_MESSAGE_MAX_LENGTH * 2), '#/');

    expect(store.entries[0]?.message).toHaveLength(ERROR_MESSAGE_MAX_LENGTH);
    expect(store.entries[0]?.message.endsWith('…')).toBe(true);
  });

  it('reports a failing store on the console instead of throwing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const service = createErrorLogService({
      store: { update: () => Promise.reject(new Error('quota')) },
      clock: clockAt(T0),
      version: '0.1.0',
    });

    await expect(service.record(new Error('x'), '#/')).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('clears all entries', async () => {
    const store = memoryStore();
    const service = createErrorLogService({ store, clock: clockAt(T0), version: '0.1.0' });
    await service.record(new Error('x'), '#/');

    await service.clear();

    expect(store.entries).toEqual([]);
  });
});
