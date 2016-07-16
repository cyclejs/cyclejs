#!/usr/bin/env node

var conventionalChangelog = require('conventional-changelog');
var fs = require('fs');

var theCommitThatStartedTheMonorepo = '998243f'; // or a32d44d98628e608f7010196cccbb3658a2adbdc

var packagesWithChangelog = [
  'base',
  'devtool',
  'dom',
  'http',
  'isolate',
  'jsonp',
  'most-adapter',
  'most-run',
  'rx-adapter',
  'rx-run',
  'rxjs-adapter',
  'rxjs-run',
  'xstream-adapter',
  'xstream-run',
];

packagesWithChangelog.forEach(function (package) {
  var writeStream = fs.createWriteStream('./' + package + '/CHANGELOG.md')
  conventionalChangelog({
    preset: 'angular',
    pkg: {
      path: './' + package + '/package.json',
    },
    transform: function (commit, cb) {
      if (commit.scope === package) {
        console.log(commit);
        cb(null, commit);
      } else {
        cb();
      }
    },
  }, {}, {from: theCommitThatStartedTheMonorepo})
    .pipe(writeStream); // or any writable strea
});