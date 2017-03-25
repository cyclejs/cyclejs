#!/usr/bin/env node

var conventionalChangelog = require('conventional-changelog');
var addStream = require('add-stream');
var tempfile = require('tempfile');
var fs = require('fs');

var theCommitThatStartedTheMonorepo = fs
  .readFileSync(__dirname + '/SEED_COMMIT', 'utf8')
  .trim();

var packagesWithChangelog = fs
  .readFileSync(__dirname + '/RELEASABLE_PACKAGES', 'utf8')
  .trim()
  .split('\n');

var argPackage = process.argv[2];

// Assume that for each package we will start iterating from
// theCommitThatStartedTheMonorepo onwards.
var startCommits = {};
packagesWithChangelog.forEach(function (package) {
  startCommits[package] = theCommitThatStartedTheMonorepo;
});

// Update the startCommit for each package, looking for release commits
// for each package.
conventionalChangelog({
  preset: 'angular',
  append: true,
  transform: function (commit, cb) {
    if (commit.type === 'release') {
      startCommits[commit.scope] = commit.hash;
    }
    cb();
  }
}, {}, { from: theCommitThatStartedTheMonorepo, reverse: true })
  .on('end', runUpdateChangelogs).resume();

function runUpdateChangelogs() {
  packagesWithChangelog
    .filter(function (package) {
      if (typeof argPackage === 'string' && argPackage.length > 0) {
        return argPackage === package;
      } else {
        return true;
      }
    })
    .forEach(function (package) {
      console.log('updating changelog for package ' + package);
      var filename = __dirname + '/../' + package + '/CHANGELOG.md';
      var changelogOpts = {
        preset: 'angular',
        releaseCount: 0,
        pkg: {
          path: __dirname + '/../' + package + '/package.json',
        },
        transform: function (commit, cb) {
          if (commit.scope === package) {
            cb(null, commit);
          } else {
            cb();
          }
        },
      };
      var context = {host: 'https://github.com', repository: 'cyclejs/cyclejs'};
      var gitRawCommitsOpts = { from: startCommits[package] };

      var readStream = fs.createReadStream(filename);
      var tmp = tempfile();
      conventionalChangelog(changelogOpts, context, gitRawCommitsOpts)
        .pipe(addStream(readStream))
        .pipe(fs.createWriteStream(tmp))
        .on('finish', function () {
          fs.createReadStream(tmp)
            .pipe(fs.createWriteStream(filename));
        });
    })
}