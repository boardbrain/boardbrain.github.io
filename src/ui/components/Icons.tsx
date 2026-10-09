import type { ReactNode } from 'react';

type IconProps = {
  readonly size?: number | undefined;
};

const ICON_SIZE = 20;

/**
 * Magnifying glass. Decorative: the button around it carries the label.
 */
export function SearchIcon({ size = ICON_SIZE }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}

/**
 * Arrow to the left. Decorative: the button around it carries the label.
 */
export function BackIcon({ size = ICON_SIZE }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

/**
 * Cross. Decorative: the button around it carries the label.
 */
export function CloseIcon({ size = ICON_SIZE }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

type OutlineProps = IconProps & {
  readonly children: ReactNode;
};

// Shared frame of the outline icons for the card hand and the playing cards.
function Outline({ size = ICON_SIZE, children }: OutlineProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/**
 * House for the start view. Decorative: the link around it carries the label.
 */
export function HomeIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
    </Outline>
  );
}

/**
 * Folder for the management area. Decorative.
 */
export function FolderIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </Outline>
  );
}

/**
 * Two persons. Decorative.
 */
export function PeopleIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7.5M22 21v-1a6 6 0 0 0-4-5.6" />
    </Outline>
  );
}

/**
 * Round table with four seats. Decorative.
 */
export function TableIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM12 22.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM3 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
    </Outline>
  );
}

/**
 * Die with five pips. Decorative.
 */
export function DiceIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01" />
    </Outline>
  );
}

/**
 * Phone with a turning arrow for the hint to hold the phone upright. Decorative.
 */
export function RotateIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M6 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 18h1M18.5 7.5a7 7 0 0 1 0 9M16.8 15.2l1.7 1.3 1.3-1.8" />
    </Outline>
  );
}
