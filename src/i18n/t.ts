import { de, type TextTree } from './de';

type LeafPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${LeafPaths<T[K]>}`;
}[keyof T & string];

/**
 * Gültiger Textschlüssel; ein Tippfehler ist ein Compilerfehler (Architektur 13.3).
 */
export type TextKey = LeafPaths<typeof de>;

/**
 * Werte für Platzhalter wie `{version}`.
 */
export type TextParams = Readonly<Record<string, string | number>>;

const PLACEHOLDER = /\{(\w+)\}/g;

function lookup(tree: TextTree, key: string): string {
  let node: string | TextTree = tree;
  for (const part of key.split('.')) {
    if (typeof node === 'string') {
      throw new Error(`Textschlüssel zu lang: ${key}`);
    }
    const next: string | TextTree | undefined = node[part];
    if (next === undefined) {
      throw new Error(`Textschlüssel fehlt: ${key}`);
    }
    node = next;
  }
  if (typeof node !== 'string') {
    throw new Error(`Textschlüssel ist ein Bereich, kein Text: ${key}`);
  }
  return node;
}

/**
 * Liefert den deutschen Text zum Schlüssel und setzt Platzhalter ein (NFA-I18N-01).
 * Ein Platzhalter ohne Wert bleibt sichtbar stehen, damit der Fehler auffällt.
 */
export function t(key: TextKey, params: TextParams = {}): string {
  return lookup(de, key).replace(PLACEHOLDER, (placeholder, name: string) => {
    const value = params[name];
    return value === undefined ? placeholder : String(value);
  });
}
