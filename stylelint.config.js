// Stylelint rules (Development Guidelines 13): colour values only in tokens.css (NFA-GB-05),
// no CSS animations (Architecture 13.6).
const COLOR_MESSAGE =
  'Colour values only in src/ui/styles/tokens.css; use var(--…) here (NFA-GB-05).';
const ANIMATION_MESSAGE = 'No CSS animations; animations only via Motion (Architecture 13.6).';

/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: [
    'dist/**',
    'dist-acceptance/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    // Local design previews, not in the repository (.gitignore)
    'previews/**',
  ],
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
    // Safari on iOS ignores text-decoration with style and colour as one shorthand (PO 21.11.).
    'declaration-block-no-redundant-longhand-properties': [
      true,
      { ignoreShorthands: ['text-decoration'] },
    ],
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
    // K-4: the shimmer mixes the element's own text colour (currentcolor) with transparent and
    // depends on --press per element, so it cannot live in tokens.css. It adds no colour value.
    // The same for the timer: Motion moves a variable per element between two colour tokens, and
    // for the tabs, whose shimmer sits on the label instead of the button (design I3-C).
    {
      files: [
        'src/ui/components/Pressable.module.css',
        'src/ui/components/Tabs.module.css',
        'src/ui/views/match/ClockSheet.module.css',
        'src/ui/views/match/MatchClock.module.css',
      ],
      rules: {
        'function-disallowed-list': [
          ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'],
          { message: COLOR_MESSAGE },
        ],
      },
    },
  ],
};
