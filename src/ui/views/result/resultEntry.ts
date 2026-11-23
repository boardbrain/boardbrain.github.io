import type { PersonId } from '@/core/model';
import {
  bestScorers,
  MAX_SCORE,
  placesOf,
  type ResultInput,
  type ResultRules,
} from '@/core/results';

/**
 * The two ways of entering a result of a game that counts points (design I3-B A2, Catan too since
 * E-49): points for everyone, or "Sieger oder Rangfolge". A custom game without points only has
 * the second.
 */
export type Way = 'points' | 'places';

/**
 * What was entered in one way. Each way keeps its own entries, so switching back loses nothing
 * (Product Owner 17.11.2026); only the visible way is stored.
 */
export type WayEntries = {
  /** Points as typed, also wrong ones. */
  readonly points: Readonly<Record<PersonId, string>>;
  /** Places of the way "Sieger oder Rangfolge"; place 1 are the winners. */
  readonly places: Readonly<Record<PersonId, number>>;
  /** Winners chosen by hand: in Catan without points, or among the best at a tie. */
  readonly winners: readonly PersonId[];
};

/**
 * Entries without anything entered.
 */
export const NO_ENTRIES: WayEntries = { points: {}, places: {}, winners: [] };

/**
 * What is still missing before saving; the form lights it up once (design I3-B E6).
 */
export type Missing = 'points' | 'winner' | 'places' | null;

/**
 * Everything the form shows that follows from the entries.
 */
export type DerivedEntry = {
  /** Valid points of the persons who have them. */
  readonly scores: ReadonlyMap<PersonId, number>;
  /** Persons whose points are no whole number in the allowed range; shown red. */
  readonly badPoints: readonly PersonId[];
  readonly isPointsComplete: boolean;
  /** The persons with the best score once every score is there. */
  readonly best: readonly PersonId[];
  /** Places of everyone: from complete points, or as entered. */
  readonly places: ReadonlyMap<PersonId, number>;
  readonly winners: readonly PersonId[];
  /** Places entered that skip wrongly, e.g. 1, 1, 2 instead of 1, 1, 3. */
  readonly isRankingWrong: boolean;
  readonly missing: Missing;
};

const WHOLE_NUMBER = /^-?\d+$/u;

function parsePoints(text: string, rules: ResultRules): number | null {
  const trimmed = text.trim();
  if (!WHOLE_NUMBER.test(trimmed)) {
    return null;
  }
  const value = Number(trimmed);
  const lowest = rules.allowsNegativeScores ? -MAX_SCORE : 0;
  return value >= lowest && value <= MAX_SCORE ? value : null;
}

function isEntered(text: string | undefined): text is string {
  return text !== undefined && text.trim() !== '';
}

// FA-ER-12: the place of each person is one more than the number of persons ahead (1, 2, 2, 4).
function isRanking(places: readonly number[]): boolean {
  return places.every((place) => place === 1 + places.filter((other) => other < place).length);
}

function deriveFromPoints(
  entries: WayEntries,
  participants: readonly PersonId[],
  rules: ResultRules,
): DerivedEntry {
  const scores = new Map<PersonId, number>();
  const badPoints: PersonId[] = [];
  for (const personId of participants) {
    const text = entries.points[personId];
    if (isEntered(text)) {
      const value = parsePoints(text, rules);
      if (value === null) {
        badPoints.push(personId);
      } else {
        scores.set(personId, value);
      }
    }
  }
  const filled = participants.filter((personId) => isEntered(entries.points[personId])).length;
  const isPointsComplete = filled === participants.length && badPoints.length === 0;
  const scoring = rules.scoring ?? 'highest-wins';
  const best = isPointsComplete
    ? bestScorers(Object.fromEntries(scores), participants, scoring)
    : [];
  let winners: PersonId[];
  if (isPointsComplete) {
    // E-47: the best score wins; only at a tie at the top a choice among the best.
    winners = best.length === 1 ? [...best] : entries.winners.filter((p) => best.includes(p));
  } else {
    // A game without a ranking by hand and without points: the winner is chosen by hand.
    winners = filled === 0 && !rules.supportsRanking ? [...entries.winners] : [];
  }
  const places = isPointsComplete
    ? (placesOf(
        { winnerIds: winners, scores: Object.fromEntries(scores) },
        participants,
        scoring,
      ) ?? new Map<PersonId, number>())
    : new Map<PersonId, number>();
  let missing: Missing = null;
  if (filled > 0 && !isPointsComplete) {
    missing = 'points';
  } else if (filled === 0 && rules.supportsRanking) {
    // A2: in the way of points every score is required; without them "Sieger oder Rangfolge".
    missing = 'points';
  } else if (winners.length === 0 || (rules.hasSingleWinner && winners.length > 1)) {
    missing = 'winner';
  }
  return {
    scores,
    badPoints,
    isPointsComplete,
    best,
    places,
    winners,
    isRankingWrong: false,
    missing,
  };
}

function deriveFromPlaces(entries: WayEntries, participants: readonly PersonId[]): DerivedEntry {
  const places = new Map<PersonId, number>();
  for (const personId of participants) {
    const place = entries.places[personId];
    if (place !== undefined) {
      places.set(personId, place);
    }
  }
  const winners = participants.filter((personId) => places.get(personId) === 1);
  const isWinnersOnly = places.size > 0 && places.size === winners.length;
  const isAllPlaced = places.size === participants.length;
  const isRankingWrong = isAllPlaced && !isRanking([...places.values()]);
  let missing: Missing = null;
  if (winners.length === 0) {
    missing = 'winner';
  } else if (!isWinnersOnly && !isAllPlaced) {
    // M3: the winners alone, or every place.
    missing = 'places';
  }
  return {
    scores: new Map(),
    badPoints: [],
    isPointsComplete: false,
    best: [],
    places,
    winners,
    isRankingWrong,
    missing,
  };
}

/**
 * What follows from the entries of a way (Specification 3.6, design I3-B A2, G3, M3).
 */
export function deriveEntry(
  way: Way,
  entries: WayEntries,
  participants: readonly PersonId[],
  rules: ResultRules,
): DerivedEntry {
  return way === 'points'
    ? deriveFromPoints(entries, participants, rules)
    : deriveFromPlaces(entries, participants);
}

/**
 * Whether the result can be stored: nothing missing, no wrong points, a valid ranking.
 */
export function isEntryComplete(derived: DerivedEntry): boolean {
  return derived.missing === null && derived.badPoints.length === 0 && !derived.isRankingWrong;
}

/**
 * Sets the points of a person. When a tie at the top appears or its persons change, a custom game
 * starts with a draw of all the best, Catan with nobody (US-ER-02 AK-6); a winner chosen at the
 * tie stays while the best stay the same, e.g. when a lower score is corrected.
 */
export function setPoints(
  entries: WayEntries,
  personId: PersonId,
  text: string,
  participants: readonly PersonId[],
  rules: ResultRules,
): WayEntries {
  const next = { ...entries, points: { ...entries.points, [personId]: text } };
  const before = deriveFromPoints(entries, participants, rules);
  const after = deriveFromPoints({ ...next, winners: [] }, participants, rules);
  if (!after.isPointsComplete || after.best.length < 2) {
    return { ...next, winners: rules.supportsRanking ? [] : entries.winners };
  }
  const isSameTie =
    before.isPointsComplete &&
    before.best.length === after.best.length &&
    before.best.every((best) => after.best.includes(best));
  if (isSameTie) {
    return next;
  }
  return { ...next, winners: rules.hasSingleWinner ? [] : [...after.best] };
}

/**
 * Taps the trophy of a person: in Catan the single winner, otherwise one more or one less of a
 * draw.
 */
export function toggleWinner(
  entries: WayEntries,
  personId: PersonId,
  rules: ResultRules,
): WayEntries {
  const isWinner = entries.winners.includes(personId);
  if (rules.hasSingleWinner) {
    return { ...entries, winners: isWinner ? [] : [personId] };
  }
  return {
    ...entries,
    winners: isWinner
      ? entries.winners.filter((winner) => winner !== personId)
      : [...entries.winners, personId],
  };
}

/**
 * Taps a place of a person in "Sieger oder Rangfolge"; tapping the chosen place again removes it.
 * With exactly one winner (Catan, E-42) a new person on place 1 takes it from the previous one.
 */
export function setPlace(
  entries: WayEntries,
  personId: PersonId,
  place: number,
  rules: ResultRules,
): WayEntries {
  const isRemoved = entries.places[personId] === place;
  const isTakenOver = rules.hasSingleWinner && place === 1;
  const places = Object.fromEntries(
    Object.entries(entries.places).filter(
      ([other, value]) => other !== personId && !(isTakenOver && value === 1),
    ),
  );
  return { ...entries, places: isRemoved ? places : { ...places, [personId]: place } };
}

/**
 * Whether a place is impossible for a person because others share the place before it (1, 1, so
 * not 2): shown quietly, without a box (design I3-B).
 */
export function isPlaceSkipped(
  places: ReadonlyMap<PersonId, number>,
  personId: PersonId,
  place: number,
): boolean {
  const others = [...places].filter(([other]) => other !== personId).map(([, value]) => value);
  return others.some(
    (value) => value < place && value + others.filter((other) => other === value).length > place,
  );
}

/**
 * The place a person would have with the points entered so far (design I3-B G3).
 */
export function provisionalPlace(
  derived: DerivedEntry,
  personId: PersonId,
  rules: ResultRules,
): number | null {
  const own = derived.scores.get(personId);
  if (own === undefined) {
    return null;
  }
  const isLowest = rules.scoring === 'lowest-wins';
  const ahead = [...derived.scores].filter(
    ([other, value]) => other !== personId && (isLowest ? value < own : value > own),
  ).length;
  return 1 + ahead;
}

/**
 * The persons of the way of points in the order of their places, those without points last
 * (design I3-B: rows move to their place). `committed` are the points as they were when the
 * field was left, so a row does not jump while typing.
 */
export function rowOrder(
  participants: readonly PersonId[],
  committed: Readonly<Record<PersonId, string>>,
  rules: ResultRules,
): PersonId[] {
  const valueOf = (personId: PersonId): number | null => {
    const text = committed[personId];
    return isEntered(text) ? parsePoints(text, rules) : null;
  };
  const isLowest = rules.scoring === 'lowest-wins';
  const withPoints = participants.filter((personId) => valueOf(personId) !== null);
  const sorted = withPoints.toSorted((a, b) => {
    const difference = (valueOf(a) ?? 0) - (valueOf(b) ?? 0);
    return isLowest ? difference : -difference;
  });
  return [...sorted, ...participants.filter((personId) => valueOf(personId) === null)];
}

/**
 * Winners, points and places as the service stores them (Specification 3.6): points only in the
 * way of points and only if entered, places only for a whole ranking.
 */
export function outcomeOf(
  way: Way,
  derived: DerivedEntry,
  participants: readonly PersonId[],
): Pick<ResultInput, 'winnerIds' | 'scores' | 'places'> {
  if (way === 'points') {
    return {
      winnerIds: [...derived.winners],
      ...(derived.scores.size > 0 ? { scores: Object.fromEntries(derived.scores) } : {}),
    };
  }
  const isRanked =
    derived.places.size === participants.length && derived.places.size > derived.winners.length;
  return {
    winnerIds: [...derived.winners],
    ...(isRanked ? { places: Object.fromEntries(derived.places) } : {}),
  };
}

/**
 * The way and entries a stored result starts with when it is changed (US-ER-05 AK-4): points in
 * the way of points; a ranking, or only the winners, in "Sieger oder Rangfolge"; a game without
 * a ranking by hand keeps its winners in the way of points.
 */
export function entriesOf(
  values: Pick<ResultInput, 'winnerIds' | 'scores' | 'places'>,
  rules: ResultRules,
): { readonly way: Way; readonly entries: WayEntries } {
  const winners = [...values.winnerIds];
  if (values.scores !== undefined) {
    const points = Object.fromEntries(
      Object.entries(values.scores).map(([personId, score]) => [personId, String(score)]),
    );
    return { way: 'points', entries: { points, places: {}, winners } };
  }
  if (!rules.supportsRanking) {
    return { way: 'points', entries: { ...NO_ENTRIES, winners } };
  }
  const places = values.places ?? Object.fromEntries(winners.map((personId) => [personId, 1]));
  return { way: 'places', entries: { points: {}, places, winners: [] } };
}

// Keys sorted at every level, so the same content gives the same text.
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonical);
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .toSorted(([a], [b]) => (a < b ? -1 : 1))
        .map(([key, entry]) => [key, canonical(entry)]),
    );
  }
  return value;
}

/**
 * Whether two results have the same content (US-ER-05 AK-1: without a change no warning), also
 * when points or winners come in another order.
 */
export function isSameInput(a: ResultInput, b: ResultInput): boolean {
  const normal = (input: ResultInput): string =>
    JSON.stringify(canonical({ ...input, winnerIds: input.winnerIds.toSorted() }));
  return normal(a) === normal(b);
}
