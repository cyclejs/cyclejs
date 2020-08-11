const urls = [
  '/querystring',
  '/binary',
  '/hello',
  '/pet',
  '/json',
  '/error',
  '/delete'
];

const debug = process.env.DEBUG === '1';

const browsers = debug ? ['Firefox'] : ['ChromeHeadless', 'FirefoxHeadless'];

module.exports = function(config) {
  config.set({
    basePath: '.',
    frameworks: ['mocha', 'karma-typescript'],
    files: [
      { pattern: 'src/**/*.ts' },
      { pattern: 'test/{browser,common}.ts' }
    ],
    plugins: [
      'karma-mocha',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-typescript'
    ],
    hostname: 'localhost',
    exclude: [],
    preprocessors: {
      '**/*.ts': ['karma-typescript']
    },
    proxies: urls.reduce(
      (acc, curr) => ({
        ...acc,
        [curr]: {
          target: 'http://localhost:3000' + curr,
          changeOrigin: true
        }
      }),
      {}
    ),
    karmaTypescriptConfig: {
      reports: {
        text: null,
        html: 'coverage',
        json: { directory: 'coverage', filename: 'coverage.json' }
      },
      compilerOptions: {
        module: 'commonjs'
      },
      coverageOptions: {
        exclude: /^test\//
      },
      tsconfig: './tsconfig.json'
    },
    reporters: ['dots', 'karma-typescript'],
    port: 9876,
    colors: true,
    autoWatch: true,
    browsers,
    singleRun: !debug,
    concurrency: 1
  });
};
