// ESLint-Regeln für BoardBrain (Entwicklungsrichtlinien Kapitel 13).
// Regeln, die nur für bestimmte Ordner gelten, sind ordnergenau gesetzt. Weil eine spätere
// Einstellung derselben Regel die frühere ersetzt, werden die Listen für
// no-restricted-globals, no-restricted-properties und no-restricted-syntax je Bereich
// vollständig zusammengesetzt.
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
// Bausteine für eingeschränkte Globale, Eigenschaften und Syntax
// ---------------------------------------------------------------------------------------

const NETWORK_GLOBALS = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource'].map((name) => ({
  name,
  message: 'Netzwerkzugriffe nur im Service Worker und in infra/update (NFA-DH-01).',
}));

const CRYPTO_GLOBAL = {
  name: 'crypto',
  message:
    'crypto nur in infra: Zufall über RandomSource, Kennungen über infra (NFA-ZF-01, NFA-DH-05).',
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
  message: 'Keine Browser-APIs in core und games (Architektur 4.2).',
}));

const MATH_RANDOM = {
  object: 'Math',
  property: 'random',
  message: 'Math.random ist verboten. Zufall nur über RandomSource (NFA-ZF-01).',
};
const GET_RANDOM_VALUES = {
  object: 'crypto',
  property: 'getRandomValues',
  message: 'crypto.getRandomValues nur in infra/random (NFA-ZF-01).',
};
const RANDOM_UUID = {
  object: 'crypto',
  property: 'randomUUID',
  message: 'crypto.randomUUID nur in infra (NFA-DH-05).',
};
const SEND_BEACON = {
  object: 'navigator',
  property: 'sendBeacon',
  message: 'Netzwerkzugriffe nur im Service Worker und in infra/update (NFA-DH-01).',
};

const COLOR_PATTERN = String.raw`^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$`;
const COLOR_FUNCTION_PATTERN = String.raw`(?:^|[\s,(])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(`;
const COLOR_MESSAGE =
  'Farbwerte nur in src/ui/styles/tokens.css; im Code var(--…) nutzen (NFA-GB-05).';

const BASE_SYNTAX = [
  {
    selector: 'ExportDefaultDeclaration',
    message: 'Nur benannte Exporte (Entwicklungsrichtlinien 4.5).',
  },
  {
    selector: 'TSEnumDeclaration',
    message: 'Keine enum; Vereinigung von Zeichenketten verwenden (Entwicklungsrichtlinien 4.1).',
  },
  { selector: `Literal[value=/${COLOR_PATTERN}/]`, message: COLOR_MESSAGE },
  { selector: `Literal[value=/${COLOR_FUNCTION_PATTERN}/i]`, message: COLOR_MESSAGE },
  {
    selector: `TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b|${COLOR_FUNCTION_PATTERN}/i]`,
    message: COLOR_MESSAGE,
  },
  {
    selector: 'AssignmentExpression[left.property.name=/^(?:innerHTML|outerHTML)$/]',
    message: 'Keine Zuweisung an innerHTML/outerHTML (Entwicklungsrichtlinien 9).',
  },
  {
    selector: 'CallExpression[callee.property.name="insertAdjacentHTML"]',
    message: 'Kein insertAdjacentHTML (Entwicklungsrichtlinien 9).',
  },
];

// Ersatz für eslint-plugin-react (Architektur 13.3, Entwicklungsrichtlinien 6 und 9).
const TEXT_ATTRIBUTES = String.raw`^(?:title|placeholder|alt|aria-label|aria-description|aria-placeholder|aria-roledescription|aria-valuetext)$`;
const JSX_TEXT_MESSAGE =
  'Keine festen Texte in JSX; Texte über t() aus src/i18n/de.ts (NFA-I18N-02).';
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
    message: 'Kein dangerouslySetInnerHTML (Entwicklungsrichtlinien 9).',
  },
  {
    selector: String.raw`JSXAttribute[name.name="key"] Identifier[name=/^(?:i|idx|index)$/]`,
    message: 'Listen-Keys sind stabile Kennungen, nie der Index (Entwicklungsrichtlinien 6).',
  },
  {
    selector: String.raw`ClassDeclaration[superClass.name=/^(?:Component|PureComponent)$/], ClassDeclaration[superClass.property.name=/^(?:Component|PureComponent)$/]`,
    message:
      'Nur Funktionskomponenten; einzige Ausnahme ist ErrorBoundary (Entwicklungsrichtlinien 6).',
  },
];

/**
 * Regeln für einen Bereich des Repositorys.
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

  // Grundregeln für alle Dateien
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

  // TypeScript mit Typinformationen (Entwicklungsrichtlinien 4.1)
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

  // JavaScript-Konfigurationsdateien: ohne Typinformationen, Node-Umgebung
  {
    files: JS_FILES,
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },

  // Konfigurationsdateien verlangen einen Standardexport
  {
    files: CONFIG_FILES,
    rules: {
      'no-restricted-syntax': [
        'error',
        ...BASE_SYNTAX.filter((rule) => rule.selector !== 'ExportDefaultDeclaration'),
      ],
    },
  },

  // Bereiche mit eingeschränkten Globalen und Eigenschaften (Entwicklungsrichtlinien 5)
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

  // Oberfläche: React, Hooks und Compiler, Ersatzregeln für eslint-plugin-react
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

  // Importe: Kurzpfad @/ über Modulgrenzen (Entwicklungsrichtlinien 4.5)
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../*'],
              message: 'Über Modulgrenzen mit dem Kurzpfad @/ importieren.',
            },
            { group: ['src/*', '/src/*'], message: 'Kurzpfad @/ statt src/ verwenden.' },
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
                'Andere Module nur über ihre index.ts mit dem Kurzpfad @/ importieren (Entwicklungsrichtlinien 4.5).',
            },
          ],
        },
      ],
    },
  },

  // Doku-Kommentare an Exporten in core, games, app (Entwicklungsrichtlinien 4.6)
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

  // Datei- und Ordnernamen (Entwicklungsrichtlinien 4.4)
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

  // Tests (Entwicklungsrichtlinien 8)
  {
    files: TEST_FILES,
    extends: [vitest.configs.recommended],
    rules: {
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'error',
      'vitest/expect-expect': ['error', { assertFunctionNames: ['expect', 'fc.assert'] }],
      // In Tests sind Typbehauptungen erlaubt (Entwicklungsrichtlinien 4.1).
      '@typescript-eslint/consistent-type-assertions': 'off',
    },
  },
  {
    files: ['src/ui/**/*.test.{ts,tsx}'],
    extends: [testingLibrary.configs['flat/react']],
    languageOptions: { globals: globals.browser },
    rules: {
      // act ist nötig, wenn eine Ansicht mit use() auf ein Promise wartet.
      'testing-library/no-unnecessary-act': ['error', { isStrict: false }],
    },
  },

  // Prettier schaltet kollidierende Formatregeln ab (ADR-024); muss am Ende stehen.
  prettier,
]);
