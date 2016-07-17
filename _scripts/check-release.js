#!/usr/bin/env node

/** This script checks whether each package should be released with
 * a new version according to semver. It has two modes: REPORT and ORACLE.
 *
 * It runs in REPORT mode if no additional command line argument was given.
 * For instance, `node check-release.js`. It will display a human readable
 * report on which packages should have new releases.
 *
 * It runs in ORACLE mode is an argument was provided, e.g.,
 * `node check-release.js xstream-run`,
 * it will exit with a status code answering whether the `xstream-run`
 * package should be released with a new version.
 * 0 means no new release is necessary
 * 1 means it should have a new patch version _._.x release
 * 2 means it should have a new minor version _.x._ release
 * 3 means it should have a new major version x._._ release
 */

var conventionalChangelog = require('conventional-changelog');
var fs = require('fs');

var theCommitThatStartedTheMonorepo = '998243f'; // or a32d44d98628e608f7010196cccbb3658a2adbdc

var packagesWithChangelog = fs
  .readFileSync(__dirname + '/packages-with-changelog', 'utf8')
  .trim()
  .split('\n');

var status = {};
packagesWithChangelog.forEach(function (package) {
  status[package] = {
    increment: 0, // 0 = nothing, 1 = patch, 2 = minor, 3 = major
    commits: [],
  };
});

function incrementName(code) {
  if (code === 1) {
    return 'patch';
  } else if (code === 2) {
    return 'minor';
  } else if (code === 3) {
    return 'major';
  } else {
    return '';
  }
}

function isCommitBreakingChange(commit) {
  return (typeof commit.footer === 'string'
    && commit.footer.indexOf('BREAKING CHANGE') !== -1);
}

function showReportHeaderPositive() {
  console.log('RELEASES TO DO\n\n' +
              'We checked all packages and recent commits, and discovered that\n' +
              'according to semver.org you should release new versions for the\n' +
              'following packages.\n');
}

function showReportHeaderNegative() {
  console.log('Nothing to release.\n\n' +
              'We checked all packages and recent commits, and discovered that\n' +
              'you do not need to release any new version, according to semver.org.')
}

function showReport(status) {
  var headerShown = false;
  for (var package in status) {
    if (status.hasOwnProperty(package) && status[package].increment > 0) {
      if (!headerShown) {
        showReportHeaderPositive();
        headerShown = true;
      }

      console.log('`' + package + '` needs a new ' +
        incrementName(status[package].increment).toUpperCase() +
        ' version released because:');
      status[package].commits.forEach(function (commit) {
        console.log('  . ' + commit.header);
        if (isCommitBreakingChange(commit)) {
          console.log('    BREAKING CHANGE');
        }
      });
      console.log('');
    }
  }
  if (!headerShown) {
    showReportHeaderNegative();
  }
}

conventionalChangelog({
  preset: 'angular',
  append: true,
  transform: function (commit, cb) {
    if (commit.scope === 'META') {
      cb();
      return;
    }

    var package = commit.scope;
    if (commit.type === 'fix') {
      status[package].increment = Math.max(status[package].increment, 1);
      status[package].commits.push(commit);
    }
    if (commit.type === 'feat') {
      status[package].increment = Math.max(status[package].increment, 2);
      status[package].commits.push(commit);
    }
    if (isCommitBreakingChange(commit)) {
      status[package].increment = Math.max(status[package].increment, 3);
      status[package].commits.push(commit);
    }
    if (commit.type === 'release') {
      status[package].increment = 0;
      status[package].commits = [];
    }
    cb();
  },
}, {}, { from: theCommitThatStartedTheMonorepo, reverse: true })
  .on('end', function () {
    // ORACLE mode
    var argPackage = process.argv[2];
    if (typeof argPackage === 'string' && argPackage.length > 0) {
      return process.exit(status[argPackage].increment);
    }
    // REPORT mode
    else {
      showReport(status);
    }
  }).resume();