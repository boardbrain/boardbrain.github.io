/** The state of the link of the start to the running score pad. */
export const FROM_START = { fromStart: true } as const;

/** The running score pad was opened from the start, so "Zurück" can simply go back. */
export function isFromStart(state: unknown): boolean {
  return typeof state === 'object' && state !== null && 'fromStart' in state;
}
