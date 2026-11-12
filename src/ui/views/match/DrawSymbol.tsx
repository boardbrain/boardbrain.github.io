import type { CatanPersonDraw } from '@/games/catan';
import { HarborsOptionIcon, LandscapesOptionIcon, NumbersOptionIcon } from '@/ui/art/OptionIcons';

/**
 * Symbol of a draw of a person in the options and the overview (design I2-C, O1).
 * Decorative: the text beside it names the draw.
 */
export function DrawSymbol({ draw }: { readonly draw: CatanPersonDraw }): React.JSX.Element {
  switch (draw) {
    case 'landscapes':
      return <LandscapesOptionIcon />;
    case 'harbors':
      return <HarborsOptionIcon />;
    case 'numbers':
      return <NumbersOptionIcon />;
  }
}
