const fs = require('fs');
const path = require('path');

const entrypoints = {
  'most.js': "'use strict';\n\nmodule.exports = require('./lib/cjs/most');\n",
  'most.d.ts': "export * from './lib/cjs/most';\n",
  'rxjs.js': "'use strict';\n\nmodule.exports = require('./lib/cjs/rxjs');\n",
  'rxjs.d.ts': "export * from './lib/cjs/rxjs';\n",
};

Object.keys(entrypoints).forEach(function(filename) {
  fs.writeFileSync(path.join(__dirname, '..', filename), entrypoints[filename]);
});
