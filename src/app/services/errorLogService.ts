import type { Clock, ErrorLogEntry, ErrorLogStore } from '@/app/ports';

/** K-9: the diagnostics keep the most recent unexpected errors, the newest first. */
export const ERROR_LOG_LIMIT = 5;

/** Longest stored error text; longer texts are cut so a runaway message cannot fill the store. */
export const ERROR_MESSAGE_MAX_LENGTH = 300;

/**
 * The same error reported again within this time is not stored twice, e.g. by both the error
 * view and the global handler, or by React's double effects in development.
 */
export const ERROR_REPEAT_WINDOW_MS = 2000;

/**
 * Records unexpected errors for the diagnostics (K-9).
 */
export type ErrorLogService = {
  /**
   * Stores the error with time, address and version. Never throws: a failure is reported on
   * the console only, because it happens while another error is already being shown.
   */
  record(error: unknown, address: string): Promise<void>;
  /** Removes all stored errors. */
  clear(): Promise<void>;
};

type ErrorLogServiceDependencies = {
  readonly store: ErrorLogStore;
  readonly clock: Clock;
  readonly version: string;
};

function cut(text: string): string {
  return text.length > ERROR_MESSAGE_MAX_LENGTH
    ? `${text.slice(0, ERROR_MESSAGE_MAX_LENGTH - 1)}…`
    : text;
}

function messageOf(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error !== 'object' || error === null) {
    return String(error);
  }
  try {
    return JSON.stringify(error);
  } catch {
    // A value JSON cannot encode, e.g. with cycles; its type still says something.
    return Object.prototype.toString.call(error);
  }
}

/** First stack line that is not the message itself, e.g. `at PlacementBand (…)`. */
function originOf(error: unknown): string | undefined {
  if (!(error instanceof Error) || error.stack === undefined) {
    return undefined;
  }
  const heading = `${error.name}: ${error.message}`;
  return error.stack
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line !== '' && line !== heading && !line.startsWith(`${error.name}:`));
}

function isRepeat(entry: ErrorLogEntry, latest: ErrorLogEntry | undefined): boolean {
  if (latest === undefined) {
    return false;
  }
  const elapsed = Date.parse(entry.at) - Date.parse(latest.at);
  return (
    latest.message === entry.message &&
    latest.address === entry.address &&
    elapsed >= 0 &&
    elapsed < ERROR_REPEAT_WINDOW_MS
  );
}

/**
 * Creates the error log service (K-9). It keeps the newest `ERROR_LOG_LIMIT` errors; error texts
 * stay on the device (NFA-DH-01) and leave it only when someone shares the diagnostics report.
 */
export function createErrorLogService({
  store,
  clock,
  version,
}: ErrorLogServiceDependencies): ErrorLogService {
  return {
    record: async (error, address) => {
      const origin = originOf(error);
      const entry: ErrorLogEntry = {
        at: clock.now(),
        address: address === '' ? '#/' : address,
        message: cut(messageOf(error)),
        ...(origin === undefined ? {} : { origin: cut(origin) }),
        version,
      };
      try {
        await store.update((entries) =>
          isRepeat(entry, entries[0]) ? entries : [entry, ...entries].slice(0, ERROR_LOG_LIMIT),
        );
      } catch (storeError: unknown) {
        console.warn('Recording an error for the diagnostics failed', storeError);
      }
    },
    clear: () => store.update(() => []),
  };
}
