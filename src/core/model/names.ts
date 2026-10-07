const COLLATOR = new Intl.Collator('de-DE', { sensitivity: 'base', numeric: true });

/**
 * Stored form of a name: Unicode-normalised and without spaces at the start and end
 * (Specification 3.4).
 */
export function cleanName(name: string): string {
  return name.normalize('NFC').trim();
}

/**
 * True if the name is empty or consists of spaces only (US-PG-01 AK-2).
 */
export function isBlankName(name: string): boolean {
  return cleanName(name) === '';
}

function comparableName(name: string): string {
  return cleanName(name).toLocaleLowerCase('de-DE');
}

/**
 * Compares names ignoring upper and lower case and spaces at the start and end
 * (Specification 3.4, US-PG-01 AK-3, US-SP-02 AK-2).
 */
export function isSameName(a: string, b: string): boolean {
  return comparableName(a) === comparableName(b);
}

/**
 * True if one of the names equals the given name in the sense of `isSameName`.
 */
export function containsName(names: readonly string[], name: string): boolean {
  return names.some((existing) => isSameName(existing, name));
}

/**
 * Returns the items sorted alphabetically by name in German order, ignoring case;
 * numbers in names are sorted by value ("Spiel 2" before "Spiel 10").
 */
export function sortByName<T extends { readonly name: string }>(items: readonly T[]): T[] {
  return items.toSorted((a, b) => COLLATOR.compare(a.name, b.name));
}
