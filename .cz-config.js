'use strict';

var packageScopes = [
  'devtool',
  'dom',
  'history',
  'http',
  'isolate',
  'jsonp',
  'most-adapter',
  'most-run',
  'run',
  'rx-adapter',
  'rx-run',
  'rxjs-adapter',
  'rxjs-run',
  'xstream-adapter',
  'xstream-run'
];

var otherScopes = [
  'META',
  'examples'
];

module.exports = {
  types: [
    {value: 'feat',     name: 'feat:     Add a new feature'},
    {value: 'fix',      name: 'fix:      Submit a bug fix'},
    {value: 'refactor', name: 'refactor: A code change that neither fixes a bug nor adds a feature.\n            Includes code style changes.'},
    {value: 'test',     name: 'test:     Add tests only'},
    {value: 'docs',     name: 'docs:     Documentation only changes'},
    {value: 'release',  name: 'release:  Publish a new version of a package.'},
    {value: 'chore',    name: 'chore:    Changes to the build process or auxiliary tools\n            and libraries such as documentation generation. META only.'},
    {value: 'perf',     name: 'perf:     A code change that improves performance'},
  ],

  scopes: packageScopes.concat(otherScopes)
    .sort()
    .map(name => ({name})),

  scopeOverrides: {
    chore: [
      {name: 'META'},
    ],
    feat: packageScopes,
    fix: packageScopes,
    release: packageScopes,
    test: packageScopes,
  },

  allowCustomScopes: false,
  allowBreakingChanges: ['feat', 'fix'],
};
