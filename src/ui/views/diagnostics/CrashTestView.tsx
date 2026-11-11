/**
 * Only on the dev server, at `#/fehlertest`: throws while drawing, so the error screen (K-5) can be
 * seen on every device without developer tools. The production build does not contain the route.
 */
export function CrashTestView(): React.JSX.Element {
  throw new Error('Test error from #/fehlertest (dev server only)');
}
