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
