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

/**
 * Arrow to the right at the end of a row that opens a page. Decorative.
 */
export function ChevronIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M9 5l7 7-7 7" />
    </Outline>
  );
}

/**
 * Plus for "new". Decorative: the button around it carries the label.
 */
export function PlusIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M12 5v14M5 12h14" />
    </Outline>
  );
}

/**
 * Bar chart for the statistics (design I3-C). Decorative.
 */
export function ChartIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </Outline>
  );
}

/**
 * Pen for "rename" and "edit". Decorative: the button around it carries the label.
 */
export function PenIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" />
    </Outline>
  );
}

/**
 * Triangle for "start". Decorative: the button around it carries the label.
 */
export function PlayIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M7 4l13 8-13 8z" />
    </Outline>
  );
}

/**
 * Circular arrow for "repeat". Decorative: the button around it carries the label.
 */
export function AgainIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />
    </Outline>
  );
}

/**
 * Two triangles and a bar for "Animation überspringen" (design I2-E). Decorative: the button
 * around it carries the label.
 */
export function SkipIcon({ size = ICON_SIZE }: IconProps): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6.5l7 5.5-7 5.5zM11.5 6.5l7 5.5-7 5.5z" fill="currentColor" />
      <path d="M20.5 6.5v11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Drum with two sticks for the tension mode (design D-2, K4). Decorative: the button around it
 * carries the label.
 */
export function DrumIcon({ size = ICON_SIZE }: IconProps): React.JSX.Element {
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
      <path d="M4.5 10c0-1.7 3.4-3 7.5-3s7.5 1.3 7.5 3v6.5c0 1.7-3.4 3-7.5 3s-7.5-1.3-7.5-3zM4.5 10c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3M7 3l4 5.5M17 3l-4 5.5" />
    </svg>
  );
}

/**
 * Letter i in a circle for more information. Decorative: the button around it carries the label.
 */
export function InfoIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.6v.01" />
    </Outline>
  );
}

/**
 * Door with an arrow out for "end the match" (design I2-C, X2). Decorative: the button around it
 * carries the label.
 */
export function ExitDoorIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M14 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h8M10 12h11M17.5 8.5L21 12l-3.5 3.5" />
    </Outline>
  );
}

/**
 * Check mark, e.g. for "Platzierung fertig" (design I2-D). Decorative: the text beside it says it.
 */
export function CheckIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </Outline>
  );
}

/**
 * Padlock for something locked during a match (design I2-D, S1). Decorative: the text beside it
 * says why.
 */
export function LockIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z" />
    </Outline>
  );
}

/**
 * Warning triangle of the error screen (design K-5, S1). Decorative: the heading says it.
 */
export function WarningIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M12 3L2 20h20zM12 10v4M12 17v.5" />
    </Outline>
  );
}

/**
 * Circular arrow for "Neu laden" (design K-5). Decorative: the button around it carries the label.
 */
export function ReloadIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" />
    </Outline>
  );
}

/**
 * Two sheets for "Details kopieren" (design K-5). Decorative: the button around it carries the
 * label.
 */
export function CopyIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M11 9h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM5 15V5a2 2 0 0 1 2-2h8" />
    </Outline>
  );
}

/**
 * Box with an arrow out of it for "Bericht teilen" (K-9). Decorative: the button around it
 * carries the label.
 */
export function ShareIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </Outline>
  );
}

/**
 * Trophy for the winner and for "Ergebnis eintragen" (design I3-B). Decorative.
 */
export function TrophyIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 21h7M10 17h4" />
    </Outline>
  );
}

/**
 * The game list sorted A–Z: A above Z with an arrow down (design I3-B SO3). Decorative.
 */
export function SortAzIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M3.5 10.5 6 4l2.5 6.5M4.4 8.3h3.2M3.5 14h5l-5 6h5M17 4v16M13.5 16.5 17 20l3.5-3.5" />
    </Outline>
  );
}

/**
 * The game list sorted by the last match: a clock turning back (design I3-B SO3). Decorative.
 */
export function SortRecentIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M3.6 12a8.4 8.4 0 1 0 2.5-6M3.6 4v4.2h4.2M12 7.5V12l3 2" />
    </Outline>
  );
}

/**
 * Two bars for "Anhalten" (US-AB-07 AK-2). Decorative.
 */
export function PauseIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M8 5v14M16 5v14" />
    </Outline>
  );
}

/**
 * Bin for removing the time of a result (design I3-B D1). Decorative.
 */
export function TrashIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" />
    </Outline>
  );
}

/**
 * Score pad with rings and lines (design I3-C2 FB6), e.g. on the button of the result form.
 * Decorative: the button around it carries the label.
 */
export function PadIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M6.5 5h11a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-13A1.5 1.5 0 0 1 6.5 5zM8.5 3v4M12 3v4M15.5 3v4M8.5 11h7M8.5 14.5h7M8.5 18h4" />
    </Outline>
  );
}

/**
 * Horizontal sliders for the settings of the score pad (design I3-C2 GE2). Decorative.
 */
export function SlidersIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" />
    </Outline>
  );
}

/**
 * Arrow to a finishing line for the target of the score pad (design I3-C2 ZY5). Decorative: the
 * text beside it says the target.
 */
export function TargetIcon({ size }: IconProps): React.JSX.Element {
  return (
    <Outline size={size}>
      <path d="M3 12h13M12 7.5l4.5 4.5-4.5 4.5M20.5 5v14" />
    </Outline>
  );
}
