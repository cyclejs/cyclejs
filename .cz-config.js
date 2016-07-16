'use strict';

module.exports = {
  types: [
    {value: 'feat',     name: 'feat:     Add a new feature'},
    {value: 'fix',      name: 'fix:      Submit a bug fix'},
    {value: 'refactor', name: 'refactor: A code change that neither fixes a bug nor adds a feature'},
    {value: 'test',     name: 'test:     Add tests only'},
    {value: 'docs',     name: 'docs:     Documentation only changes'},
    {value: 'release',  name: 'release:  Publish a new version of a package.'},
    {value: 'chore',    name: 'chore:    Changes to the build process or auxiliary tools\n            and libraries such as documentation generation. META only.'},
    {value: 'style',    name: 'style:    Changes that do not affect the meaning of the code\n            (white-space, formatting, missing semi-colons, etc)'},
    {value: 'perf',     name: 'perf:     A code change that improves performance'},
  ],

  scopes: [
    {name: 'META'},
    {name: 'base'},
    {name: 'devtool'},
    {name: 'dom'},
    {name: 'examples'},
    {name: 'http'},
    {name: 'isolate'},
    {name: 'jsonp'},
    {name: 'most-adapter'},
    {name: 'most-run'},
    {name: 'rx-adapter'},
    {name: 'rx-run'},
    {name: 'rxjs-adapter'},
    {name: 'rxjs-run'},
    {name: 'xstream-adapter'},
    {name: 'xstream-run'},
  ],

  scopeOverrides: {
    chore: [
      {name: 'META'},
    ]
  },

  allowCustomScopes: false,
  allowBreakingChanges: ['feat', 'fix'],
};
