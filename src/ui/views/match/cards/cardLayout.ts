// Geometry of the card scenes (design I2-D, pages 5, 6 and 8): the positions of the reference,
// computed from the room of the card table. All values in CSS pixels, top left of each card.

/**
 * Place and size of a card.
 */
export type CardBox = {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
};

/** Width of the development card in the flow (design I2-C), scaled as a whole where needed. */
export const TASK_CARD_WIDTH = 240;

/** Cards are 1.48 times as high as wide; resource cards 1.5 times. */
const CARD_RATIO = 1.48;
const RESOURCE_RATIO = 1.5;
const RESOURCE_KINDS = 5;

// A row of `count` cards of width `width`, centred; the gap is at most `maxGap`.
function rowXs(roomWidth: number, width: number, count: number, maxGap: number): number[] {
  const gap = Math.min(maxGap, (roomWidth - count * width) / Math.max(1, count - 1));
  const total = count * width + (count - 1) * gap;
  return Array.from(
    { length: count },
    (_, index) => (roomWidth - total) / 2 + index * (width + gap),
  );
}

// The cards still to be drawn lie in a row in the room below, a little above its middle.
function rowBelow(zoneTop: number, roomHeight: number, height: number): number {
  return zoneTop + Math.max(0, (roomHeight - zoneTop - height) / 2 - 8);
}

/**
 * Page 5, a draw of a person: the development card, beside it the place for the drawn person,
 * below the person cards.
 */
export type DrawLayout = {
  /** Top left and width of the development card; its scale is `width / TASK_CARD_WIDTH`. */
  readonly task: { readonly x: number; readonly y: number; readonly width: number };
  readonly slot: CardBox;
  /** The person cards below, `count` of them. */
  readonly row: (count: number) => CardBox[];
};

/**
 * Layout of page 5 for a card table of `width` × `height`.
 */
export function drawLayout(width: number, height: number): DrawLayout {
  const w = Math.min(76, (width - 30) / 4.4);
  const h = w * CARD_RATIO;
  const taskWidth = Math.min(TASK_CARD_WIDTH, width - w - 30, (height - h - 40) / CARD_RATIO);
  const taskHeight = taskWidth * CARD_RATIO;
  const x0 = (width - (taskWidth + 20 + w)) / 2;
  const zoneTop = 6 + taskHeight + 16;
  const y = rowBelow(zoneTop, height, h);
  return {
    task: { x: x0, y: 6, width: taskWidth },
    slot: { x: x0 + taskWidth + 20, y: 6 + (taskHeight - h) / 2, w, h },
    row: (count) => rowXs(width, w, count, 12).map((x) => ({ x, y, w, h })),
  };
}

/**
 * Page 6, the order: the places in a row, below the person cards still to be drawn.
 */
export type OrderLayout = {
  readonly slots: CardBox[];
  readonly row: (count: number) => CardBox[];
};

/**
 * Layout of page 6 for `persons` persons (decision of the product owner 09.11.2026): one card
 * size for the whole page, the same with 2, 3 or 4 persons, as wide as in a row of four
 * (narrower only with more persons) and low enough that the places and the cards still to be
 * drawn fit one above the other. The row of places stays centred where the room allows it (as
 * the order row of I2-C); otherwise both rows together are centred.
 */
export function orderLayout(width: number, height: number, persons: number): OrderLayout {
  const gap = 8;
  const rowGap = 12;
  const w = Math.min(
    (width - 3 * gap) / 4,
    (width - (persons - 1) * gap) / persons,
    (height - rowGap - 8) / 2 / CARD_RATIO,
  );
  const h = w * CARD_RATIO;
  const centred = (height - h) / 2;
  const y = centred - rowGap - 4 >= h ? centred : (height - (2 * h + rowGap)) / 2;
  const x0 = (width - (persons * w + (persons - 1) * gap)) / 2;
  const below = rowBelow(y + h + rowGap, height, h);
  return {
    slots: Array.from({ length: persons }, (_, index) => ({ x: x0 + index * (w + gap), y, w, h })),
    row: (count) => rowXs(width, w, count, gap).map((x) => ({ x, y: below, w, h })),
  };
}

/**
 * Page 8, the starting resources of a person: places, their names, the band and the cards.
 */
export type ResourcesLayout = {
  readonly slots: CardBox[];
  /** Top of the band "Name · n Rohstoffe". */
  readonly bandY: number;
  /** The five kinds in a row before the first draw. */
  readonly kinds: CardBox[];
  /** Card `index` of the stack, from the bottom; the stack is a little higher with each card. */
  readonly stack: (index: number) => CardBox;
};

/**
 * Layout of page 8 for `count` starting resources (decision of the product owner 09.11.2026):
 * the places keep one size, at most as wide as in a row of three; many resources go into two
 * lines instead of shrinking into one, where the cards come out larger that way.
 */
export function resourcesLayout(width: number, height: number, count: number): ResourcesLayout {
  const rw = Math.min(64, (width - 4 * 8) / RESOURCE_KINDS);
  const rh = rw * RESOURCE_RATIO;
  const band = 44;
  const name = 20;
  const gap = 12;
  const line = 8;
  const fixed = 8 + 14 + band + 18 + rh + 8;
  const most = Math.min(120, (width - 2 * gap) / 3);
  const perRow = (rows: number): number => Math.ceil(count / rows);
  const sizeFor = (rows: number): number =>
    Math.min(
      most,
      (width - (perRow(rows) - 1) * gap) / perRow(rows),
      ((height - fixed + line) / rows - name - line) / RESOURCE_RATIO,
    );
  const rows = count > 3 && sizeFor(2) > sizeFor(1) ? 2 : 1;
  const sw = sizeFor(rows);
  const sh = sw * RESOURCE_RATIO;
  const per = perRow(rows);
  const slots = Array.from({ length: count }, (_, index) => {
    const at = Math.floor(index / per);
    const inLine = Math.min(per, count - at * per);
    const total = inLine * sw + (inLine - 1) * gap;
    return {
      x: (width - total) / 2 + (index - at * per) * (sw + gap),
      y: 8 + at * (sh + name + line),
      w: sw,
      h: sh,
    };
  });
  const bandY = 8 + rows * (sh + name) + (rows - 1) * line + 14;
  const y = bandY + band + Math.max(18, (height - bandY - band - rh) / 2);
  const kindGap = (width - RESOURCE_KINDS * rw) / (RESOURCE_KINDS + 1);
  return {
    slots,
    bandY,
    kinds: Array.from({ length: RESOURCE_KINDS }, (_, index) => ({
      x: kindGap + index * (rw + kindGap),
      y,
      w: rw,
      h: rh,
    })),
    stack: (index) => ({ x: (width - rw) / 2, y: y - index * 2, w: rw, h: rh }),
  };
}
