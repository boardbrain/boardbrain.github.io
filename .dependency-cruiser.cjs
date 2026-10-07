// Layers and module boundaries (Architecture 4.1, 4.2; Development Guidelines 5).
const CORE_MODULES = [
  'shared',
  'random',
  'model',
  'board',
  'placement',
  'draws',
  'generation',
  'results',
  'stats',
  'exchange',
  'backup',
];

// Tests may import test tools (Vitest, fast-check).
const TEST_FILE = String.raw`\.test\.tsx?$`;

// Development Guidelines 4.5: other modules import a core module only through index.ts.
const coreIndexRules = CORE_MODULES.map((name) => ({
  name: `core-${name}-only-via-index`,
  severity: 'error',
  comment: `Import core/${name} only through src/core/${name}/index.ts (Development Guidelines 4.5).`,
  from: { pathNot: `^src/core/${name}/` },
  to: { path: `^src/core/${name}/`, pathNot: String.raw`^src/core/${name}/index\.ts$` },
}));

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'No circular dependencies (Development Guidelines 4.5).',
      from: {},
      to: { circular: true },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      comment: 'Every import must be resolvable.',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'core-only-core',
      severity: 'error',
      comment:
        'core uses only core; no libraries such as React, Dexie or Motion. Single exception: Valibot for schema validation (Architecture 4.2, ADR-012).',
      from: { path: '^src/core/', pathNot: TEST_FILE },
      to: { pathNot: ['^src/core/', '^node_modules/valibot/'] },
    },
    {
      name: 'games-only-core',
      severity: 'error',
      comment: 'games uses only core (Architecture 4.2).',
      from: { path: '^src/games/', pathNot: TEST_FILE },
      to: { pathNot: ['^src/core/', '^src/games/'] },
    },
    {
      name: 'games-not-other-games',
      severity: 'error',
      comment: 'Game modules do not change other game modules (NFA-EW-01).',
      from: { path: '^src/games/([^/]+)/' },
      to: { path: '^src/games/[^/]+/', pathNot: '^src/games/$1/' },
    },
    {
      name: 'app-not-ui-infra-sw',
      severity: 'error',
      comment:
        'app uses core, games and its own interfaces; infra only via app/ports (Architecture 4.2).',
      from: { path: '^src/app/' },
      to: { path: '^src/(ui|infra|sw)/' },
    },
    {
      name: 'app-no-ui-libraries',
      severity: 'error',
      comment: 'No UI or storage libraries in app (Architecture 4.2).',
      from: { path: '^src/app/' },
      to: {
        path: '^node_modules/(react|react-dom|react-router|motion|dexie|dexie-react-hooks|zustand)/',
      },
    },
    {
      name: 'infra-allowed-layers',
      severity: 'error',
      comment: 'infra uses core and app/ports, not ui, games or sw (Architecture 4.2).',
      from: { path: '^src/infra/' },
      to: { path: ['^src/(ui|games|sw)/', '^src/app/(?!ports)'] },
    },
    {
      name: 'ui-not-sw',
      severity: 'error',
      comment: 'ui uses all layers except sw (Architecture 4.2).',
      from: { path: '^src/ui/' },
      to: { path: '^src/sw/' },
    },
    {
      name: 'sw-standalone',
      severity: 'error',
      comment: 'The service worker is standalone (Architecture 4.2, 11).',
      from: { path: '^src/sw/' },
      to: { path: '^src/', pathNot: '^src/sw/' },
    },
    {
      name: 'production-not-to-tests',
      severity: 'error',
      comment:
        'Deterministic random sources and other test helpers only in test code (NFA-ZF-01, Architecture 6.1).',
      from: { path: '^src/', pathNot: TEST_FILE },
      to: { path: '^tests/' },
    },
    {
      name: 'dexie-only-in-infra-db',
      severity: 'error',
      comment: 'Dexie only in infra/db (Architecture 4.4, 7.3).',
      from: { pathNot: '^src/infra/db/' },
      to: { path: '^node_modules/dexie/' },
    },
    {
      name: 'motion-only-in-ui',
      severity: 'error',
      comment: 'Motion only in the UI (Architecture 13.6).',
      from: { pathNot: '^src/ui/' },
      to: { path: '^node_modules/motion/' },
    },
    ...coreIndexRules,
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.tsx', '.js', '.d.ts'],
    },
  },
};
