const fs = require('fs');
const path = require('path');

const packageRoot = path.resolve(__dirname, '..');

['most', 'rxjs'].forEach(entrypoint => {
  fs.writeFileSync(
    path.join(packageRoot, `${entrypoint}.js`),
    `'use strict';\n\nmodule.exports = require('./lib/cjs/${entrypoint}');\n`
  );
  fs.writeFileSync(
    path.join(packageRoot, `${entrypoint}.d.ts`),
    `export * from './lib/cjs/${entrypoint}';\n`
  );
});
