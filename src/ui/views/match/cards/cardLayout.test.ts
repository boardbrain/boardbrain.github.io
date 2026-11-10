import { describe, expect, it } from 'vitest';
import { drawLayout, orderLayout, resourcesLayout, TASK_CARD_WIDTH } from './cardLayout';

// Card tables measured in the reference docs/design/i2d-running-match-final-preview.html.
const PHONE = { width: 356, height: 476 };
const SMALL_PHONE = { width: 326, height: 356 };
const TABLET = { width: 608, height: 638 };
const TABLET_LANDSCAPE = { width: 608, height: 378 };

const rounded = (box: { x: number; y: number; w: number; h: number }): number[] =>
  [box.x, box.y, box.w, box.h].map((value) => Math.round(value));

describe('Design I2-D page 6: order', () => {
  it('PO 09.11.: one card size with 2, 3 or 4 persons, the places centred as in I2-C', () => {
    for (const persons of [2, 3, 4]) {
      const layout = orderLayout(PHONE.width, PHONE.height, persons);
      expect(layout.slots.map((slot) => [Math.round(slot.w), Math.round(slot.h)])).toEqual(
        Array(persons).fill([83, 123]),
      );
      expect(Math.round(layout.slots[0]?.y ?? 0)).toBe(177);
      expect(layout.row(persons).map((card) => Math.round(card.y))).toEqual(
        Array(persons).fill(324),
      );
    }
  });

  it('with four persons the places fill the width with a gap of 8 px', () => {
    const { slots } = orderLayout(PHONE.width, PHONE.height, 4);
    expect(Math.round(slots[0]?.x ?? -1)).toBe(0);
    expect(Math.round((slots[3]?.x ?? 0) + (slots[3]?.w ?? 0))).toBe(PHONE.width);
  });

  it('the cards still to be drawn lie exactly below the places', () => {
    const { slots, row } = orderLayout(PHONE.width, PHONE.height, 3);
    expect(row(3).map((card) => Math.round(card.x))).toEqual(
      slots.map((slot) => Math.round(slot.x)),
    );
  });

  it('on low rooms both rows together are centred', () => {
    expect(
      rounded(defined(orderLayout(SMALL_PHONE.width, SMALL_PHONE.height, 4).slots[0])),
    ).toEqual([0, 60, 76, 112]);
    const landscape = orderLayout(TABLET_LANDSCAPE.width, TABLET_LANDSCAPE.height, 2);
    expect(rounded(defined(landscape.slots[0]))).toEqual([179, 4, 121, 179]);
    expect(Math.round(defined(landscape.row(2)[0]).y)).toBe(195);
  });
});

describe('Design I2-D page 5: draw of a person', () => {
  it('the development card keeps its width of 240 px on a phone', () => {
    const layout = drawLayout(PHONE.width, 560);
    expect(layout.task.width).toBe(TASK_CARD_WIDTH);
    expect(layout.slot.x).toBeCloseTo(layout.task.x + TASK_CARD_WIDTH + 20);
    expect(layout.slot.w).toBeCloseTo((PHONE.width - 30) / 4.4);
  });

  it('design I2-G, G4: on a tablet card and person cards grow by 280 / 240', () => {
    const layout = drawLayout(TABLET.width, TABLET.height);
    expect(layout.task.width).toBe(280);
    expect(layout.slot.w).toBeCloseTo((76 * 280) / 240);
    expect(defined(layout.row(4)[0]).w).toBeCloseTo((76 * 280) / 240);
    expect(layout.slot.x).toBeCloseTo(layout.task.x + 280 + 20);
  });

  it('is scaled down as a whole on low rooms', () => {
    const layout = drawLayout(TABLET_LANDSCAPE.width, TABLET_LANDSCAPE.height);
    expect(layout.task.width).toBeLessThan(TASK_CARD_WIDTH);
    expect(layout.task.width * 1.48 + layout.slot.h + 40).toBeCloseTo(TABLET_LANDSCAPE.height);
  });

  it('PO 09.11.: on tall rooms the cards lie together in the middle', () => {
    const height = 900;
    const layout = drawLayout(TABLET.width, height);
    const row = defined(layout.row(3)[0]);
    const taskHeight = layout.task.width * 1.48;
    expect(row.y - layout.task.y - taskHeight).toBeCloseTo(40);
    expect(layout.task.y).toBeCloseTo(height - row.y - row.h);
  });

  it('the person cards lie in a centred row below, at most 12 px apart', () => {
    const row = drawLayout(PHONE.width, PHONE.height).row(3);
    const first = defined(row[0]);
    const last = defined(row[2]);
    expect(first.x + last.x + last.w).toBeCloseTo(PHONE.width);
    expect(defined(row[1]).x - first.x - first.w).toBeCloseTo(12);
  });
});

// Page 8: the band and its gap lie below the table since the PO's feedback of 09.11.2026.
const BAND = 44 + 12;

describe('Design I2-D page 8: starting resources', () => {
  it('PO 09.11., 10.11.: the places keep one size, at most as wide as in a row of three', () => {
    for (const count of [1, 2, 3]) {
      const { slots } = resourcesLayout(PHONE.width, PHONE.height, count);
      expect(slots.map((slot) => Math.round(slot.w))).toEqual(Array(count).fill(111));
    }
    // On tablets they grow up to 180 px, the cards below up to 96 px.
    const tablet = resourcesLayout(TABLET.width, TABLET.height - BAND, 1);
    expect(Math.round(defined(tablet.slots[0]).w)).toBe(180);
    expect(Math.round(defined(tablet.kinds[0]).w)).toBe(96);
  });

  it('many resources go into two lines where the cards come out larger', () => {
    const phone = resourcesLayout(PHONE.width, PHONE.height - BAND, 5);
    expect(new Set(phone.slots.map((slot) => slot.y)).size).toBe(2);
    expect(Math.round(defined(phone.slots[0]).w)).toBe(78);
    const small = resourcesLayout(SMALL_PHONE.width, SMALL_PHONE.height - BAND, 5);
    expect(new Set(small.slots.map((slot) => slot.y)).size).toBe(1);
    expect(Math.round(defined(small.slots[0]).w)).toBe(56);
  });

  it('PO 09.11.: the five kinds and the stack lie at the bottom, right above the band', () => {
    const layout = resourcesLayout(PHONE.width, PHONE.height, 2);
    const kind = defined(layout.kinds[0]);
    expect(layout.kinds).toHaveLength(5);
    expect(kind.y + kind.h).toBeCloseTo(PHONE.height - 6);
    expect(layout.stack(0).y).toBe(kind.y);
    expect(layout.stack(1).y).toBe(layout.stack(0).y - 2);
  });

  it('the places lie in the middle of the room above the cards', () => {
    const layout = resourcesLayout(TABLET.width, TABLET.height, 2);
    const slot = defined(layout.slots[0]);
    const kind = defined(layout.kinds[0]);
    expect(slot.y - 8).toBeCloseTo(kind.y - 26 - (slot.y + slot.h + 20));
  });
});

function defined<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('missing');
  return value;
}
