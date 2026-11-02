// Landscape of the Catan card (design I2-C, page 1, K2): own drawing, no original artwork (NFA-GB-06).
// Generated from docs/design/i2-match-final-preview.html; colours are tokens in tokens.css.
import { useArtId, type ArtProps } from './artProps';

/** Sunset over ore mountains, forest, clay pit, pasture and grain field. */
export function LandscapeArt({ className }: ArtProps): React.JSX.Element {
  const id = useArtId();
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 110"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <defs>
        <linearGradient
          id={`${id}s0sky`}
          x1="0"
          x2="0"
          y1="-60"
          y2="66"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="var(--color-art-red-10)" />
          <stop offset="0.35" stopColor="var(--color-art-red-5)" />
          <stop offset="0.62" stopColor="var(--color-art-red-3)" />
          <stop offset="0.86" stopColor="var(--color-art-orange-27)" />
          <stop offset="1" stopColor="var(--color-art-orange-19)" />
        </linearGradient>
        <radialGradient id={`${id}s0glow`} cx="55" cy="61" r="58" gradientUnits="userSpaceOnUse">
          <stop offset="0.3" stopColor="var(--color-art-yellow-13)" stopOpacity="0.85" />
          <stop offset="0.55" stopColor="var(--color-art-orange-17)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--color-art-orange-22)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}s0sun`} cx="55" cy="58" r="25" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--color-art-yellow-7)" />
          <stop offset="0.7" stopColor="var(--color-art-yellow-12)" />
          <stop offset="1" stopColor="var(--color-art-orange-6)" />
        </radialGradient>
        <linearGradient
          id={`${id}s0ore`}
          x1="0"
          x2="0"
          y1="42"
          y2="66"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="var(--color-art-pink-1)" />
          <stop offset="1" stopColor="var(--color-art-pink-2)" />
        </linearGradient>
        <linearGradient
          id={`${id}s0haze`}
          x1="0"
          x2="0"
          y1="56"
          y2="70"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="var(--color-art-orange-18)" stopOpacity="0" />
          <stop offset="0.55" stopColor="var(--color-art-orange-20)" stopOpacity="0.5" />
          <stop offset="1" stopColor="var(--color-art-orange-26)" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id={`${id}s0wood`}
          x1="0"
          x2="0"
          y1="62"
          y2="80"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="var(--color-art-green-23)" />
          <stop offset="1" stopColor="var(--color-art-green-30)" />
        </linearGradient>
        <linearGradient
          id={`${id}s0brick`}
          x1="0"
          x2="0"
          y1="61"
          y2="78"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="var(--color-art-orange-40)" />
          <stop offset="1" stopColor="var(--color-art-red-9)" />
        </linearGradient>
        <linearGradient
          id={`${id}s0wool`}
          x1="0"
          x2="0"
          y1="64"
          y2="84"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="var(--color-art-green-8)" />
          <stop offset="1" stopColor="var(--color-art-green-16)" />
        </linearGradient>
        <linearGradient
          id={`${id}s0grain`}
          x1="0"
          x2="0"
          y1="77"
          y2="112"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="var(--color-art-orange-31)" />
          <stop offset="1" stopColor="var(--color-art-brown-8)" />
        </linearGradient>
        <linearGradient
          id={`${id}s0front`}
          x1="0"
          x2="0"
          y1="76"
          y2="112"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="var(--color-art-green-21)" />
          <stop offset="1" stopColor="var(--color-art-green-30)" />
        </linearGradient>
        <linearGradient
          id={`${id}s0vig`}
          x1="0"
          x2="0"
          y1="78"
          y2="114"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="var(--color-art-red-16)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--color-art-red-16)" stopOpacity="0.4" />
        </linearGradient>
        <filter id={`${id}s0blur`} x="-10%" y="-200%" width="120%" height="500%">
          <feGaussianBlur stdDeviation=".6" />
        </filter>
      </defs>
      <rect x="-10" y="-60" width="120" height="185" fill={`url(#${id}s0sky)`} />
      <circle cx="55" cy="61" r="58" fill={`url(#${id}s0glow)`} />
      <circle cx="55" cy="58" r="23" fill={`url(#${id}s0sun)`} />
      <g filter={`url(#${id}s0blur)`} fill="var(--color-art-red-6)">
        <ellipse cx="20" cy="18" rx="32" ry="1.5" fillOpacity="0.55" />
        <ellipse cx="80" cy="26" rx="30" ry="1.4" fillOpacity="0.5" />
        <ellipse cx="26" cy="40" rx="24" ry="1.2" fillOpacity="0.45" />
        <ellipse cx="82" cy="47" rx="26" ry="1.1" fillOpacity="0.55" />
        <ellipse cx="70" cy="52" rx="18" ry=".8" fillOpacity="0.45" />
      </g>
      <path
        d="M78 34q1.6 -1.3 3.2 0q1.6 -1.3 3.2 0M87 30q1.2 -1 2.4 0q1.2 -1 2.4 0"
        fill="none"
        stroke="var(--color-art-red-12)"
        strokeOpacity="0.7"
        strokeWidth=".6"
        strokeLinecap="round"
      />
      <path
        d="M-5 64L4 54L9 56.5L16 47L22 52L27 49L33 55L38 53.5L44 64Z"
        fill={`url(#${id}s0ore)`}
      />
      <path
        d="M16 47L22 52L19 52.6L16 50ZM27 49L33 55L30.6 55.2L27 51.6ZM4 54L9 56.5L7 57.2Z"
        fill="var(--color-art-red-2)"
        fillOpacity="0.75"
      />
      <path
        d="M66 64L72 55L76 57L83 46.5L89 52L93 49.5L100 56L105 54V64Z"
        fill={`url(#${id}s0ore)`}
      />
      <path
        d="M83 46.5L76 57L78.6 56.2L83 50ZM72 55L66 64L68.4 62.6ZM93 49.5L89 52L90.8 52.2Z"
        fill="var(--color-art-red-2)"
        fillOpacity="0.75"
      />
      <path
        d="M10 60.5L13 58.6M20 57.8L23.5 56M84 55.5L87.5 53.6M95 57L98 55.4"
        stroke="var(--color-art-pink-3)"
        strokeOpacity="0.6"
        strokeWidth=".45"
        strokeLinecap="round"
      />
      <rect x="-10" y="56" width="120" height="14" fill={`url(#${id}s0haze)`} />
      <path
        d="M60 70C68 62 78 58.6 88 58.6C95 58.6 100 59.6 105 61V120H60Z"
        fill={`url(#${id}s0brick)`}
      />
      <path
        d="M66 66.5C72 61.6 80 59.2 88 59"
        fill="none"
        stroke="var(--color-art-orange-7)"
        strokeOpacity="0.5"
        strokeWidth=".5"
      />
      <path
        d="M80.5 61.2C85 60 91 60 96.5 61.2L95 66.2C90.6 65.2 86.2 65.4 82.2 66.4Z"
        fill="var(--color-art-orange-21)"
      />
      <path
        d="M81.2 62.8C86 61.8 91 61.8 96 62.8M81.8 64.6C86.4 63.7 90.8 63.7 95.4 64.5"
        fill="none"
        stroke="var(--color-art-orange-5)"
        strokeOpacity="0.6"
        strokeWidth=".4"
      />
      <path
        d="M84 66.2h2.2v-1h-2.2zM86.6 66.2h2.2v-1h-2.2zM85.3 65.1h2.2v-1h-2.2z"
        fill="var(--color-art-red-8)"
        stroke="var(--color-art-red-13)"
        strokeWidth=".2"
      />
      <path
        d="M-5 66C6 63 18 62.5 28 64.5C34 65.8 38 68 40 72V120H-5Z"
        fill={`url(#${id}s0wood)`}
      />
      <path
        d="M-6.16,67.2L-5.52,64.3L-5.72,64.4L-5,62.6L-4.28,64.4L-4.48,64.3L-3.84,67.2ZM-5.15,66.7L-4.05,62.6L-4.39,62.7L-3.16,59.7L-1.92,62.7L-2.26,62.6L-1.17,66.7ZM-3,66.3L-2.06,62.6L-2.35,62.7L-1.3,60.1L-.25,62.7L-.54,62.6L.4,66.3ZM-1.07,65.9L-.17,62.3L-.45,62.4L.57,59.9L1.59,62.4L1.31,62.3L2.21,65.9ZM.44,65.6L1.54,61.4L1.2,61.5L2.45,58.5L3.7,61.5L3.35,61.4L4.46,65.6ZM3.11,65.3L3.78,62.3L3.58,62.4L4.33,60.5L5.09,62.4L4.88,62.3L5.56,65.3ZM4.25,65L5.34,60.9L5,61L6.22,58L7.44,61L7.11,60.9L8.19,65ZM6.36,64.8L7.32,61.1L7.03,61.2L8.11,58.5L9.19,61.2L8.9,61.1L9.86,64.8ZM8.41,64.7L9.28,61.1L9.01,61.2L10,58.8L11,61.2L10.7,61.1L11.6,64.7ZM9.85,64.6L11,60.4L10.6,60.5L11.9,57.4L13.1,60.5L12.8,60.4L13.9,64.6ZM12.5,64.5L13.2,61.4L12.9,61.5L13.7,59.5L14.5,61.5L14.3,61.4L15,64.5ZM13.7,64.5L14.7,60.5L14.4,60.6L15.6,57.6L16.8,60.6L16.5,60.5L17.5,64.5ZM15.7,64.5L16.6,60.7L16.3,60.8L17.4,58L18.6,60.8L18.2,60.7L19.2,64.5ZM17.7,64.6L18.6,61.2L18.3,61.3L19.3,58.9L20.2,61.3L20,61.2L20.8,64.6ZM19,64.7L20.1,60.5L19.8,60.7L21.1,57.5L22.3,60.7L22,60.5L23.1,64.7ZM21.5,64.9L22.2,61.7L22,61.8L22.9,59.7L23.7,61.8L23.5,61.7L24.2,64.9ZM22.7,65.1L23.7,61.1L23.4,61.2L24.6,58.3L25.8,61.2L25.5,61.1L26.5,65.1ZM24.5,65.4L25.5,61.5L25.2,61.6L26.3,58.8L27.5,61.6L27.1,61.5L28.1,65.4ZM26.5,65.7L27.3,62.4L27.1,62.4L28,60.2L28.9,62.4L28.7,62.4L29.5,65.7Z"
        fill="var(--color-art-green-31)"
      />
      <path d="M-5 73C10 69 24 64.6 50 64.6S82 65 96 69V120H-5Z" fill={`url(#${id}s0wool)`} />
      <path
        d="M-5 73C10 69 24 64.6 50 64.6S82 65 96 69"
        fill="none"
        stroke="var(--color-art-orange-15)"
        strokeOpacity="0.45"
        strokeWidth=".55"
      />
      <g transform="translate(54 65.4) scale(1)">
        <g fill="var(--color-art-red-14)">
          <path d="M-12 0V-6L-9.5 -8.6L-7 -6V0Z" />
          <path d="M-8 0V-7.6L-5.5 -10.6L-3 -7.6V0Z" />
          <path d="M-2 0V-7L1.5 -9.8L5 -7V0Z" />
          <path d="M4 0V-13L5.5 -18.6L7 -13V0Z" />
          <path d="M7 0V-6.6L9.5 -9.2L12 -6.6V0Z" />
          <path d="M11 0V-5L12.8 -7.2L14.5 -5V0Z" />
          <path d="M-17.2 0V-6.6H-12.8V0Z" />
          <path d="M-17.8 -6.4L-15 -10.4L-12.2 -6.4Z" />
          <path d="M18.2 .6L19 -7H21L21.8 .6Z" />
          <path d="M-17.2 .4V-5H14.5V.4Z" />
          <path d="M14.2 0V-3.2L16.4 -4.8L18.6 -3.2V0Z" />
          <circle cx="20" cy="-7.3" r=".9" />
        </g>
        <g stroke="var(--color-art-red-14)" strokeWidth=".7" strokeLinecap="round">
          <line x1="20" y1="-7.3" x2="25.3" y2="-5.38" />
          <line x1="20" y1="-7.3" x2="18.1" y2="-2.04" />
          <line x1="20" y1="-7.3" x2="14.7" y2="-9.22" />
          <line x1="20" y1="-7.3" x2="21.9" y2="-12.6" />
        </g>
        <rect x="-10.2" y="-4.9" width=".85" height="1.15" fill="var(--color-art-orange-4)" />
        <rect x="-5.9" y="-5.8" width=".85" height="1.15" fill="var(--color-art-orange-4)" />
        <rect x="-1.3" y="-5.2" width=".85" height="1.15" fill="var(--color-art-orange-4)" />
        <rect x="3.2" y="-5.2" width=".85" height="1.15" fill="var(--color-art-orange-4)" />
        <rect x="5.1" y="-10.6" width=".85" height="1.15" fill="var(--color-art-orange-4)" />
        <rect x="9" y="-5" width=".85" height="1.15" fill="var(--color-art-orange-4)" />
        <rect x="-15.4" y="-5" width=".85" height="1.15" fill="var(--color-art-orange-4)" />
        <path d="M.5 0V-1.6A1 1 0 0 1 2.5 -1.6V0Z" fill="var(--color-art-red-15)" />
        <ellipse cx="-20.4" cy="-2.7" rx="1" ry="3" fill="var(--color-art-green-26)" />
        <ellipse cx="-20.7" cy="-3.4" rx=".45" ry="2.16" fill="var(--color-art-green-19)" />
        <circle cx="-19.2" cy=".06" r=".75" fill="var(--color-art-green-24)" />
        <circle cx="-18.4" cy="-.42" r=".96" fill="var(--color-art-green-24)" />
        <circle cx="-17.6" cy=".09" r=".69" fill="var(--color-art-green-24)" />
        <circle cx="-19.4" cy="-.16" r=".41" fill="var(--color-art-green-15)" />
        <circle cx="-18.6" cy="-.71" r=".53" fill="var(--color-art-green-15)" />
        <circle cx="-17.8" cy="-.12" r=".38" fill="var(--color-art-green-15)" />
        <circle cx="-11.2" cy=".05" r=".63" fill="var(--color-art-green-24)" />
        <circle cx="-10.6" cy="-.35" r=".8" fill="var(--color-art-green-24)" />
        <circle cx="-9.92" cy=".07" r=".57" fill="var(--color-art-green-24)" />
        <circle cx="-11.4" cy="-.14" r=".34" fill="var(--color-art-green-15)" />
        <circle cx="-10.8" cy="-.59" r=".44" fill="var(--color-art-green-15)" />
        <circle cx="-10.1" cy="-.1" r=".32" fill="var(--color-art-green-15)" />
        <circle cx="-6.18" cy=".05" r=".56" fill="var(--color-art-green-24)" />
        <circle cx="-5.6" cy="-.32" r=".72" fill="var(--color-art-green-24)" />
        <circle cx="-4.99" cy=".07" r=".52" fill="var(--color-art-green-24)" />
        <circle cx="-6.33" cy="-.12" r=".31" fill="var(--color-art-green-15)" />
        <circle cx="-5.78" cy="-.53" r=".4" fill="var(--color-art-green-15)" />
        <circle cx="-5.12" cy="-.09" r=".28" fill="var(--color-art-green-15)" />
        <circle cx="7.95" cy=".05" r=".63" fill="var(--color-art-green-24)" />
        <circle cx="8.6" cy="-.35" r=".8" fill="var(--color-art-green-24)" />
        <circle cx="9.28" cy=".07" r=".57" fill="var(--color-art-green-24)" />
        <circle cx="7.79" cy="-.14" r=".34" fill="var(--color-art-green-15)" />
        <circle cx="8.4" cy="-.59" r=".44" fill="var(--color-art-green-15)" />
        <circle cx="9.13" cy="-.1" r=".32" fill="var(--color-art-green-15)" />
        <circle cx="12.9" cy=".06" r=".69" fill="var(--color-art-green-24)" />
        <circle cx="13.6" cy="-.39" r=".88" fill="var(--color-art-green-24)" />
        <circle cx="14.3" cy=".08" r=".63" fill="var(--color-art-green-24)" />
        <circle cx="12.7" cy="-.15" r=".38" fill="var(--color-art-green-15)" />
        <circle cx="13.4" cy="-.65" r=".48" fill="var(--color-art-green-15)" />
        <circle cx="14.2" cy="-.11" r=".35" fill="var(--color-art-green-15)" />
        <circle cx="21.8" cy=".07" r=".81" fill="var(--color-art-green-24)" />
        <circle cx="22.6" cy="-.45" r="1.04" fill="var(--color-art-green-24)" />
        <circle cx="23.5" cy=".1" r=".75" fill="var(--color-art-green-24)" />
        <circle cx="21.6" cy="-.18" r=".45" fill="var(--color-art-green-15)" />
        <circle cx="22.3" cy="-.77" r=".57" fill="var(--color-art-green-15)" />
        <circle cx="23.3" cy="-.13" r=".41" fill="var(--color-art-green-15)" />
      </g>
      <ellipse
        cx="37.7"
        cy="73.2"
        rx="1.36"
        ry=".34"
        fill="var(--color-art-green-29)"
        fillOpacity="0.35"
      />
      <ellipse cx="37.5" cy="72.4" rx="1.16" ry=".76" fill="var(--color-art-orange-2)" />
      <ellipse cx="37.2" cy="72.1" rx=".68" ry=".32" fill="var(--color-art-orange-1)" />
      <circle cx="38.6" cy="72.2" r=".36" fill="var(--color-art-brown-33)" />
      <ellipse
        cx="42.9"
        cy="75"
        rx="1.44"
        ry=".36"
        fill="var(--color-art-green-29)"
        fillOpacity="0.35"
      />
      <ellipse cx="42.6" cy="74.2" rx="1.23" ry=".81" fill="var(--color-art-orange-2)" />
      <ellipse cx="42.3" cy="73.9" rx=".72" ry=".34" fill="var(--color-art-orange-1)" />
      <circle cx="43.8" cy="74" r=".38" fill="var(--color-art-brown-33)" />
      <ellipse
        cx="48"
        cy="73.3"
        rx="1.27"
        ry=".32"
        fill="var(--color-art-green-29)"
        fillOpacity="0.35"
      />
      <ellipse cx="47.8" cy="72.6" rx="1.09" ry=".71" fill="var(--color-art-orange-2)" />
      <ellipse cx="47.5" cy="72.3" rx=".64" ry=".3" fill="var(--color-art-orange-1)" />
      <circle cx="48.9" cy="72.5" r=".34" fill="var(--color-art-brown-33)" />
      <ellipse
        cx="64.2"
        cy="74.2"
        rx="1.36"
        ry=".34"
        fill="var(--color-art-green-29)"
        fillOpacity="0.35"
      />
      <ellipse cx="64" cy="73.4" rx="1.16" ry=".76" fill="var(--color-art-orange-2)" />
      <ellipse cx="63.7" cy="73.1" rx=".68" ry=".32" fill="var(--color-art-orange-1)" />
      <circle cx="65.1" cy="73.2" r=".36" fill="var(--color-art-brown-33)" />
      <ellipse
        cx="69.6"
        cy="72.7"
        rx="1.22"
        ry=".3"
        fill="var(--color-art-green-29)"
        fillOpacity="0.35"
      />
      <ellipse cx="69.4" cy="72" rx="1.04" ry=".68" fill="var(--color-art-orange-2)" />
      <ellipse cx="69.1" cy="71.7" rx=".61" ry=".29" fill="var(--color-art-orange-1)" />
      <circle cx="70.4" cy="71.9" r=".32" fill="var(--color-art-brown-33)" />
      <ellipse
        cx="73.3"
        cy="75.9"
        rx="1.53"
        ry=".38"
        fill="var(--color-art-green-29)"
        fillOpacity="0.35"
      />
      <ellipse cx="73" cy="75" rx="1.3" ry=".85" fill="var(--color-art-orange-2)" />
      <ellipse cx="72.7" cy="74.7" rx=".77" ry=".36" fill="var(--color-art-orange-1)" />
      <circle cx="74.3" cy="74.8" r=".41" fill="var(--color-art-brown-33)" />
      <ellipse
        cx="40.3"
        cy="78.5"
        rx="1.61"
        ry=".4"
        fill="var(--color-art-green-29)"
        fillOpacity="0.35"
      />
      <ellipse cx="40" cy="77.6" rx="1.38" ry=".9" fill="var(--color-art-orange-2)" />
      <ellipse cx="39.7" cy="77.3" rx=".81" ry=".38" fill="var(--color-art-orange-1)" />
      <circle cx="41.3" cy="77.4" r=".43" fill="var(--color-art-brown-33)" />
      <path d="M-5 78C12 74.5 30 75 46 80C52 82 56 86 58 92V120H-5Z" fill={`url(#${id}s0front)`} />
      <rect x="5.55" y="76.3" width=".9" height="3.28" fill="var(--color-art-brown-27)" />
      <circle cx="6" cy="74.7" r="3.6" fill="var(--color-art-green-20)" />
      <circle cx="4.92" cy="73.6" r="1.98" fill="var(--color-art-green-14)" />
      <rect x="11.2" y="76.5" width=".9" height="2.32" fill="var(--color-art-brown-27)" />
      <circle cx="11.6" cy="75.4" r="2.4" fill="var(--color-art-green-20)" />
      <circle cx="10.9" cy="74.7" r="1.32" fill="var(--color-art-green-14)" />
      <path d="M30 120C38 98 56 83 78 79C90 77 98 77.2 105 78V120Z" fill={`url(#${id}s0grain)`} />
      <path
        d="M30 120C38 98 56 83 78 79C90 77 98 77.2 105 78"
        fill="none"
        stroke="var(--color-art-orange-11)"
        strokeOpacity="0.5"
        strokeWidth=".55"
      />
      <path
        d="M102.5,83.3l-.21 -1.61"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".3"
      />
      <ellipse
        cx="102.2"
        cy="81.4"
        rx=".32"
        ry=".72"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 102.2 81.4)"
      />
      <path
        d="M99.5,83.5l-.21 -1.61"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".3"
      />
      <ellipse
        cx="99.2"
        cy="81.7"
        rx=".32"
        ry=".72"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 99.2 81.7)"
      />
      <path
        d="M96.5,83.8l-.21 -1.61"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".3"
      />
      <ellipse
        cx="96.2"
        cy="81.9"
        rx=".32"
        ry=".72"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 96.2 81.9)"
      />
      <path
        d="M93.5,84l-.21 -1.61"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".3"
      />
      <ellipse
        cx="93.2"
        cy="82.1"
        rx=".32"
        ry=".72"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 93.2 82.1)"
      />
      <path
        d="M90.5,84.1l-.21 -1.61"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".3"
      />
      <ellipse
        cx="90.2"
        cy="82.2"
        rx=".32"
        ry=".72"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 90.2 82.2)"
      />
      <path
        d="M87.5,84.2l-.21 -1.61"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".3"
      />
      <ellipse
        cx="87.2"
        cy="82.4"
        rx=".32"
        ry=".72"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 87.2 82.4)"
      />
      <path
        d="M84.5,84.4l-.21 -1.61"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".3"
      />
      <ellipse
        cx="84.2"
        cy="82.5"
        rx=".32"
        ry=".72"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 84.2 82.5)"
      />
      <path
        d="M81.5,84.4l-.21 -1.61"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".3"
      />
      <ellipse
        cx="81.2"
        cy="82.6"
        rx=".32"
        ry=".72"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 81.2 82.6)"
      />
      <path
        d="M78.5,84.5l-.21 -1.61"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".3"
      />
      <ellipse
        cx="78.2"
        cy="82.6"
        rx=".32"
        ry=".72"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 78.2 82.6)"
      />
      <path
        d="M75.5,84.5l-.21 -1.61"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".3"
      />
      <ellipse
        cx="75.2"
        cy="82.6"
        rx=".32"
        ry=".72"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 75.2 82.6)"
      />
      <path
        d="M72.5,84.5l-.21 -1.61"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".3"
      />
      <ellipse
        cx="72.2"
        cy="82.6"
        rx=".32"
        ry=".72"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 72.2 82.6)"
      />
      <path
        d="M69.5,84.5l-.21 -1.61"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".3"
      />
      <ellipse
        cx="69.2"
        cy="82.6"
        rx=".32"
        ry=".72"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 69.2 82.6)"
      />
      <path
        d="M104,88.2l-.25 -1.9"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".35"
      />
      <ellipse
        cx="103.7"
        cy="86"
        rx=".38"
        ry=".85"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 103.7 86)"
      />
      <path
        d="M100.5,88.5l-.25 -1.9"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".35"
      />
      <ellipse
        cx="100.2"
        cy="86.3"
        rx=".38"
        ry=".85"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 100.2 86.3)"
      />
      <path
        d="M97,88.7l-.25 -1.9"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".35"
      />
      <ellipse
        cx="96.7"
        cy="86.5"
        rx=".38"
        ry=".85"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 96.7 86.5)"
      />
      <path
        d="M93.5,89l-.25 -1.9"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".35"
      />
      <ellipse
        cx="93.2"
        cy="86.8"
        rx=".38"
        ry=".85"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 93.2 86.8)"
      />
      <path
        d="M90,89.1l-.25 -1.9"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".35"
      />
      <ellipse
        cx="89.7"
        cy="86.9"
        rx=".38"
        ry=".85"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 89.7 86.9)"
      />
      <path
        d="M86.5,89.3l-.25 -1.9"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".35"
      />
      <ellipse
        cx="86.2"
        cy="87.1"
        rx=".38"
        ry=".85"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 86.2 87.1)"
      />
      <path
        d="M83,89.4l-.25 -1.9"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".35"
      />
      <ellipse
        cx="82.7"
        cy="87.2"
        rx=".38"
        ry=".85"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 82.7 87.2)"
      />
      <path
        d="M79.5,89.5l-.25 -1.9"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".35"
      />
      <ellipse
        cx="79.2"
        cy="87.3"
        rx=".38"
        ry=".85"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 79.2 87.3)"
      />
      <path
        d="M76,89.5l-.25 -1.9"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".35"
      />
      <ellipse
        cx="75.7"
        cy="87.3"
        rx=".38"
        ry=".85"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 75.7 87.3)"
      />
      <path
        d="M72.5,89.5l-.25 -1.9"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".35"
      />
      <ellipse
        cx="72.2"
        cy="87.3"
        rx=".38"
        ry=".85"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 72.2 87.3)"
      />
      <path
        d="M69,89.4l-.25 -1.9"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".35"
      />
      <ellipse
        cx="68.7"
        cy="87.2"
        rx=".38"
        ry=".85"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 68.7 87.2)"
      />
      <path
        d="M65.5,89.4l-.25 -1.9"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".35"
      />
      <ellipse
        cx="65.2"
        cy="87.2"
        rx=".38"
        ry=".85"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 65.2 87.2)"
      />
      <path
        d="M62,89.2l-.25 -1.9"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".35"
      />
      <ellipse
        cx="61.7"
        cy="87"
        rx=".38"
        ry=".85"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 61.7 87)"
      />
      <path
        d="M102,94.3l-.3 -2.28"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".42"
      />
      <ellipse
        cx="101.6"
        cy="91.7"
        rx=".46"
        ry="1.02"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 101.6 91.7)"
      />
      <path
        d="M97.8,94.7l-.3 -2.28"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".42"
      />
      <ellipse
        cx="97.5"
        cy="92"
        rx=".46"
        ry="1.02"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 97.5 92)"
      />
      <path
        d="M93.8,94.9l-.3 -2.28"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".42"
      />
      <ellipse
        cx="93.4"
        cy="92.3"
        rx=".46"
        ry="1.02"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 93.4 92.3)"
      />
      <path
        d="M89.7,95.2l-.3 -2.28"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".42"
      />
      <ellipse
        cx="89.3"
        cy="92.5"
        rx=".46"
        ry="1.02"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 89.3 92.5)"
      />
      <path
        d="M85.5,95.3l-.3 -2.28"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".42"
      />
      <ellipse
        cx="85.2"
        cy="92.7"
        rx=".46"
        ry="1.02"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 85.2 92.7)"
      />
      <path
        d="M81.5,95.4l-.3 -2.28"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".42"
      />
      <ellipse
        cx="81.1"
        cy="92.8"
        rx=".46"
        ry="1.02"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 81.1 92.8)"
      />
      <path
        d="M77.3,95.5l-.3 -2.28"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".42"
      />
      <ellipse
        cx="77"
        cy="92.8"
        rx=".46"
        ry="1.02"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 77 92.8)"
      />
      <path
        d="M73.2,95.5l-.3 -2.28"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".42"
      />
      <ellipse
        cx="72.9"
        cy="92.9"
        rx=".46"
        ry="1.02"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 72.9 92.9)"
      />
      <path
        d="M69.2,95.5l-.3 -2.28"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".42"
      />
      <ellipse
        cx="68.8"
        cy="92.8"
        rx=".46"
        ry="1.02"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 68.8 92.8)"
      />
      <path
        d="M65,95.3l-.3 -2.28"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".42"
      />
      <ellipse
        cx="64.7"
        cy="92.7"
        rx=".46"
        ry="1.02"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 64.7 92.7)"
      />
      <path
        d="M61,95.2l-.3 -2.28"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".42"
      />
      <ellipse
        cx="60.6"
        cy="92.5"
        rx=".46"
        ry="1.02"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 60.6 92.5)"
      />
      <path
        d="M56.9,95l-.3 -2.28"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".42"
      />
      <ellipse
        cx="56.5"
        cy="92.3"
        rx=".46"
        ry="1.02"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 56.5 92.3)"
      />
      <path
        d="M52.8,94.7l-.3 -2.28"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".42"
      />
      <ellipse
        cx="52.4"
        cy="92.1"
        rx=".46"
        ry="1.02"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 52.4 92.1)"
      />
      <path
        d="M104,101.2l-.35 -2.66"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".49"
      />
      <ellipse
        cx="103.6"
        cy="98.1"
        rx=".53"
        ry="1.19"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 103.6 98.1)"
      />
      <path
        d="M99.2,101.6l-.35 -2.66"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".49"
      />
      <ellipse
        cx="98.8"
        cy="98.5"
        rx=".53"
        ry="1.19"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 98.8 98.5)"
      />
      <path
        d="M94.4,101.9l-.35 -2.66"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".49"
      />
      <ellipse
        cx="94"
        cy="98.8"
        rx=".53"
        ry="1.19"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 94 98.8)"
      />
      <path
        d="M89.6,102.2l-.35 -2.66"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".49"
      />
      <ellipse
        cx="89.2"
        cy="99.1"
        rx=".53"
        ry="1.19"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 89.2 99.1)"
      />
      <path
        d="M84.8,102.3l-.35 -2.66"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".49"
      />
      <ellipse
        cx="84.4"
        cy="99.3"
        rx=".53"
        ry="1.19"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 84.4 99.3)"
      />
      <path
        d="M80,102.5l-.35 -2.66"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".49"
      />
      <ellipse
        cx="79.6"
        cy="99.4"
        rx=".53"
        ry="1.19"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 79.6 99.4)"
      />
      <path
        d="M75.2,102.5l-.35 -2.66"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".49"
      />
      <ellipse
        cx="74.8"
        cy="99.4"
        rx=".53"
        ry="1.19"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 74.8 99.4)"
      />
      <path
        d="M70.4,102.5l-.35 -2.66"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".49"
      />
      <ellipse
        cx="70"
        cy="99.4"
        rx=".53"
        ry="1.19"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 70 99.4)"
      />
      <path
        d="M65.6,102.4l-.35 -2.66"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".49"
      />
      <ellipse
        cx="65.2"
        cy="99.3"
        rx=".53"
        ry="1.19"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 65.2 99.3)"
      />
      <path
        d="M60.8,102.2l-.35 -2.66"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".49"
      />
      <ellipse
        cx="60.4"
        cy="99.1"
        rx=".53"
        ry="1.19"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 60.4 99.1)"
      />
      <path
        d="M56,101.9l-.35 -2.66"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".49"
      />
      <ellipse
        cx="55.6"
        cy="98.8"
        rx=".53"
        ry="1.19"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 55.6 98.8)"
      />
      <path
        d="M51.2,101.6l-.35 -2.66"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".49"
      />
      <ellipse
        cx="50.8"
        cy="98.5"
        rx=".53"
        ry="1.19"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 50.8 98.5)"
      />
      <path
        d="M46.4,101.2l-.35 -2.66"
        stroke="var(--color-art-brown-10)"
        strokeOpacity="0.55"
        strokeWidth=".49"
      />
      <ellipse
        cx="46"
        cy="98.1"
        rx=".53"
        ry="1.19"
        fill="var(--color-art-yellow-18)"
        fillOpacity="0.85"
        transform="rotate(-8 46 98.1)"
      />
      <rect x="97" y="76.6" width=".9" height="2.16" fill="var(--color-art-brown-27)" />
      <circle cx="97.5" cy="75.7" r="2.2" fill="var(--color-art-green-20)" />
      <circle cx="96.8" cy="75" r="1.21" fill="var(--color-art-green-14)" />
      <rect x="-10" y="78" width="120" height="40" fill={`url(#${id}s0vig)`} />
    </svg>
  );
}
