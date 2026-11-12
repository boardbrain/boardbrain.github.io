/**
 * Browser and operating system as the diagnostics name them (K-9), e.g. "Brave 142" and
 * "Android 16". `undefined` where the user agent does not tell.
 */
export type BrowserDescription = {
  readonly browser: string | undefined;
  readonly system: string | undefined;
};

/** What the description reads besides the user agent string. */
export type BrowserHints = {
  /** Brave reports itself as Chrome; only `navigator.brave` gives it away. */
  readonly isBrave: boolean;
  /** iPadOS reports itself as macOS; only the touch points give it away. */
  readonly maxTouchPoints: number;
};

function version(userAgent: string, pattern: RegExp): string | undefined {
  return pattern.exec(userAgent)?.[1]?.replaceAll('_', '.');
}

function named(name: string, versionText: string | undefined): string {
  return versionText === undefined ? name : `${name} ${versionText}`;
}

function describeSystem(userAgent: string, hints: BrowserHints): string | undefined {
  if (userAgent.includes('iPad') || (userAgent.includes('Macintosh') && hints.maxTouchPoints > 1)) {
    // Since iPadOS 13 the iPad shows the version of Safari only, not of the system.
    return named('iPadOS', version(userAgent, /CPU OS (\d+(?:_\d+)?)/));
  }
  if (/iPhone|iPod/.test(userAgent)) {
    return named('iOS', version(userAgent, /OS (\d+(?:_\d+)?)/));
  }
  if (userAgent.includes('Android')) {
    return named('Android', version(userAgent, /Android (\d+(?:\.\d+)?)/));
  }
  if (userAgent.includes('Windows')) {
    // Windows 11 still reports "Windows NT 10.0", so the number would mislead.
    return 'Windows';
  }
  if (/Mac OS X|Macintosh/.test(userAgent)) {
    return 'macOS';
  }
  if (userAgent.includes('Linux')) {
    return 'Linux';
  }
  return undefined;
}

function describeBrowser(userAgent: string, hints: BrowserHints): string | undefined {
  const chromium = version(userAgent, /(?:Chrome|CriOS)\/(\d+)/);
  if (hints.isBrave) {
    return named('Brave', chromium);
  }
  const candidates: readonly (readonly [string, RegExp])[] = [
    ['Samsung Internet', /SamsungBrowser\/(\d+)/],
    ['Edge', /(?:Edg|EdgiOS|EdgA)\/(\d+)/],
    ['Opera', /OPR\/(\d+)/],
    ['Firefox', /(?:Firefox|FxiOS)\/(\d+)/],
    ['Chrome', /(?:Chrome|CriOS)\/(\d+)/],
    ['Safari', /Version\/(\d+(?:\.\d+)?).*Safari/],
  ];
  for (const [name, pattern] of candidates) {
    if (pattern.test(userAgent)) {
      return named(name, version(userAgent, pattern));
    }
  }
  // An installed web app on iOS has no "Safari" in its user agent, but it runs on WebKit.
  return userAgent.includes('AppleWebKit') && /iPhone|iPad|Macintosh/.test(userAgent)
    ? 'Safari'
    : undefined;
}

/**
 * Reads browser and operating system from the user agent (K-9). The result only helps to
 * understand a report; the app never behaves differently because of it (NFA-PL-02).
 */
export function describeUserAgent(userAgent: string, hints: BrowserHints): BrowserDescription {
  return {
    browser: describeBrowser(userAgent, hints),
    system: describeSystem(userAgent, hints),
  };
}
