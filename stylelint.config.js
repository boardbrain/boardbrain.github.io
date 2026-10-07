// Stylelint rules (Development Guidelines 13): colour values only in tokens.css (NFA-GB-05),
// no CSS animations (Architecture 13.6).
const COLOR_MESSAGE =
  'Colour values only in src/ui/styles/tokens.css; use var(--…) here (NFA-GB-05).';
const ANIMATION_MESSAGE = 'No CSS animations; animations only via Motion (Architecture 13.6).';

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
    // CSS Modules: class names in camelCase, pseudo-classes :global and :local
    'selector-class-pattern': [
      '^[a-z][a-zA-Z0-9]*$',
      { message: 'Class names in CSS Modules use camelCase.' },
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
