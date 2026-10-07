import { de, type TextTree } from './de';

type LeafPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${LeafPaths<T[K]>}`;
}[keyof T & string];

/**
 * Valid text key; a typo is a compile error (Architecture 13.3).
 */
export type TextKey = LeafPaths<typeof de>;

/**
 * Values for placeholders such as `{version}`.
 */
export type TextParams = Readonly<Record<string, string | number>>;

const PLACEHOLDER = /\{(\w+)\}/g;

function lookup(tree: TextTree, key: string): string {
  let node: string | TextTree = tree;
  for (const part of key.split('.')) {
    if (typeof node === 'string') {
      throw new Error(`Text key too long: ${key}`);
    }
    const next: string | TextTree | undefined = node[part];
    if (next === undefined) {
      throw new Error(`Text key missing: ${key}`);
    }
    node = next;
  }
  if (typeof node !== 'string') {
    throw new Error(`Text key is an area, not a text: ${key}`);
  }
  return node;
}

/**
 * Returns the German text for the key and fills in placeholders (NFA-I18N-01).
 * A placeholder without a value stays visible so the mistake is noticed.
 */
export function t(key: TextKey, params: TextParams = {}): string {
  return lookup(de, key).replace(PLACEHOLDER, (placeholder, name: string) => {
    const value = params[name];
    return value === undefined ? placeholder : String(value);
  });
}
