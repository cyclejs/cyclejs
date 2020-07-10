const deepmerge = require('deepmerge');
const common = require('../karma.conf.js');

module.exports = function(config) {
  config.set(
    deepmerge(common, {
      preprocessors: {
        'test/**/*.tsx': ['karma-typescript'],
      },
      browserStack: {
        name: 'Cycle.js DOM driver',
      },
      karmaTypescriptConfig: {
        include: {
          values: ['test/typings.d.ts'],
        },
      },
    })
  );
};
