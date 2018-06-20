const deepmerge = require('deepmerge');
const common = require('../karma.conf.js');

module.exports = function(config) {
  const newCommon = {
    ...common,
    browsers: common.browsers
      ? common.browsers.filter(s => s !== 'BS_IE_10')
      : undefined,
  };

  config.set(
    deepmerge(newCommon, {
      browserStack: {
        name: 'Cycle.js history driver',
      },
    }),
  );
};
