// Stylelint-Regeln (Entwicklungsrichtlinien 13): Farbwerte nur in tokens.css (NFA-GB-05),
// keine CSS-Animationen (Architektur 13.6).
const COLOR_MESSAGE =
  'Farbwerte nur in src/ui/styles/tokens.css; hier var(--…) nutzen (NFA-GB-05).';
const ANIMATION_MESSAGE = 'Keine CSS-Animationen; Animationen nur über Motion (Architektur 13.6).';

/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: ['dist/**', 'coverage/**', 'playwright-report/**', 'test-results/**'],
  rules: {
    'color-no-hex': [true, { message: COLOR_MESSAGE }],
    'color-named': ['never', { message: COLOR_MESSAGE }],
    'function-disallowed-list': [
      ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color', 'color-mix'],
      { message: COLOR_MESSAGE },
    ],
    'property-disallowed-list': [['/^animation/', '/^transition/'], { message: ANIMATION_MESSAGE }],
    'at-rule-disallowed-list': [['keyframes'], { message: ANIMATION_MESSAGE }],
    // CSS Modules: Klassennamen in camelCase, Pseudoklassen :global und :local
    'selector-class-pattern': [
      '^[a-z][a-zA-Z0-9]*$',
      { message: 'Klassennamen in CSS Modules in camelCase.' },
    ],
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global', 'local'] }],
  },
  overrides: [
    {
      files: ['src/ui/styles/tokens.css'],
      rules: {
        'color-no-hex': null,
        'color-named': null,
        'function-disallowed-list': null,
      },
    },
  ],
};
