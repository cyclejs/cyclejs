const { basename } = require('path');
const {
  whatBump,
} = require('conventional-changelog-angular/conventional-recommended-bump');

const scope = basename(process.cwd());

module.exports = {
  git: {
    commitMessage: `release(${scope}): \${version}`,
    tagName: `${scope}-v\${version}`,
  },
  github: {
    release: true,
    releaseName: `@cycle/${scope} \${version}`,
  },
  plugins: {
    '@release-it/conventional-changelog': {
      preset: 'angular',
      infile: 'CHANGELOG.md',
      transform: (commit, cb) => {
        if (commit.scope === scope) {
          cb(null, {
            ...commit,
            scope: null,
          });
        } else cb();
      },
      whatBump: commits => whatBump(commits.filter(c => c.scope === scope)),
    },
  },
};
