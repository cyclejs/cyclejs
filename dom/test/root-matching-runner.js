'use strict';

const path = require('path');
const root = path.resolve(__dirname, '..');
process.chdir(root);
const {Server} = require('karma');
if (!process.env.CHROME_BIN) {
  throw new Error('Set CHROME_BIN to an installed Chrome/Chromium executable');
}
const all = process.argv.indexOf('--all') !== -1;
const tests = all ? 'test/browser/**/*' : 'test/browser/root-without-id.ts';
new Server(
  {
    configFile: path.join(root, 'karma.conf.js'),
    basePath: root,
    files: [{pattern: 'src/**/*.ts'}, {pattern: tests}],
    browsers: ['ChromeHeadless'],
    reporters: ['dots'],
    hostname: '127.0.0.1',
    listenAddress: '127.0.0.1',
    port: Number(process.env.ROOT_KARMA_PORT || 19878),
    singleRun: true,
    autoWatch: false,
    browserNoActivityTimeout: 30000,
    captureTimeout: 15000,
    karmaTypescriptConfig: {
      tsconfig: './tsconfig.json',
      include: {
        mode: 'replace',
        values: ['src/**/*.ts', tests, 'test/typings.d.ts'],
      },
    },
  },
  code => {
    process.exitCode = code;
  }
).start();
