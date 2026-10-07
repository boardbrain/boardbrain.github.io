// ESLint rules for BoardBrain (Development Guidelines chapter 13).
// Rules that apply only to certain folders are scoped per folder. Because a later setting of
// the same rule replaces the earlier one, the lists for no-restricted-globals,
// no-restricted-properties and no-restricted-syntax are assembled completely per area.
import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import prettier from 'eslint-config-prettier';
import checkFile from 'eslint-plugin-check-file';
import jsdoc from 'eslint-plugin-jsdoc';
import reactHooks from 'eslint-plugin-react-hooks';
import testingLibrary from 'eslint-plugin-testing-library';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const TS_FILES = ['**/*.{ts,tsx}'];
const JS_FILES = ['**/*.{js,cjs,mjs}'];
const TEST_FILES = ['**/*.test.{ts,tsx}', 'tests/**/*.{ts,tsx}'];
const CONFIG_FILES = ['*.config.{js,ts}', '.dependency-cruiser.cjs'];

// ---------------------------------------------------------------------------------------
// Building blocks for restricted globals, properties and syntax
// ---------------------------------------------------------------------------------------

const NETWORK_GLOBALS = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource'].map((name) => ({
  name,
  message: 'Network access only in the service worker and infra/update (NFA-DH-01).',
}));

const CRYPTO_GLOBAL = {
  name: 'crypto',
  message:
    'crypto only in infra: randomness via RandomSource, identifiers via infra (NFA-ZF-01, NFA-DH-05).',
};

const BROWSER_GLOBALS = [
  'window',
  'document',
  'navigator',
  'location',
  'history',
  'indexedDB',
  'localStorage',
  'sessionStorage',
  'matchMedia',
  'self',
].map((name) => ({
  name,
  message: 'No browser APIs in core and games (Architecture 4.2).',
}));

const MATH_RANDOM = {
  object: 'Math',
  property: 'random',
  message: 'Math.random is forbidden. Randomness only via RandomSource (NFA-ZF-01).',
};
const GET_RANDOM_VALUES = {
  object: 'crypto',
  property: 'getRandomValues',
  message: 'crypto.getRandomValues only in infra/random (NFA-ZF-01).',
};
const RANDOM_UUID = {
  object: 'crypto',
  property: 'randomUUID',
  message: 'crypto.randomUUID only in infra (NFA-DH-05).',
};
const SEND_BEACON = {
  object: 'navigator',
  property: 'sendBeacon',
  message: 'Network access only in the service worker and infra/update (NFA-DH-01).',
};

const COLOR_PATTERN = String.raw`^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$`;
const COLOR_FUNCTION_PATTERN = String.raw`(?:^|[\s,(])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(`;
const COLOR_MESSAGE =
  'Colour values only in src/ui/styles/tokens.css; use var(--…) in code (NFA-GB-05).';

const BASE_SYNTAX = [
  {
    selector: 'ExportDefaultDeclaration',
    message: 'Named exports only (Development Guidelines 4.5).',
  },
  {
    selector: 'TSEnumDeclaration',
    message: 'No enum; use a union of string literals (Development Guidelines 4.1).',
  },
  { selector: `Literal[value=/${COLOR_PATTERN}/]`, message: COLOR_MESSAGE },
  { selector: `Literal[value=/${COLOR_FUNCTION_PATTERN}/i]`, message: COLOR_MESSAGE },
  {
    selector: `TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b|${COLOR_FUNCTION_PATTERN}/i]`,
    message: COLOR_MESSAGE,
  },
  {
    selector: 'AssignmentExpression[left.property.name=/^(?:innerHTML|outerHTML)$/]',
    message: 'No assignment to innerHTML/outerHTML (Development Guidelines 9).',
  },
  {
    selector: 'CallExpression[callee.property.name="insertAdjacentHTML"]',
    message: 'No insertAdjacentHTML (Development Guidelines 9).',
  },
];

// Replacement for eslint-plugin-react (Architecture 13.3, ADR-026, Development Guidelines 6 and 9).
const TEXT_ATTRIBUTES = String.raw`^(?:title|placeholder|alt|aria-label|aria-description|aria-placeholder|aria-roledescription|aria-valuetext)$`;
const JSX_TEXT_MESSAGE = 'No hard-coded text in JSX; use t() with src/i18n/de.ts (NFA-I18N-02).';
const JSX_SYNTAX = [
  { selector: String.raw`JSXText[value=/\S/]`, message: JSX_TEXT_MESSAGE },
  {
    selector: String.raw`JSXElement > JSXExpressionContainer > Literal[raw=/^['"]/]`,
    message: JSX_TEXT_MESSAGE,
  },
  { selector: 'JSXElement > JSXExpressionContainer > TemplateLiteral', message: JSX_TEXT_MESSAGE },
  { selector: `JSXAttribute[name.name=/${TEXT_ATTRIBUTES}/] > Literal`, message: JSX_TEXT_MESSAGE },
  {
    selector: `JSXAttribute[name.name=/${TEXT_ATTRIBUTES}/] > JSXExpressionContainer > :matches(Literal[raw=/^['"]/], TemplateLiteral)`,
    message: JSX_TEXT_MESSAGE,
  },
  {
    selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
    message: 'No dangerouslySetInnerHTML (Development Guidelines 9).',
  },
  {
    selector: String.raw`JSXAttribute[name.name="key"] Identifier[name=/^(?:i|idx|index)$/]`,
    message: 'List keys are stable identifiers, never the index (Development Guidelines 6).',
  },
  {
    selector: String.raw`ClassDeclaration[superClass.name=/^(?:Component|PureComponent)$/], ClassDeclaration[superClass.property.name=/^(?:Component|PureComponent)$/]`,
    message:
      'Function components only; the single exception is ErrorBoundary (Development Guidelines 6).',
  },
];

/**
 * Rules for one area of the repository.
 * @param {{ browser?: boolean, crypto?: boolean, getRandomValues?: boolean, randomUUID?: boolean, network?: boolean }} allowed
 */
function areaRules(allowed) {
  const globalsList = [
    ...(allowed.browser === false ? BROWSER_GLOBALS : []),
    ...(allowed.crypto ? [] : [CRYPTO_GLOBAL]),
    ...(allowed.network ? [] : NETWORK_GLOBALS),
  ];
  const properties = [
    MATH_RANDOM,
    ...(allowed.getRandomValues ? [] : [GET_RANDOM_VALUES]),
    ...(allowed.randomUUID ? [] : [RANDOM_UUID]),
    ...(allowed.network ? [] : [SEND_BEACON]),
  ];
  return {
    'no-restricted-globals': ['error', ...globalsList],
    'no-restricted-properties': ['error', ...properties],
  };
}

const AREAS = [
  {
    name: 'core-games',
    files: ['src/core/**', 'src/games/**'],
    allowed: { browser: false },
  },
  {
    name: 'infra-random',
    files: ['src/infra/random/**'],
    allowed: { crypto: true, getRandomValues: true, randomUUID: true },
  },
  {
    name: 'infra-update',
    files: ['src/infra/update/**'],
    allowed: { crypto: true, randomUUID: true, network: true },
  },
  {
    name: 'infra',
    files: ['src/infra/**'],
    ignores: ['src/infra/random/**', 'src/infra/update/**'],
    allowed: { crypto: true, randomUUID: true },
  },
  { name: 'sw', files: ['src/sw/**'], allowed: { network: true } },
  {
    name: 'statistical',
    files: ['tests/statistical/**'],
    allowed: { crypto: true, getRandomValues: true, randomUUID: true },
  },
];
const AREA_FILES = AREAS.flatMap((area) => area.files);

export default defineConfig([
  globalIgnores([
    'dist/',
    'coverage/',
    'playwright-report/',
    'test-results/',
    'blob-report/',
    'docs/',
  ]),

  // Base rules for all files
  js.configs.recommended,
  {
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: 'error',
      'no-restricted-syntax': ['error', ...BASE_SYNTAX],
    },
  },

  // TypeScript with type information (Development Guidelines 4.1)
  {
    files: TS_FILES,
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/only-throw-error': 'error',
      '@typescript-eslint/no-implied-eval': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'import', format: ['camelCase', 'PascalCase'] },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allowDouble',
          trailingUnderscore: 'allowDouble',
        },
        {
          selector: ['variable', 'parameter'],
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: ['is', 'has', 'can', 'should'],
        },
        { selector: 'variable', modifiers: ['destructured'], format: null },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'typeParameter', format: ['PascalCase'] },
        { selector: ['objectLiteralProperty', 'objectLiteralMethod'], format: null },
        { selector: 'typeProperty', format: ['camelCase'] },
        { selector: 'typeProperty', modifiers: ['requiresQuotes'], format: null },
      ],
    },
  },

  // JavaScript configuration files: without type information, Node environment
  {
    files: JS_FILES,
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },

  // Configuration files require a default export
  {
    files: CONFIG_FILES,
    rules: {
      'no-restricted-syntax': [
        'error',
        ...BASE_SYNTAX.filter((rule) => rule.selector !== 'ExportDefaultDeclaration'),
      ],
    },
  },

  // Areas with restricted globals and properties (Development Guidelines 5)
  ...AREAS.map((area) => ({
    name: `boardbrain/area-${area.name}`,
    files: area.files,
    ...(area.ignores ? { ignores: area.ignores } : {}),
    rules: areaRules(area.allowed),
  })),
  {
    name: 'boardbrain/area-rest',
    files: [...TS_FILES, ...JS_FILES],
    ignores: AREA_FILES,
    rules: areaRules({}),
  },

  // UI: React, hooks and compiler, replacement rules for eslint-plugin-react
  {
    files: ['src/**/*.tsx'],
    ignores: TEST_FILES,
    extends: [reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
    rules: {
      'no-restricted-syntax': ['error', ...BASE_SYNTAX, ...JSX_SYNTAX],
    },
  },
  {
    files: ['src/ui/components/ErrorBoundary.tsx'],
    rules: {
      'no-restricted-syntax': ['error', ...BASE_SYNTAX, ...JSX_SYNTAX.slice(0, -1)],
    },
  },

  // Imports: alias @/ across module boundaries (Development Guidelines 4.5)
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../*'],
              message: 'Import across module boundaries with the @/ alias.',
            },
            { group: ['src/*', '/src/*'], message: 'Use the @/ alias instead of src/.' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/core/*/*.ts', 'src/games/*/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*'],
              message:
                'Import other modules only through their index.ts with the @/ alias (Development Guidelines 4.5).',
            },
          ],
        },
      ],
    },
  },

  // Doc comments on exports in core, games, app (Development Guidelines 4.6)
  {
    files: ['src/core/**/*.ts', 'src/games/**/*.ts', 'src/app/**/*.ts'],
    ignores: TEST_FILES,
    plugins: { jsdoc },
    rules: {
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: true,
            FunctionExpression: true,
          },
          contexts: [
            'TSTypeAliasDeclaration',
            'TSInterfaceDeclaration',
            'ExportNamedDeclaration > VariableDeclaration',
          ],
        },
      ],
      'jsdoc/no-blank-blocks': 'error',
    },
  },

  // File and folder names (Development Guidelines 4.4)
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        {
          'src/**/!(main).tsx': 'PASCAL_CASE',
          'src/**/!(*.d).ts': 'CAMEL_CASE',
          'tests/**/*.ts': 'CAMEL_CASE',
        },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': [
        'error',
        { 'src/**/': 'KEBAB_CASE', 'tests/**/': 'KEBAB_CASE' },
      ],
    },
  },

  // Tests (Development Guidelines 8)
  {
    files: TEST_FILES,
    extends: [vitest.configs.recommended],
    rules: {
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'error',
      'vitest/expect-expect': ['error', { assertFunctionNames: ['expect', 'fc.assert'] }],
      // vitest/no-focused-tests only detects Vitest; this rule also catches test.only in Playwright.
      'no-restricted-syntax': [
        'error',
        ...BASE_SYNTAX,
        {
          selector: 'CallExpression > MemberExpression.callee[property.name="only"]',
          message: 'No .only in tests (Development Guidelines 8.2).',
        },
      ],
      // Type assertions are allowed in tests (Development Guidelines 4.1).
      '@typescript-eslint/consistent-type-assertions': 'off',
    },
  },
  {
    files: ['src/ui/**/*.test.{ts,tsx}'],
    extends: [testingLibrary.configs['flat/react']],
    languageOptions: { globals: globals.browser },
    rules: {
      // act is needed when a view waits for a promise with use().
      'testing-library/no-unnecessary-act': ['error', { isStrict: false }],
    },
  },

  // Prettier turns off conflicting formatting rules (ADR-024); must come last.
  prettier,
]);
