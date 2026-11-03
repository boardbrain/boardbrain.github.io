import type { CatanResource } from '@/games/catan';
import {
  BrickSymbol,
  GrainSymbol,
  OreSymbol,
  WoodSymbol,
  WoolSymbol,
} from '@/ui/art/ResourceSymbols';
import styles from './ResourceIcon.module.css';

function ResourceSymbol({ resource }: { resource: CatanResource }): React.JSX.Element {
  const props = { className: styles.symbol };
  switch (resource) {
    case 'lumber':
      return <WoodSymbol {...props} />;
    case 'brick':
      return <BrickSymbol {...props} />;
    case 'wool':
      return <WoolSymbol {...props} />;
    case 'grain':
      return <GrainSymbol {...props} />;
    case 'ore':
      return <OreSymbol {...props} />;
  }
}

/**
 * A resource as its symbol on a disc in its colour (US-SR-01 AK-5). Decorative: the name
 * stands beside it.
 */
export function ResourceIcon({
  resource,
  size,
}: {
  readonly resource: CatanResource;
  readonly size: number;
}): React.JSX.Element {
  return (
    <span
      className={styles.icon}
      style={{ background: `var(--color-resource-${resource})`, width: size, height: size }}
      aria-hidden="true"
    >
      <ResourceSymbol resource={resource} />
    </span>
  );
}
