// Symbols of the options (design I2-C, page 3, O1).
// Generated from docs/design/i2-match-final-preview.html; colours are tokens in tokens.css.
import type { ArtProps } from './artProps';

/** A wooden hex: who lays out the landscapes. */
export function LandscapesOptionIcon({ className }: ArtProps): React.JSX.Element {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path
        d="M12 2.4l8.3 4.8v9.6L12 21.6l-8.3-4.8V7.2z"
        fill="var(--color-art-orange-32)"
        stroke="var(--color-art-orange-16)"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M5.6 8.3L12 4.6l6.4 3.7"
        fill="none"
        stroke="var(--color-art-gray-1)"
        strokeOpacity=".3"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** An anchor in the text colour: who lays out the harbours. */
export function HarborsOptionIcon({ className }: ArtProps): React.JSX.Element {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="5" r="2.2" />
        <path d="M12 7.2V20.5M7.6 11h8.8M4.4 13.6c0 4.1 3.4 6.9 7.6 6.9s7.6-2.8 7.6-6.9" />
      </g>
    </svg>
  );
}

/** A number token: who lays out the number tokens. */
export function NumbersOptionIcon({ className }: ArtProps): React.JSX.Element {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <circle
        cx="12"
        cy="12"
        r="9.6"
        fill="var(--color-art-gray-2)"
        stroke="var(--color-art-gray-25)"
        strokeWidth="1.3"
      />
      <text
        x="12"
        y="15.7"
        textAnchor="middle"
        fontSize="10.5"
        fontWeight="800"
        fill="var(--color-art-red-1)"
        fontFamily="system-ui, sans-serif"
      >
        {6}
      </text>
    </svg>
  );
}

/** A wheel in the Catan colours: drawing the order. */
export function OrderOptionIcon({ className }: ArtProps): React.JSX.Element {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <g stroke="var(--color-art-brown-34)" strokeWidth=".9" strokeLinejoin="round">
        <path d="M12 13V3.6A9.4 9.4 0 0 1 21.4 13z" fill="var(--color-art-red-1)" />
        <path d="M12 13h9.4A9.4 9.4 0 0 1 12 22.4z" fill="var(--color-art-blue-6)" />
        <path d="M12 13v9.4A9.4 9.4 0 0 1 2.6 13z" fill="var(--color-art-gray-2)" />
        <path d="M12 13H2.6A9.4 9.4 0 0 1 12 3.6z" fill="var(--color-art-orange-25)" />
        <circle cx="12" cy="13" r="1.8" fill="var(--color-art-orange-9)" />
        <path d="M12 5.2L9.6 .9h4.8z" fill="var(--color-art-orange-9)" />
      </g>
    </svg>
  );
}

/** Three resource cards: drawing starting resources. */
export function ResourcesOptionIcon({ className }: ArtProps): React.JSX.Element {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <g stroke="var(--color-art-brown-34)" strokeWidth="1" strokeLinejoin="round">
        <rect
          x="2.6"
          y="5.4"
          width="9.6"
          height="13.6"
          rx="1.8"
          fill="var(--color-art-orange-30)"
          transform="rotate(-16 7.4 12.2)"
        />
        <rect x="7.2" y="4.6" width="9.6" height="13.6" rx="1.8" fill="var(--color-art-green-6)" />
        <rect
          x="11.8"
          y="5.4"
          width="9.6"
          height="13.6"
          rx="1.8"
          fill="var(--color-art-yellow-21)"
          transform="rotate(16 16.6 12.2)"
        />
      </g>
      <rect
        x="13.6"
        y="7.4"
        width="6"
        height="9.6"
        rx="1"
        fill="none"
        stroke="var(--color-art-gray-1)"
        strokeOpacity=".45"
        strokeWidth=".8"
        transform="rotate(16 16.6 12.2)"
      />
    </svg>
  );
}
