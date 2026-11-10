/**
 * Where a question about a piece stands (design I2-H, R7): at the bottom, at the top, or on wide
 * screens to the left or right of the board.
 */
export type DialogPlace = 'bottom' | 'top' | 'left' | 'right';

type Size = { readonly width: number; readonly height: number };
type Point = { readonly x: number; readonly y: number };

// The gap between the window and the edge of the screen, as the padding of the backdrop.
const GAP = 16;
// Wider than this and wider than high, the window stands beside the board.
const WIDE = 700;

/**
 * The place where the window covers the fewest marked pieces (design I2-H, R7): on phones and
 * tablets in portrait at the bottom or at the top, on wide screens on the left or right. A tie
 * keeps the bottom or the left. `marks` are the centres of the marked pieces, relative to the
 * screen `frame`.
 */
export function dialogPlace(frame: Size, dialog: Size, marks: readonly Point[]): DialogPlace {
  const isWide = frame.width > WIDE && frame.width > frame.height;
  const across = { from: (frame.width - dialog.width) / 2, to: (frame.width + dialog.width) / 2 };
  const along = {
    from: (frame.height - dialog.height) / 2,
    to: (frame.height + dialog.height) / 2,
  };
  const places: readonly (readonly [DialogPlace, { x: typeof across; y: typeof along }])[] = isWide
    ? [
        ['left', { x: { from: GAP, to: GAP + dialog.width }, y: along }],
        [
          'right',
          { x: { from: frame.width - GAP - dialog.width, to: frame.width - GAP }, y: along },
        ],
      ]
    : [
        [
          'bottom',
          { x: across, y: { from: frame.height - GAP - dialog.height, to: frame.height - GAP } },
        ],
        ['top', { x: across, y: { from: GAP, to: GAP + dialog.height } }],
      ];
  let best: { place: DialogPlace; covered: number } | null = null;
  for (const [place, box] of places) {
    const covered = marks.filter(
      (mark) =>
        mark.x > box.x.from && mark.x < box.x.to && mark.y > box.y.from && mark.y < box.y.to,
    ).length;
    if (best === null || covered < best.covered) {
      best = { place, covered };
    }
  }
  return best?.place ?? 'bottom';
}
