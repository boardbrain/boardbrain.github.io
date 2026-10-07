// Titel von Pull Requests nach Conventional Commits (Entwicklungsrichtlinien 3.3, ADR-023).
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'refactor',
        'test',
        'docs',
        'chore',
        'build',
        'ci',
        'deps',
        'release',
        'revert',
      ],
    ],
    // Deutsche Beschreibungen dürfen mit einem Substantiv beginnen („Gebäude zufällig platzieren“).
    'subject-case': [0],
    'header-max-length': [2, 'always', 72],
    // Bereiche werden nicht gegen eine Liste geprüft (Entwicklungsrichtlinien 3.3).
    'scope-enum': [0],
  },
};
