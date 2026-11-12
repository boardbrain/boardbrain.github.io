/**
 * Joins the class names that are set; `false` and `undefined` are left out.
 */
export function cx(...names: readonly (string | false | undefined)[]): string {
  return names.filter((name) => typeof name === 'string').join(' ');
}
