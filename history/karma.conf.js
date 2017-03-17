module.exports = function (config) {
  const customLaunchers = {
    SL_Chrome_49: {
      base: 'SauceLabs',
      browserName: 'chrome',
      platform: 'Windows 10',
      version: '49',
    },

    // TODO: fix these!
    // SL_IE_10: {
    //   base: 'SauceLabs',
    //   browserName: 'internet explorer',
    //   version: '10',
    // },

    // SL_IE_11: {
    //   base: 'SauceLabs',
    //   browserName: 'internet explorer',
    //   version: '11',
    // },

    SL_Safari_8: {
      base: 'SauceLabs',
      browserName: 'safari',
      version: '8',
    },

    SL_iphone_8: {
      base: 'SauceLabs',
      browserName: 'iphone',
      version: '8.4',
    },

    SL_iphone_9: {
      base: 'SauceLabs',
      browserName: 'iphone',
      version: '9.1',
    },

    SL_android_4_4: {
      base: 'SauceLabs',
      browserName: 'android',
      platform: 'Linux',
      version: '4.4',
      deviceName: 'Samsung Galaxy S3 Emulator',
    },

    SL_Safari_Current: {
      base: 'SauceLabs',
      browserName: 'safari',
      version: 'latest',
    },

    SL_MS_Edge: {
      base: 'SauceLabs',
      browserName: 'microsoftedge',
    },

    SL_Firefox_Current: {
      base: 'SauceLabs',
      browserName: 'firefox',
      platform: 'Windows 10',
      version: 'latest',
    },

    SL_Chrome_Current: {
      base: 'SauceLabs',
      browserName: 'chrome',
      platform: 'Windows 10',
      version: 'latest',
    },
  };

  const configuration = {
    sauceLabs: {
      testName: 'Cycle History Karma tests on Sauce Labs',
      connectOptions: {
        noSslBumpDomains: "all"
      }
    },

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

    reporters: ['dots', 'saucelabs'],

    concurrency: 1,

    captureTimeout: 300000,
    browserNoActivityTimeout: 30000,

    // LOG_DISABLE .. LOG_ERROR .. LOG_WARN .. LOG_INFO .. LOG_DEBUG
    logLevel: config.LOG_INFO,

    customLaunchers: customLaunchers,

    browsers: process.env.TRAVIS ? Object.keys(customLaunchers) : ['Chrome'],

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
  };

  config.set(configuration);
}
