'use strict';

var packageScopes = [
  'devtool',
  'dom',
  'html',
  'history',
  'http',
  'isolate',
  'most-run',
  'run',
  'rxjs-run',
  'state',
  'time',
];

var otherScopes = ['META', 'examples'];

module.exports = {
  types: [
    {value: 'feat', name: 'feat:     Add a new feature'},
    {value: 'fix', name: 'fix:      Submit a bug fix'},
    {value: 'docs', name: 'docs:     Documentation only changes'},
    {value: 'release', name: 'release:  Publish a new version of a package.'},
    {
      value: 'chore',
      name:
        'chore:    Any internal changes that do not affect the\n            ' +
        'the users of packages. Includes refactoring.',
    },
  ],

  scopes: packageScopes
    .concat(otherScopes)
    .sort()
    .map(name => ({name})),

  scopeOverrides: {
    chore: packageScopes.concat(otherScopes),
    feat: packageScopes,
    fix: packageScopes,
    release: packageScopes,
    test: packageScopes,
  },

  allowCustomScopes: false,
  allowBreakingChanges: ['feat', 'fix'],
};
