// Pull request titles follow Conventional Commits (Development Guidelines 3.3, ADR-023).
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
    // German descriptions may start with a noun ("Gebäude zufällig platzieren").
    'subject-case': [0],
    'header-max-length': [2, 'always', 72],
    // Scopes are not checked against a list (Development Guidelines 3.3).
    'scope-enum': [0],
  },
};
