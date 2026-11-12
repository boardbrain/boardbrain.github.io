import type { CatanResource } from '@/games/catan';

// The large pictures of a match are generated images (Architecture ADR-030): `npm run art` draws
// them from the SVG sources in scripts/art with the colours of tokens.css.
const PICTURES = `${import.meta.env.BASE_URL}art/`;
const WIDTH = 1200;

const RESOURCE_CARDS: Readonly<Record<CatanResource, string>> = {
  lumber: 'card-wood',
  brick: 'card-brick',
  wool: 'card-wool',
  grain: 'card-grain',
  ore: 'card-ore',
};

type PictureProps = {
  readonly className?: string | undefined;
};

/**
 * The picture of a resource card S4 (design I2-C, page 8). Decorative: the name stands below.
 */
export function ResourceCardPicture({
  resource,
  className,
}: PictureProps & { readonly resource: CatanResource }): React.JSX.Element {
  return (
    <img
      src={`${PICTURES}${RESOURCE_CARDS[resource]}.webp`}
      alt=""
      width={WIDTH}
      height={1800}
      draggable={false}
      className={className}
    />
  );
}

/**
 * The landscape of the Catan card (design I2-C, page 1, K2). Decorative: the card has its name.
 */
export function LandscapePicture({ className }: PictureProps): React.JSX.Element {
  return (
    <img
      src={`${PICTURES}landscape.webp`}
      alt=""
      width={WIDTH}
      height={1320}
      draggable={false}
      className={className}
    />
  );
}
