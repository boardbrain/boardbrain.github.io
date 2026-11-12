import { useId } from 'react';

/**
 * Props of an illustration. Decorative: the element around it carries the meaning.
 */
export type ArtProps = {
  readonly className?: string | undefined;
};

/**
 * Prefix for the ids of gradients, filters and clip paths of one picture, so pictures shown
 * together do not take each other's definitions.
 */
export function useArtId(): string {
  return useId().replace(/[^a-zA-Z0-9_-]/g, '');
}
