'use strict';

const fs = require('fs');
const path = require('path');
const lib = path.resolve(__dirname, '../lib');

if (!fs.existsSync(lib)) fs.mkdirSync(lib);
fs.writeFileSync(
  path.join(lib, 'adapt.js'),
  "'use strict';\nmodule.exports = require('./cjs/adapt');\n"
);
fs.writeFileSync(
  path.join(lib, 'adapt.d.ts'),
  "export * from './cjs/adapt';\n"
);

// Remove only the obsolete map produced by the previous copy-based build.
const oldMap = path.join(lib, 'adapt.js.map');
if (fs.existsSync(oldMap)) fs.unlinkSync(oldMap);
