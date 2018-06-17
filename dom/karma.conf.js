const ci = !!process.env.CI;
const watch = !!process.env.WATCH;

const browsers = ci ? [] : ['Chrome', 'Firefox'];

module.exports = function(config) {
  config.set({
    basePath: '.',
    frameworks: ['mocha', 'karma-typescript'],
    // list of files / patterns to load in the browser
    files: [{pattern: 'src/**/*.ts'}, {pattern: 'test/browser/src/*'}],
    plugins: [
      'karma-mocha',
      'karma-coverage',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-typescript',
    ],
    // list of files / patterns to exclude
    exclude: [],
    preprocessors: {
      'src/**/*.ts': ['karma-typescript', 'coverage'],
      'test/**/*.ts': ['karma-typescript'],
      'test/**/*.tsx': ['karma-typescript'],
    },
    karmaTypescriptConfig: {
      bundlerOptions: {
        transforms: [require('karma-typescript-es6-transform')()],
      },
      tsconfig: './tsconfig.json',
      include: {
        mode: 'merge',
        values: ['test/browser/src/**/*', 'test/typings.d.ts'],
      },
    },
    reporters: ['progress', 'coverage', 'karma-typescript'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: browsers,
    singleRun: ci || !watch,
    concurrency: Infinity,
  });
};
