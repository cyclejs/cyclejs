const ci = !!process.env.CI;
const watch = !!process.env.WATCH;
const live = !!process.env.LIVE;

const identifier = process.env.BROWSERSTACK_LOCAL_IDENTIFIER;
const ip = 'bs-local.com';

const browserstack = require('./browserstack-karma.js');

const browsers = ci
  ? Object.keys(browserstack)
  : live
  ? undefined
  : ['Chrome', 'Firefox'];

module.exports = {
  basePath: '.',
  frameworks: ['mocha', 'karma-typescript'],
  // list of files / patterns to load in the browser
  files: [{pattern: 'src/**/*.ts'}, {pattern: 'test/browser/**/*'}],
  plugins: [
    'karma-mocha',
    'karma-chrome-launcher',
    'karma-firefox-launcher',
    'karma-browserstack-launcher',
    'karma-typescript',
  ],
  hostname: ci ? ip : 'localhost',
  // list of files / patterns to exclude
  exclude: [],
  preprocessors: {
    'src/**/*.ts': ['karma-typescript'],
    'test/**/*.ts': ['karma-typescript'],
  },
  browserStack: {
    startTunnel: false,
    retryLimit: 3,
    tunnelIdentifier: identifier,
  },
  browserNoActivityTimeout: 1000000,
  customLaunchers: browserstack,
  karmaTypescriptConfig: {
    coverageOptions: {
      exclude: /test\//,
    },
    tsconfig: './tsconfig.json',
    include: {
      mode: 'merge',
      values: ['test/browser/**/*'],
    },
  },
  reporters: ['dots', 'karma-typescript', 'BrowserStack'],
  port: 9876,
  colors: true,
  autoWatch: true,
  browsers: browsers,
  singleRun: !watch && !live,
  concurrency: ci ? 1 : Infinity,
};
