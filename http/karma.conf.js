const deepmerge = require('deepmerge');
const common = require('../karma.conf.js');

const urls = [
  '/querystring',
  '/binary',
  '/hello',
  '/pet',
  '/json',
  '/error',
  '/delete',
];

module.exports = function(config) {
  config.set(
    deepmerge(common, {
      proxies: urls.reduce(
        (acc, curr) =>
          Object.assign({}, acc, {
            [curr]: {
              target: 'http://' + common.hostname + ':8070' + curr,
              changeOrigin: true,
            },
          }),
        {}
      ),
      browserStack: {
        name: 'Cycle.js HTTP driver',
      },
    })
  );
};
