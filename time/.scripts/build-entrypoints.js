'use strict';

const fs = require('fs');
const path = require('path');

for (const name of ['rxjs', 'most']) {
  const target = './lib/cjs/' + name;
  fs.writeFileSync(
    path.join(__dirname, '..', name + '.js'),
    "'use strict';\nmodule.exports = require('" + target + "');\n"
  );
  fs.writeFileSync(
    path.join(__dirname, '..', name + '.d.ts'),
    "export * from '" + target + "';\n"
  );
}
