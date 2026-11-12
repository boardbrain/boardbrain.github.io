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

// Design I2-G, G4: on a card table of a tablet the development card grows up to 280 px, the person
// cards beside and below it by the same factor; phones keep the sizes of I2-D.
const WIDE_TABLE = 560;
const WIDE_TASK_CARD_WIDTH = 280;
const PERSON_CARD_WIDTH = 76;

/** Cards are 1.48 times as high as wide; resource cards 1.5 times. */
const CARD_RATIO = 1.48;
const RESOURCE_RATIO = 1.5;
const RESOURCE_KINDS = 5;
const MOST_KIND_WIDTH = 96;
const MOST_PLACE_WIDTH = 180;

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
 * Layout of page 5 for a card table of `width` × `height`. Development card and person cards
 * lie together in the middle of the table (PO 09.11.2026: on tall tablets they sat far up), with
 * a gap between them of 16 to 40 px. On tablets both are larger (design I2-G, G4).
 */
export function drawLayout(width: number, height: number): DrawLayout {
  const isWide = width >= WIDE_TABLE;
  const most = isWide ? WIDE_TASK_CARD_WIDTH : TASK_CARD_WIDTH;
  const w = isWide
    ? Math.min(
        (PERSON_CARD_WIDTH * most) / TASK_CARD_WIDTH,
        (width - 30) / 4.4,
        (height - 60) / CARD_RATIO / 3.2,
      )
    : Math.min(PERSON_CARD_WIDTH, (width - 30) / 4.4);
  const h = w * CARD_RATIO;
  const taskWidth = Math.min(most, width - w - 30, (height - h - 40) / CARD_RATIO);
  const taskHeight = taskWidth * CARD_RATIO;
  const x0 = (width - (taskWidth + 20 + w)) / 2;
  const rest = height - taskHeight - h;
  const gap = Math.min(40, Math.max(16, rest / 3));
  const top = Math.max(6, (rest - gap) / 2);
  const y = top + taskHeight + gap;
  return {
    task: { x: x0, y: top, width: taskWidth },
    slot: { x: x0 + taskWidth + 20, y: top + (taskHeight - h) / 2, w, h },
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
 * Layout of page 6 for `persons` persons (decision of the product owner 09.11.2026): the places
 * have one size for the whole page, the same with 2, 3 or 4 persons, as wide as in a row of four
 * (narrower only with more persons) and low enough that the places and the cards still to be
 * drawn fit one above the other. The cards below, the stack among them, are at most as wide as
 * the stack of the starting resources (PO 12.11.2026: on a tablet in portrait they only grow
 * large on the places); on phones both have one size. The row of places stays centred where the
 * room allows it (as the order row of I2-C); otherwise both rows together are centred.
 */
export function orderLayout(width: number, height: number, persons: number): OrderLayout {
  const gap = 8;
  const rowGap = 12;
  // In height, places and cards below share the room; once the cards below stop growing, the
  // places take the rest.
  const tall = (height - rowGap - 8) / CARD_RATIO;
  const w = Math.min(
    (width - 3 * gap) / 4,
    (width - (persons - 1) * gap) / persons,
    tall / 2 <= MOST_KIND_WIDTH ? tall / 2 : tall - MOST_KIND_WIDTH,
  );
  const h = w * CARD_RATIO;
  const rw = Math.min(w, MOST_KIND_WIDTH);
  const rh = rw * CARD_RATIO;
  const centred = (height - h) / 2;
  const y = centred - rowGap - 4 >= rh ? centred : (height - (h + rh + rowGap)) / 2;
  const x0 = (width - (persons * w + (persons - 1) * gap)) / 2;
  const below = rowBelow(y + h + rowGap, height, rh);
  return {
    slots: Array.from({ length: persons }, (_, index) => ({ x: x0 + index * (w + gap), y, w, h })),
    row: (count) => rowXs(width, rw, count, gap).map((x) => ({ x, y: below, w: rw, h: rh })),
  };
}

/**
 * Page 8, the starting resources of a person: places, their names and the cards. The band
 * "Name · n Rohstoffe" lies below the table, where the band of the placement lies.
 */
export type ResourcesLayout = {
  readonly slots: CardBox[];
  /** The five kinds in a row before the first draw. */
  readonly kinds: CardBox[];
  /** Card `index` of the stack, from the bottom; the stack is a little higher with each card. */
  readonly stack: (index: number) => CardBox;
};

/**
 * Layout of page 8 for `count` starting resources (decisions of the product owner 09.11.2026):
 * the places keep one size, at most as wide as in a row of three; many resources go into two
 * lines instead of shrinking into one, where the cards come out larger that way. The stack or
 * the five kinds lie at the bottom, right above the band; the places in the middle of the room
 * above them.
 */
export function resourcesLayout(width: number, height: number, count: number): ResourcesLayout {
  const name = 20;
  const gap = 12;
  const line = 8;
  const top = 8;
  // Room between the names and the stack, and below the stack for its shadow; the stack grows
  // upwards by 2 px per card.
  const between = 26;
  const bottom = 6;
  // On low tablets in landscape the cards below take at most 40 % of the free height, so the
  // places keep a usable size. On phones they are as wide as the five kinds allow; on tablets
  // they grow up to 96 px and the places up to 180 px (PO 10.11.2026: it looked small).
  const free = height - (top + between + bottom);
  const rw = Math.min(
    MOST_KIND_WIDTH,
    (width - 4 * 8) / RESOURCE_KINDS,
    (free * 0.4) / RESOURCE_RATIO,
  );
  const rh = rw * RESOURCE_RATIO;
  const room = height - (top + between + rh + bottom);
  const most = Math.min(MOST_PLACE_WIDTH, (width - 2 * gap) / 3);
  const perRow = (rows: number): number => Math.ceil(count / rows);
  const sizeFor = (rows: number): number =>
    Math.min(
      most,
      (width - (perRow(rows) - 1) * gap) / perRow(rows),
      ((room + line) / rows - name - line) / RESOURCE_RATIO,
    );
  const rows = count > 3 && sizeFor(2) > sizeFor(1) ? 2 : 1;
  const sw = sizeFor(rows);
  const sh = sw * RESOURCE_RATIO;
  const per = perRow(rows);
  const block = rows * (sh + name) + (rows - 1) * line;
  const first = top + Math.max(0, (room - block) / 2);
  const slots = Array.from({ length: count }, (_, index) => {
    const at = Math.floor(index / per);
    const inLine = Math.min(per, count - at * per);
    const total = inLine * sw + (inLine - 1) * gap;
    return {
      x: (width - total) / 2 + (index - at * per) * (sw + gap),
      y: first + at * (sh + name + line),
      w: sw,
      h: sh,
    };
  });
  const y = height - bottom - rh;
  const kindGap = (width - RESOURCE_KINDS * rw) / (RESOURCE_KINDS + 1);
  return {
    slots,
    kinds: Array.from({ length: RESOURCE_KINDS }, (_, index) => ({
      x: kindGap + index * (rw + kindGap),
      y,
      w: rw,
      h: rh,
    })),
    stack: (index) => ({ x: (width - rw) / 2, y: y - index * 2, w: rw, h: rh }),
  };
}
