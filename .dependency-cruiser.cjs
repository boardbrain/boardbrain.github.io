// Schichten und Modulgrenzen (Architektur 4.1, 4.2; Entwicklungsrichtlinien 5).
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

// Tests dürfen Testwerkzeuge (Vitest, fast-check) importieren.
const TEST_FILE = String.raw`\.test\.tsx?$`;

// Entwicklungsrichtlinien 4.5: Andere Module importieren ein core-Modul nur über index.ts.
const coreIndexRules = CORE_MODULES.map((name) => ({
  name: `core-${name}-only-via-index`,
  severity: 'error',
  comment: `core/${name} nur über src/core/${name}/index.ts importieren (Entwicklungsrichtlinien 4.5).`,
  from: { pathNot: `^src/core/${name}/` },
  to: { path: `^src/core/${name}/`, pathNot: String.raw`^src/core/${name}/index\.ts$` },
}));

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Keine zirkulären Abhängigkeiten (Entwicklungsrichtlinien 4.5).',
      from: {},
      to: { circular: true },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      comment: 'Jeder Import muss auflösbar sein.',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'core-only-core',
      severity: 'error',
      comment:
        'core verwendet nur core; keine Bibliotheken wie React, Dexie oder Motion. Einzige Ausnahme: Valibot für Schemaprüfung (Architektur 4.2, ADR-012).',
      from: { path: '^src/core/', pathNot: TEST_FILE },
      to: { pathNot: ['^src/core/', '^node_modules/valibot/'] },
    },
    {
      name: 'games-only-core',
      severity: 'error',
      comment: 'games verwendet nur core (Architektur 4.2).',
      from: { path: '^src/games/', pathNot: TEST_FILE },
      to: { pathNot: ['^src/core/', '^src/games/'] },
    },
    {
      name: 'games-not-other-games',
      severity: 'error',
      comment: 'Spielmodule ändern keine anderen Spielmodule (NFA-EW-01).',
      from: { path: '^src/games/([^/]+)/' },
      to: { path: '^src/games/[^/]+/', pathNot: '^src/games/$1/' },
    },
    {
      name: 'app-not-ui-infra-sw',
      severity: 'error',
      comment:
        'app verwendet core, games und eigene Schnittstellen; infra nur über app/ports (Architektur 4.2).',
      from: { path: '^src/app/' },
      to: { path: '^src/(ui|infra|sw)/' },
    },
    {
      name: 'app-no-ui-libraries',
      severity: 'error',
      comment: 'Keine Oberflächen- oder Speicherbibliotheken in app (Architektur 4.2).',
      from: { path: '^src/app/' },
      to: {
        path: '^node_modules/(react|react-dom|react-router|motion|dexie|dexie-react-hooks|zustand)/',
      },
    },
    {
      name: 'infra-allowed-layers',
      severity: 'error',
      comment: 'infra verwendet core und app/ports, nicht ui, games oder sw (Architektur 4.2).',
      from: { path: '^src/infra/' },
      to: { path: ['^src/(ui|games|sw)/', '^src/app/(?!ports)'] },
    },
    {
      name: 'ui-not-sw',
      severity: 'error',
      comment: 'ui verwendet alle Schichten außer sw (Architektur 4.2).',
      from: { path: '^src/ui/' },
      to: { path: '^src/sw/' },
    },
    {
      name: 'sw-standalone',
      severity: 'error',
      comment: 'Der Service Worker ist eigenständig (Architektur 4.2, 11).',
      from: { path: '^src/sw/' },
      to: { path: '^src/', pathNot: '^src/sw/' },
    },
    {
      name: 'dexie-only-in-infra-db',
      severity: 'error',
      comment: 'Dexie nur in infra/db (Architektur 4.4, 7.3).',
      from: { pathNot: '^src/infra/db/' },
      to: { path: '^node_modules/dexie/' },
    },
    {
      name: 'motion-only-in-ui',
      severity: 'error',
      comment: 'Motion nur in der Oberfläche (Architektur 13.6).',
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
