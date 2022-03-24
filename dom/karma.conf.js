const debug = process.env.DEBUG === '1';

const browsers = debug ? ['Firefox'] : ['ChromeHeadless', 'FirefoxHeadless'];

module.exports = function (config) {
  config.set({
    basePath: '.',
    frameworks: ['mocha', 'karma-typescript'],
    files: [
      { pattern: 'src/**/*.ts' },
      { pattern: 'test/browser/{isolateModule,helpers,isolation}.ts' },
    ],
    plugins: [
      'karma-mocha',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-typescript',
    ],
    hostname: 'localhost',
    exclude: [],
    preprocessors: {
      '**/*.ts': ['karma-typescript'],
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
      },
      tsconfig: './tsconfig.json',
    },
    reporters: ['dots', 'karma-typescript'],
    port: 9876,
    colors: true,
    autoWatch: true,
    browsers,
    singleRun: !debug,
    concurrency: 1,
  });
};
