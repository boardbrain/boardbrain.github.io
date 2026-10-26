import { t } from './t';

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

/**
 * Names in German quotation marks as a list: „A“, „A“ und „B“, „A“, „B“ und „C“
 * (design I1-F, messages that name tables).
 */
export function formatQuotedList(names: readonly string[]): string {
  const quoted = names.map((name) => t('allgemein.zitat', { name }));
  const last = quoted.at(-1);
  if (last === undefined || quoted.length === 1) {
    return last ?? '';
  }
  return t('allgemein.liste', { vorne: quoted.slice(0, -1).join(', '), letzter: last });
}
