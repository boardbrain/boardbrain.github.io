// Pictures of the draws LS-01, LS-03 and LS-04 (design I2-C, page 5, D2: I1, H3, Z1).
// Generated from docs/design/i2-match-final-preview.html; colours are tokens in tokens.css.
import { t } from '@/i18n/t';
import { useArtId, type ArtProps } from './artProps';

/** Landscape hexes as a flower with the desert in the middle (I1). */
export function LandscapesDrawArt({ className }: ArtProps): React.JSX.Element {
  const id = useArtId();
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <defs>
        <radialGradient id={`${id}dsLand`} cx="50%" cy="45%" r="70%">
          <stop offset="0" stopColor="var(--color-art-brown-22)" />
          <stop offset="1" stopColor="var(--color-art-brown-34)" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill={`url(#${id}dsLand)`} />
      <polygon
        points="50,37.5 60.8,43.8 60.8,56.2 50,62.5 39.2,56.2 39.2,43.8"
        fill="var(--color-art-orange-9)"
        stroke="var(--color-art-brown-34)"
        strokeWidth=".9"
        strokeLinejoin="round"
      />
      <polyline
        points="40.4,55.5 40.4,44.5 50,38.9 59.6,44.5"
        fill="none"
        stroke="var(--color-art-gray-1)"
        strokeOpacity=".22"
        strokeWidth=".7"
        strokeLinecap="round"
      />
      <polygon
        points="39.2,18.8 50,25 50,37.5 39.2,43.8 28.4,37.5 28.4,25"
        fill="var(--color-art-orange-44)"
        stroke="var(--color-art-brown-34)"
        strokeWidth=".9"
        strokeLinejoin="round"
      />
      <polyline
        points="29.6,36.8 29.6,25.7 39.2,20.1 48.8,25.7"
        fill="none"
        stroke="var(--color-art-gray-1)"
        strokeOpacity=".22"
        strokeWidth=".7"
        strokeLinecap="round"
      />
      <polygon
        points="60.8,18.8 71.7,25 71.7,37.5 60.8,43.8 50,37.5 50,25"
        fill="var(--color-art-green-4)"
        stroke="var(--color-art-brown-34)"
        strokeWidth=".9"
        strokeLinejoin="round"
      />
      <polyline
        points="51.2,36.8 51.2,25.7 60.8,20.1 70.4,25.7"
        fill="none"
        stroke="var(--color-art-gray-1)"
        strokeOpacity=".22"
        strokeWidth=".7"
        strokeLinecap="round"
      />
      <polygon
        points="71.7,37.5 82.5,43.8 82.5,56.2 71.7,62.5 60.8,56.2 60.8,43.8"
        fill="var(--color-art-yellow-28)"
        stroke="var(--color-art-brown-34)"
        strokeWidth=".9"
        strokeLinejoin="round"
      />
      <polyline
        points="62,55.5 62,44.5 71.7,38.9 81.3,44.5"
        fill="none"
        stroke="var(--color-art-gray-1)"
        strokeOpacity=".22"
        strokeWidth=".7"
        strokeLinecap="round"
      />
      <polygon
        points="60.8,56.2 71.7,62.5 71.7,75 60.8,81.2 50,75 50,62.5"
        fill="var(--color-art-green-4)"
        stroke="var(--color-art-brown-34)"
        strokeWidth=".9"
        strokeLinejoin="round"
      />
      <polyline
        points="51.2,74.3 51.2,63.2 60.8,57.6 70.4,63.2"
        fill="none"
        stroke="var(--color-art-gray-1)"
        strokeOpacity=".22"
        strokeWidth=".7"
        strokeLinecap="round"
      />
      <polygon
        points="39.2,56.2 50,62.5 50,75 39.2,81.2 28.4,75 28.4,62.5"
        fill="var(--color-art-gray-8)"
        stroke="var(--color-art-brown-34)"
        strokeWidth=".9"
        strokeLinejoin="round"
      />
      <polyline
        points="29.6,74.3 29.6,63.2 39.2,57.6 48.8,63.2"
        fill="none"
        stroke="var(--color-art-gray-1)"
        strokeOpacity=".22"
        strokeWidth=".7"
        strokeLinecap="round"
      />
      <polygon
        points="28.4,37.5 39.2,43.8 39.2,56.2 28.4,62.5 17.5,56.2 17.5,43.8"
        fill="var(--color-art-green-13)"
        stroke="var(--color-art-brown-34)"
        strokeWidth=".9"
        strokeLinejoin="round"
      />
      <polyline
        points="18.7,55.5 18.7,44.5 28.4,38.9 38,44.5"
        fill="none"
        stroke="var(--color-art-gray-1)"
        strokeOpacity=".22"
        strokeWidth=".7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Harbour tokens: 3:1 in the middle, five 2:1 around it (H3). */
export function HarborsDrawArt({ className }: ArtProps): React.JSX.Element {
  const id = useArtId();
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <defs>
        <radialGradient id={`${id}dsHarb`} cx="50%" cy="45%" r="70%">
          <stop offset="0" stopColor="var(--color-art-brown-22)" />
          <stop offset="1" stopColor="var(--color-art-brown-34)" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill={`url(#${id}dsHarb)`} />
      <circle
        cx="50"
        cy="50"
        r="13"
        fill="var(--color-art-gray-2)"
        stroke="var(--color-art-gray-25)"
        strokeWidth=".9"
      />
      <text
        x="50"
        y="53.9"
        textAnchor="middle"
        fontSize="10.7"
        fontWeight="800"
        fill="var(--color-art-brown-34)"
        fontFamily="system-ui, sans-serif"
      >
        {t('partie.bild.hafenDreiZuEins')}
      </text>
      <circle
        cx="50"
        cy="19"
        r="9.5"
        fill="var(--color-art-gray-2)"
        stroke="var(--color-art-gray-25)"
        strokeWidth=".9"
      />
      <g
        transform="translate(45.2 10.8) scale(.4)"
        fill="var(--color-art-green-7)"
        style={{ color: 'var(--color-art-brown-34)' }}
      >
        <line
          x1="10"
          y1="10.8"
          x2="15.9"
          y2="6.36"
          stroke="var(--color-art-brown-34)"
          strokeWidth="8.4"
          strokeLinecap="round"
        />
        <line
          x1="10"
          y1="10.8"
          x2="15.9"
          y2="6.36"
          stroke="var(--color-art-brown-7)"
          strokeWidth="6.4"
          strokeLinecap="round"
        />
        <line
          x1="10.6"
          y1="9.2"
          x2="16.5"
          y2="4.76"
          stroke="var(--color-art-orange-43)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <line
          x1="11.2"
          y1="11.7"
          x2="16.5"
          y2="7.76"
          stroke="var(--color-art-brown-17)"
          strokeWidth=".5"
          strokeLinecap="round"
        />
        <line
          x1="6.8"
          y1="16.4"
          x2="12.7"
          y2="12"
          stroke="var(--color-art-brown-34)"
          strokeWidth="8.4"
          strokeLinecap="round"
        />
        <line
          x1="6.8"
          y1="16.4"
          x2="12.7"
          y2="12"
          stroke="var(--color-art-brown-7)"
          strokeWidth="6.4"
          strokeLinecap="round"
        />
        <line
          x1="7.4"
          y1="14.8"
          x2="13.3"
          y2="10.4"
          stroke="var(--color-art-orange-43)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <line
          x1="8"
          y1="17.3"
          x2="13.3"
          y2="13.4"
          stroke="var(--color-art-brown-17)"
          strokeWidth=".5"
          strokeLinecap="round"
        />
        <line
          x1="13.2"
          y1="16.4"
          x2="19.1"
          y2="12"
          stroke="var(--color-art-brown-34)"
          strokeWidth="8.4"
          strokeLinecap="round"
        />
        <line
          x1="13.2"
          y1="16.4"
          x2="19.1"
          y2="12"
          stroke="var(--color-art-brown-7)"
          strokeWidth="6.4"
          strokeLinecap="round"
        />
        <line
          x1="13.8"
          y1="14.8"
          x2="19.7"
          y2="10.4"
          stroke="var(--color-art-orange-43)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <line
          x1="14.4"
          y1="17.3"
          x2="19.7"
          y2="13.4"
          stroke="var(--color-art-brown-17)"
          strokeWidth=".5"
          strokeLinecap="round"
        />
        <circle
          cx="10"
          cy="10.8"
          r="3.2"
          fill="var(--color-art-orange-8)"
          stroke="var(--color-art-brown-34)"
          strokeWidth="1"
        />
        <circle
          cx="10"
          cy="10.8"
          r="1.86"
          fill="none"
          stroke="var(--color-art-orange-43)"
          strokeWidth=".55"
        />
        <circle cx="10" cy="10.8" r=".55" fill="var(--color-art-orange-43)" />
        <circle
          cx="6.8"
          cy="16.4"
          r="3.2"
          fill="var(--color-art-orange-8)"
          stroke="var(--color-art-brown-34)"
          strokeWidth="1"
        />
        <circle
          cx="6.8"
          cy="16.4"
          r="1.86"
          fill="none"
          stroke="var(--color-art-orange-43)"
          strokeWidth=".55"
        />
        <circle cx="6.8" cy="16.4" r=".55" fill="var(--color-art-orange-43)" />
        <circle
          cx="13.2"
          cy="16.4"
          r="3.2"
          fill="var(--color-art-orange-8)"
          stroke="var(--color-art-brown-34)"
          strokeWidth="1"
        />
        <circle
          cx="13.2"
          cy="16.4"
          r="1.86"
          fill="none"
          stroke="var(--color-art-orange-43)"
          strokeWidth=".55"
        />
        <circle cx="13.2" cy="16.4" r=".55" fill="var(--color-art-orange-43)" />
      </g>
      <text
        x="50"
        y="24.9"
        textAnchor="middle"
        fontSize="5.32"
        fontWeight="800"
        fill="var(--color-art-brown-34)"
        fontFamily="system-ui, sans-serif"
      >
        {t('partie.bild.hafenZweiZuEins')}
      </text>
      <circle
        cx="79.5"
        cy="40.4"
        r="9.5"
        fill="var(--color-art-gray-2)"
        stroke="var(--color-art-gray-25)"
        strokeWidth=".9"
      />
      <g
        transform="translate(74.7 32.2) scale(.4)"
        fill="var(--color-art-orange-29)"
        style={{ color: 'var(--color-art-brown-34)' }}
      >
        <g stroke="var(--color-art-brown-34)" strokeWidth=".9" strokeLinejoin="round">
          <path d="M1.8 13l2.4-2h9l-2.4 2z" fill="var(--color-art-orange-14)" />
          <path d="M10.8 13l2.4-2v3.6l-2.4 2z" fill="var(--color-art-red-7)" />
          <path d="M1.8 13h9v3.6h-9z" fill="var(--color-art-red-4)" />
          <path d="M11 13l2.4-2h9l-2.4 2z" fill="var(--color-art-orange-14)" />
          <path d="M20 13l2.4-2v3.6l-2.4 2z" fill="var(--color-art-red-7)" />
          <path d="M11 13h9v3.6h-9z" fill="var(--color-art-red-4)" />
          <path d="M6.4 9.4l2.4-2h9l-2.4 2z" fill="var(--color-art-orange-14)" />
          <path d="M15.4 9.4l2.4-2v3.6l-2.4 2z" fill="var(--color-art-red-7)" />
          <path d="M6.4 9.4h9v3.6h-9z" fill="var(--color-art-red-4)" />
        </g>
      </g>
      <text
        x="79.5"
        y="46.3"
        textAnchor="middle"
        fontSize="5.32"
        fontWeight="800"
        fill="var(--color-art-brown-34)"
        fontFamily="system-ui, sans-serif"
      >
        {t('partie.bild.hafenZweiZuEins')}
      </text>
      <circle
        cx="68.2"
        cy="75.1"
        r="9.5"
        fill="var(--color-art-gray-2)"
        stroke="var(--color-art-gray-25)"
        strokeWidth=".9"
      />
      <g
        transform="translate(63.5 66.9) scale(.4)"
        fill="var(--color-art-green-2)"
        style={{ color: 'var(--color-art-brown-34)' }}
      >
        <g fill="var(--color-art-brown-34)">
          <rect x="9.6" y="15" width="1.6" height="6" rx=".6" />
          <rect x="12" y="15" width="1.6" height="6" rx=".6" />
          <rect x="15" y="15" width="1.6" height="6" rx=".6" />
          <rect x="17.2" y="15" width="1.6" height="5.6" rx=".6" />
        </g>
        <circle cx="10.2" cy="11.2" r="4.4" fill="var(--color-art-brown-34)" />
        <circle cx="13.6" cy="9.6" r="4.5" fill="var(--color-art-brown-34)" />
        <circle cx="17.2" cy="11" r="4.3" fill="var(--color-art-brown-34)" />
        <circle cx="11.8" cy="14.2" r="4.1" fill="var(--color-art-brown-34)" />
        <circle cx="15.8" cy="14.2" r="4.1" fill="var(--color-art-brown-34)" />
        <circle cx="10.2" cy="11.2" r="3.3" fill="var(--color-art-yellow-3)" />
        <circle cx="13.6" cy="9.6" r="3.4" fill="var(--color-art-yellow-3)" />
        <circle cx="17.2" cy="11" r="3.2" fill="var(--color-art-yellow-3)" />
        <circle cx="11.8" cy="14.2" r="3" fill="var(--color-art-yellow-3)" />
        <circle cx="15.8" cy="14.2" r="3" fill="var(--color-art-yellow-3)" />
        <ellipse
          cx="6.4"
          cy="12"
          rx="2.5"
          ry="3.3"
          transform="rotate(28 6.4 12)"
          fill="var(--color-art-brown-26)"
          stroke="var(--color-art-brown-34)"
          strokeWidth=".8"
        />
        <ellipse
          cx="8"
          cy="9.2"
          rx="1.7"
          ry=".8"
          transform="rotate(-35 8 9.2)"
          fill="var(--color-art-brown-26)"
          stroke="var(--color-art-brown-34)"
          strokeWidth=".6"
        />
        <circle cx="5.7" cy="11.3" r=".55" fill="var(--color-art-yellow-3)" />
      </g>
      <text
        x="68.2"
        y="81"
        textAnchor="middle"
        fontSize="5.32"
        fontWeight="800"
        fill="var(--color-art-brown-34)"
        fontFamily="system-ui, sans-serif"
      >
        {t('partie.bild.hafenZweiZuEins')}
      </text>
      <circle
        cx="31.8"
        cy="75.1"
        r="9.5"
        fill="var(--color-art-gray-2)"
        stroke="var(--color-art-gray-25)"
        strokeWidth=".9"
      />
      <g
        transform="translate(27 66.9) scale(.4)"
        fill="var(--color-art-yellow-22)"
        style={{ color: 'var(--color-art-brown-34)' }}
      >
        <g stroke="var(--color-art-brown-34)" strokeWidth=".9" strokeLinejoin="round">
          <ellipse
            cx="7.4"
            cy="7.6"
            rx="1.35"
            ry="2.6"
            transform="rotate(-32 7.4 7.6)"
            fill="var(--color-art-yellow-20)"
          />
          <ellipse
            cx="10"
            cy="5.6"
            rx="1.35"
            ry="2.6"
            transform="rotate(-12 10 5.6)"
            fill="var(--color-art-yellow-20)"
          />
          <ellipse
            cx="12.6"
            cy="4.9"
            rx="1.35"
            ry="2.6"
            transform="rotate(4 12.6 4.9)"
            fill="var(--color-art-yellow-20)"
          />
          <ellipse
            cx="15.2"
            cy="5.8"
            rx="1.35"
            ry="2.6"
            transform="rotate(18 15.2 5.8)"
            fill="var(--color-art-yellow-20)"
          />
          <ellipse
            cx="17.4"
            cy="7.8"
            rx="1.35"
            ry="2.6"
            transform="rotate(34 17.4 7.8)"
            fill="var(--color-art-yellow-20)"
          />
          <path d="M7.2 9.4h10l-3.6 4.4 3.2 7.4h-9.2l3.2-7.4z" fill="var(--color-art-yellow-26)" />
          <path d="M9.6 12.4h5.2v2.2h-5.2z" fill="var(--color-art-brown-7)" />
        </g>
        <path
          d="M10.6 16.5l-.8 3.8M12.2 16.5v3.8M13.8 16.5l.8 3.8"
          stroke="var(--color-art-orange-45)"
          strokeWidth=".6"
          strokeLinecap="round"
        />
      </g>
      <text
        x="31.8"
        y="81"
        textAnchor="middle"
        fontSize="5.32"
        fontWeight="800"
        fill="var(--color-art-brown-34)"
        fontFamily="system-ui, sans-serif"
      >
        {t('partie.bild.hafenZweiZuEins')}
      </text>
      <circle
        cx="20.5"
        cy="40.4"
        r="9.5"
        fill="var(--color-art-gray-2)"
        stroke="var(--color-art-gray-25)"
        strokeWidth=".9"
      />
      <g
        transform="translate(15.8 32.2) scale(.4)"
        fill="var(--color-art-blue-5)"
        style={{ color: 'var(--color-art-brown-34)' }}
      >
        <path
          d="M2.8 15.8L4.6 10.6 8.4 7.4 12.6 6.2 17.4 7.2 20.6 10.4 21.4 14.6 18.6 18.2 12.4 19.4 6.2 18.8z"
          fill="var(--color-art-gray-18)"
          stroke="var(--color-art-brown-34)"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <path
          d="M4.6 10.6L8.4 7.4 12.6 6.2 17.4 7.2 14.6 10.2 9.2 11.2z"
          fill="var(--color-art-gray-9)"
        />
        <path
          d="M17.4 7.2L20.6 10.4 21.4 14.6 18.6 18.2 14.6 10.2z"
          fill="var(--color-art-gray-20)"
        />
        <path d="M2.8 15.8L4.6 10.6 9.2 11.2 7.6 18.6 6.2 18.8z" fill="var(--color-art-gray-15)" />
        <path
          d="M5.4 10.2L8.6 7.6 12.6 6.7"
          fill="none"
          stroke="var(--color-art-blue-4)"
          strokeWidth=".7"
          strokeLinecap="round"
        />
        <g fill="var(--color-art-blue-2)">
          <path d="M10.6 14.4l1.2-.6.5.8-1.1.6z" />
          <path d="M16.2 13.2l.9-.9.6.6-.9.8z" />
          <path d="M6.4 15.6l.9-.3.3.7-.9.3z" />
          <path d="M12.4 8.6l1-.3.3.6-1 .3z" />
        </g>
      </g>
      <text
        x="20.5"
        y="46.3"
        textAnchor="middle"
        fontSize="5.32"
        fontWeight="800"
        fill="var(--color-art-brown-34)"
        fontFamily="system-ui, sans-serif"
      >
        {t('partie.bild.hafenZweiZuEins')}
      </text>
    </svg>
  );
}

/** Number tokens on the flower; 6 and 8 not next to each other (Z1). */
export function NumbersDrawArt({ className }: ArtProps): React.JSX.Element {
  const id = useArtId();
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <defs>
        <radialGradient id={`${id}dsNum`} cx="50%" cy="45%" r="70%">
          <stop offset="0" stopColor="var(--color-art-brown-22)" />
          <stop offset="1" stopColor="var(--color-art-brown-34)" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill={`url(#${id}dsNum)`} />
      <polygon
        points="50,37.5 60.8,43.8 60.8,56.2 50,62.5 39.2,56.2 39.2,43.8"
        fill="var(--color-art-orange-9)"
        stroke="var(--color-art-brown-34)"
        strokeWidth=".9"
        strokeLinejoin="round"
      />
      <polygon
        points="39.2,18.8 50,25 50,37.5 39.2,43.8 28.4,37.5 28.4,25"
        fill="var(--color-art-orange-44)"
        stroke="var(--color-art-brown-34)"
        strokeWidth=".9"
        strokeLinejoin="round"
      />
      <polygon
        points="60.8,18.8 71.7,25 71.7,37.5 60.8,43.8 50,37.5 50,25"
        fill="var(--color-art-green-4)"
        stroke="var(--color-art-brown-34)"
        strokeWidth=".9"
        strokeLinejoin="round"
      />
      <polygon
        points="71.7,37.5 82.5,43.8 82.5,56.2 71.7,62.5 60.8,56.2 60.8,43.8"
        fill="var(--color-art-yellow-28)"
        stroke="var(--color-art-brown-34)"
        strokeWidth=".9"
        strokeLinejoin="round"
      />
      <polygon
        points="60.8,56.2 71.7,62.5 71.7,75 60.8,81.2 50,75 50,62.5"
        fill="var(--color-art-green-4)"
        stroke="var(--color-art-brown-34)"
        strokeWidth=".9"
        strokeLinejoin="round"
      />
      <polygon
        points="39.2,56.2 50,62.5 50,75 39.2,81.2 28.4,75 28.4,62.5"
        fill="var(--color-art-gray-8)"
        stroke="var(--color-art-brown-34)"
        strokeWidth=".9"
        strokeLinejoin="round"
      />
      <polygon
        points="28.4,37.5 39.2,43.8 39.2,56.2 28.4,62.5 17.5,56.2 17.5,43.8"
        fill="var(--color-art-green-13)"
        stroke="var(--color-art-brown-34)"
        strokeWidth=".9"
        strokeLinejoin="round"
      />
      <circle
        cx="39.2"
        cy="31.2"
        r="6.6"
        fill="var(--color-art-gray-2)"
        stroke="var(--color-art-gray-25)"
        strokeWidth=".57"
      />
      <text
        x="39.2"
        y="32.8"
        textAnchor="middle"
        fontSize="5.97"
        fontWeight="800"
        fill="var(--color-art-red-1)"
        fontFamily="system-ui, sans-serif"
      >
        {6}
      </text>
      <circle cx="36.5" cy="34.8" r=".47" fill="var(--color-art-red-1)" />
      <circle cx="37.9" cy="34.8" r=".47" fill="var(--color-art-red-1)" />
      <circle cx="39.2" cy="34.8" r=".47" fill="var(--color-art-red-1)" />
      <circle cx="40.5" cy="34.8" r=".47" fill="var(--color-art-red-1)" />
      <circle cx="41.8" cy="34.8" r=".47" fill="var(--color-art-red-1)" />
      <circle
        cx="60.8"
        cy="31.2"
        r="6.6"
        fill="var(--color-art-gray-2)"
        stroke="var(--color-art-gray-25)"
        strokeWidth=".57"
      />
      <text
        x="60.8"
        y="32.8"
        textAnchor="middle"
        fontSize="5.97"
        fontWeight="800"
        fill="var(--color-art-brown-34)"
        fontFamily="system-ui, sans-serif"
      >
        {10}
      </text>
      <circle cx="59.5" cy="34.8" r=".47" fill="var(--color-art-brown-34)" />
      <circle cx="60.8" cy="34.8" r=".47" fill="var(--color-art-brown-34)" />
      <circle cx="62.1" cy="34.8" r=".47" fill="var(--color-art-brown-34)" />
      <circle
        cx="71.7"
        cy="50"
        r="6.6"
        fill="var(--color-art-gray-2)"
        stroke="var(--color-art-gray-25)"
        strokeWidth=".57"
      />
      <text
        x="71.7"
        y="51.5"
        textAnchor="middle"
        fontSize="5.97"
        fontWeight="800"
        fill="var(--color-art-brown-34)"
        fontFamily="system-ui, sans-serif"
      >
        {4}
      </text>
      <circle cx="70.3" cy="53.5" r=".47" fill="var(--color-art-brown-34)" />
      <circle cx="71.7" cy="53.5" r=".47" fill="var(--color-art-brown-34)" />
      <circle cx="73" cy="53.5" r=".47" fill="var(--color-art-brown-34)" />
      <circle
        cx="60.8"
        cy="68.8"
        r="6.6"
        fill="var(--color-art-gray-2)"
        stroke="var(--color-art-gray-25)"
        strokeWidth=".57"
      />
      <text
        x="60.8"
        y="70.3"
        textAnchor="middle"
        fontSize="5.97"
        fontWeight="800"
        fill="var(--color-art-red-1)"
        fontFamily="system-ui, sans-serif"
      >
        {8}
      </text>
      <circle cx="58.2" cy="72.3" r=".47" fill="var(--color-art-red-1)" />
      <circle cx="59.5" cy="72.3" r=".47" fill="var(--color-art-red-1)" />
      <circle cx="60.8" cy="72.3" r=".47" fill="var(--color-art-red-1)" />
      <circle cx="62.1" cy="72.3" r=".47" fill="var(--color-art-red-1)" />
      <circle cx="63.5" cy="72.3" r=".47" fill="var(--color-art-red-1)" />
      <circle
        cx="39.2"
        cy="68.8"
        r="6.6"
        fill="var(--color-art-gray-2)"
        stroke="var(--color-art-gray-25)"
        strokeWidth=".57"
      />
      <text
        x="39.2"
        y="70.3"
        textAnchor="middle"
        fontSize="5.97"
        fontWeight="800"
        fill="var(--color-art-brown-34)"
        fontFamily="system-ui, sans-serif"
      >
        {3}
      </text>
      <circle cx="38.5" cy="72.3" r=".47" fill="var(--color-art-brown-34)" />
      <circle cx="39.8" cy="72.3" r=".47" fill="var(--color-art-brown-34)" />
      <circle
        cx="28.4"
        cy="50"
        r="6.6"
        fill="var(--color-art-gray-2)"
        stroke="var(--color-art-gray-25)"
        strokeWidth=".57"
      />
      <text
        x="28.4"
        y="51.5"
        textAnchor="middle"
        fontSize="5.97"
        fontWeight="800"
        fill="var(--color-art-brown-34)"
        fontFamily="system-ui, sans-serif"
      >
        {11}
      </text>
      <circle cx="27.7" cy="53.5" r=".47" fill="var(--color-art-brown-34)" />
      <circle cx="29" cy="53.5" r=".47" fill="var(--color-art-brown-34)" />
    </svg>
  );
}
