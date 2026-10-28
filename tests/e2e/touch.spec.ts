import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

// The value of a CSS property as the browser computes it. The prefixed value comes first: WebKit
// reports user-select without prefix as "auto", but applies the inherited -webkit-user-select.
function computed(locator: Locator, property: string): Promise<string> {
  return locator.evaluate((element, name) => {
    const style = getComputedStyle(element);
    return style.getPropertyValue(`-webkit-${name}`) || style.getPropertyValue(name);
  }, property);
}

// A long press as the browser reports it: first the pointer, then the request for the menu.
// Returns whether the app suppressed the menu.
function longPress(locator: Locator, pointerType: string): Promise<boolean> {
  return locator.evaluate((element, type) => {
    element.dispatchEvent(new PointerEvent('pointerdown', { pointerType: type, bubbles: true }));
    const menu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    element.dispatchEvent(menu);
    return menu.defaultPrevented;
  }, pointerType);
}

function pressValue(locator: Locator): Promise<number> {
  return locator.evaluate((element) =>
    Number(getComputedStyle(element).getPropertyValue('--press') || '0'),
  );
}

async function openPersonsWithAnna(page: Page): Promise<Locator> {
  await page.goto('/#/verwaltung/personen');
  await page.getByLabel('Name').fill('Anna');
  await page.getByRole('button', { name: 'Speichern' }).click();
  const card = page.getByRole('list', { name: 'Alle Personen' }).getByRole('link');
  await expect(card).toHaveCount(1);
  return card;
}

test.describe('K-4 Touch behaviour in the whole app', () => {
  test('no selected text on controls and texts; text fields stay selectable', async ({ page }) => {
    const card = await openPersonsWithAnna(page);
    const back = page.getByRole('button', { name: 'Zurück' });
    const field = page.getByLabel('Name');

    expect(await computed(card, 'user-select')).toBe('none');
    expect(await computed(back, 'user-select')).toBe('none');
    expect(await computed(page.locator('h1').first(), 'user-select')).toBe('none');
    expect(await computed(field, 'user-select')).toBe('text');
  });

  // The callout menu of Safari on iOS (-webkit-touch-callout) is unknown to the desktop WebKit of
  // Playwright; it is checked by hand on the iPad (docs/Abnahme-Checkliste.md).
  test('no blue tap highlight on controls', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'the desktop WebKit of Playwright has no tap highlight');
    const card = await openPersonsWithAnna(page);

    // Fully transparent: the alpha of the colour is 0.
    expect(await computed(card, 'tap-highlight-color')).toMatch(/, 0\)$/);
  });

  test('a long press with a finger opens no browser menu; text fields and the mouse keep it', async ({
    page,
  }) => {
    const card = await openPersonsWithAnna(page);

    expect(await longPress(card, 'touch')).toBe(true);
    expect(await longPress(page.getByRole('button', { name: 'Zurück' }), 'touch')).toBe(true);
    expect(await longPress(page.getByLabel('Name'), 'touch')).toBe(false);
    expect(await longPress(card, 'mouse')).toBe(false);
  });

  test('cards and buttons show their pressed state while held and return afterwards', async ({
    page,
  }) => {
    const card = await openPersonsWithAnna(page);
    const back = page.getByRole('button', { name: 'Zurück' });

    for (const control of [card, back]) {
      const box = await control.boundingBox();
      expect(box).not.toBeNull();
      if (box === null) return;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await expect.poll(() => pressValue(control)).toBe(1);
      // Held and moved away before release, so the press ends without leaving the page. In
      // WebKit a draggable link would swallow the release here.
      await page.mouse.move(0, 0);
      await page.mouse.up();
      await expect.poll(() => pressValue(control)).toBe(0);
    }
  });
});
