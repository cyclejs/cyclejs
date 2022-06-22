const debug = process.env.DEBUG === '1';
const watch = process.env.WATCH === '1';
const ci = process.env.CI === '1';

const browsers = debug
  ? ['Firefox']
  : watch
  ? ['FirefoxHeadless']
  : ['ChromeHeadless', 'FirefoxHeadless'];

module.exports = function (config) {
  config.set({
    basePath: '.',
    frameworks: ['mocha', 'karma-typescript'],
    files: [{ pattern: 'src/**/*.ts' }, { pattern: 'test/browser/*' }],
    plugins: [
      'karma-mocha',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-typescript',
      'karma-spec-reporter',
    ],
    hostname: 'localhost',
    exclude: [],
    preprocessors: {
      '**/*.{ts,tsx}': ['karma-typescript'],
    },
    karmaTypescriptConfig: {
      reports: {
        text: null,
        html: 'coverage',
        json: { directory: 'coverage', filename: 'coverage.json' },
      },
      compilerOptions: {
        module: 'commonjs',
        sourceMap: true,
      },
      coverageOptions: {
        exclude: /^test\//,
        instrumentation: !debug,
      },
      bundlerOptions: {
        sourceMap: true,
      },
      tsconfig: './tsconfig.json',
    },
    reporters: [ci ? 'dots' : 'spec', 'karma-typescript'],
    port: 9876,
    colors: true,
    autoWatch: true,
    browsers,
    singleRun: !debug && !watch,
    concurrency: 1,
  });
};
