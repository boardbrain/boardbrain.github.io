const DATE_FORMAT = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/**
 * Formats a stored UTC timestamp as a German date in the local time zone, e.g. `04.08.2026`
 * (NFA-I18N-01).
 */
export function formatDate(timestamp: string): string {
  return DATE_FORMAT.format(new Date(timestamp));
}

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Formats a stored UTC timestamp as a German date with time in the local time zone, e.g.
 * `12.11.2026, 21:07` (NFA-I18N-01).
 */
export function formatDateTime(timestamp: string): string {
  return DATE_TIME_FORMAT.format(new Date(timestamp));
}

const NUMBER_FORMAT = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });

/**
 * Formats a number the German way with at most one decimal, e.g. `60.000` or `2,6`
 * (NFA-I18N-01).
 */
export function formatNumber(value: number): string {
  return NUMBER_FORMAT.format(value);
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
const BYTES_PER_UNIT = 1000;

/**
 * Formats a storage size with a decimal unit, e.g. `2,1 MB` (NFA-I18N-01).
 */
export function formatBytes(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= BYTES_PER_UNIT && unit < BYTE_UNITS.length - 1) {
    value /= BYTES_PER_UNIT;
    unit += 1;
  }
  return `${formatNumber(value)} ${BYTE_UNITS[unit] ?? 'B'}`;
}
