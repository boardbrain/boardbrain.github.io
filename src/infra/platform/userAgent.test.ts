import { describe, expect, it } from 'vitest';
import { describeUserAgent } from './userAgent';

const PHONE = { isBrave: false, maxTouchPoints: 5 };
const DESKTOP = { isBrave: false, maxTouchPoints: 0 };

const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 16; SM-S941B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36';
const WINDOWS_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';
const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const IPHONE_INSTALLED =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
const IPAD_DESKTOP_MODE =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15';

describe('K-9 browser and system from the user agent', () => {
  it('recognises Brave on Android by navigator.brave', () => {
    expect(describeUserAgent(ANDROID_CHROME, { ...PHONE, isBrave: true })).toEqual({
      browser: 'Brave 142',
      system: 'Android 16',
    });
  });

  it('recognises Chrome on Windows without a misleading version', () => {
    expect(describeUserAgent(WINDOWS_CHROME, DESKTOP)).toEqual({
      browser: 'Chrome 142',
      system: 'Windows',
    });
  });

  it('recognises Edge before Chrome', () => {
    expect(describeUserAgent(`${WINDOWS_CHROME} Edg/142.0.0.0`, DESKTOP).browser).toBe('Edge 142');
  });

  it('recognises Safari on the iPhone', () => {
    expect(describeUserAgent(IPHONE_SAFARI, PHONE)).toEqual({
      browser: 'Safari 18.1',
      system: 'iOS 18.1',
    });
  });

  it('recognises the installed app on the iPhone as Safari', () => {
    expect(describeUserAgent(IPHONE_INSTALLED, PHONE).browser).toBe('Safari');
  });

  it('recognises an iPad that reports itself as a Mac by its touch points', () => {
    expect(describeUserAgent(IPAD_DESKTOP_MODE, PHONE)).toEqual({
      browser: 'Safari 18.1',
      system: 'iPadOS',
    });
    expect(describeUserAgent(IPAD_DESKTOP_MODE, DESKTOP).system).toBe('macOS');
  });

  it('recognises Firefox on Linux', () => {
    expect(
      describeUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0',
        DESKTOP,
      ),
    ).toEqual({ browser: 'Firefox 140', system: 'Linux' });
  });

  it('leaves unknown values open', () => {
    expect(describeUserAgent('curl/8.0', DESKTOP)).toEqual({
      browser: undefined,
      system: undefined,
    });
  });
});
