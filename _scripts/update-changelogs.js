#!/usr/bin/env node

var conventionalChangelog = require('conventional-changelog');
var fs = require('fs');

var theCommitThatStartedTheMonorepo = fs
  .readFileSync(__dirname + '/SEED_COMMIT', 'utf8')
  .trim();

var packagesWithChangelog = fs
  .readFileSync(__dirname + '/PACKAGES_WITH_CHANGELOG', 'utf8')
  .trim()
  .split('\n');

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