const common = require('../karma.conf.js');

module.exports = function(config) {
  config.set(
    Object.assign({}, common, {
      browserStack: Object.assign({}, common.browserStack, {
        name: 'Cycle.js window driver',
      }),
    })
  );
};
