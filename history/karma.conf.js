module.exports = function (config) {
  const configuration =
    {
      files: [
        'src/**/*.ts',
        'test/browser/**/*.ts',
      ],

      frameworks: [
        'mocha',
        'karma-typescript'
      ],

      preprocessors: {
        '**/*.ts': ['karma-typescript']
      },

      customLaunchers: {
        Chrome_travis_ci: {
          base: 'Chrome',
          flags: ['--no-sandbox']
        },

        sl_ie_11: {
          base: 'SauceLabs',
          browserName: 'internet explorer',
          platform: 'Windows 10',
          version: '11'
        },

        sl_safari: {
          base: 'SauceLabs',
          browserName: 'safari',
          version: '9'
        },

        // needs other configurations for SauceLabs
      },

      browsers: [
        'Chrome',
      ],

      karmaTypescriptConfig: {
        tsconfig: 'tsconfig.json',
        include: [
          "test/browser/**/*.ts",
          "src/**/*.ts"
        ],
        reports: {
          "html": "coverage",
          "lcovonly": "coverage",
        }
      }
    }

  if (process.env.TRAVIS) {
    configuration.browsers = [
      'Chrome_travis_ci',
      'sl_ie_11',
      'sl_safari'
    ];
  }

  config.set(configuration);
}
