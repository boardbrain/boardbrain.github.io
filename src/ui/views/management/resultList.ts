import type { LocalDate, Match, PersonId, ScoringDirection } from '@/core/model';
import { placesOf } from '@/core/results';
import { t } from '@/i18n/t';
import { dayLabel } from '@/ui/views/games/dates';

const MINUTES_PER_HOUR = 60;

/**
 * The results of one day in the list of a table (design I3-C EM3).
 */
export type ResultDay = { readonly date: LocalDate; readonly matches: readonly Match[] };

/**
 * The results of a table by day, newest first (US-ER-04 AK-1, Specification 3.7). `oldestFirst`
 * is the order of `useMatchesOfGroup`, so the list is that order backwards: within a day by time,
 * results without a time above those with one.
 */
export function daysNewestFirst(oldestFirst: readonly Match[]): ResultDay[] {
  const days: { date: LocalDate; matches: Match[] }[] = [];
  for (const match of oldestFirst.toReversed()) {
    const last = days.at(-1);
    if (last?.date === match.date) {
      last.matches.push(match);
    } else {
      days.push({ date: match.date, matches: [match] });
    }
  }
  return days;
}

/**
 * The heading of a day (design I3-C EM3): as in the result form, starting with a capital letter,
 * e.g. "Heute, 17.11." or "Sa, 14.11.".
 */
export function dayHeading(date: LocalDate, today: LocalDate): string {
  const label = dayLabel(date, today);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Names joined as in a sentence: "Ben", "Ben und David", "Anna, Ben und David".
 */
export function namesText(names: readonly string[]): string {
  if (names.length <= 1) {
    return names.join('');
  }
  return `${names.slice(0, -1).join(t('ergebnis.komma'))}${t('ergebnis.und')}${names.at(-1) ?? ''}`;
}

/**
 * Who won (US-ER-04 AK-1): "Clara gewinnt" or "Unentschieden: Ben und David".
 */
export function winnerText(names: readonly string[]): string {
  return names.length > 1
    ? t('ergebnis.unentschieden', { namen: namesText(names) })
    : t('ergebnis.gewinnt', { name: names[0] ?? '' });
}

/**
 * A duration as on the detail page: "1 h 23 min" or "45 min".
 */
export function durationText(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;
  return hours === 0
    ? t('ergebnisse.dauerMinuten', { minuten: rest })
    : t('ergebnisse.dauer', { stunden: hours, minuten: rest });
}

/**
 * The note beside "Ergebnis" on the detail page: what the places come from, or `null`.
 */
export function scoreNote(
  match: Pick<Match, 'scores' | 'places'>,
  isCatan: boolean,
  scoring: ScoringDirection | null,
): string | null {
  if (match.scores !== undefined) {
    if (isCatan) {
      return t('ergebnisse.hinweisSiegpunkte');
    }
    return scoring === 'lowest-wins'
      ? t('ergebnisse.hinweisWenigste')
      : t('ergebnisse.hinweisPunkte');
  }
  return match.places === undefined ? null : t('ergebnisse.hinweisRangfolge');
}

/**
 * A person on the detail page: place from points or the ranking, or `null` without places.
 */
export type DetailRow = {
  readonly personId: PersonId;
  readonly place: number | null;
  readonly isWinner: boolean;
};

/**
 * The persons of a result in the order of their places (US-ER-02 AK-5, US-ER-06 AK-5), in seat
 * order at the same place; without places the winners first.
 */
export function detailRows(
  match: Pick<Match, 'winnerIds' | 'scores' | 'places'>,
  participants: readonly PersonId[],
  scoring: ScoringDirection | null,
): DetailRow[] {
  const places = placesOf(match, participants, scoring);
  const isWinner = (personId: PersonId): boolean => match.winnerIds.includes(personId);
  if (places === null) {
    return [
      ...participants.filter(isWinner),
      ...participants.filter((personId) => !isWinner(personId)),
    ].map((personId) => ({ personId, place: null, isWinner: isWinner(personId) }));
  }
  return participants
    .map((personId, seat) => ({ personId, seat, place: places.get(personId) ?? 0 }))
    .toSorted((a, b) => a.place - b.place || a.seat - b.seat)
    .map(({ personId, place }) => ({ personId, place, isWinner: isWinner(personId) }));
}
