// Generates the backwards-compatible `@cycle/run/lib/adapt` entry as a thin
// re-export of the compiled module, instead of copying it (a copy would ship
// a source map whose `sources` paths are only valid under lib/cjs).
var fs = require('fs');
var path = require('path');

var lib = path.join(__dirname, 'lib');
fs.writeFileSync(
  path.join(lib, 'adapt.js'),
  '"use strict";\nfunction __export(m) {\n' +
    '    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];\n' +
    '}\nObject.defineProperty(exports, "__esModule", { value: true });\n' +
    '__export(require("./cjs/adapt"));\n'
);
fs.writeFileSync(path.join(lib, 'adapt.d.ts'), "export * from './cjs/adapt';\n");

// Remove a stale source map left over from the old copy-based build.
try {
  fs.unlinkSync(path.join(lib, 'adapt.js.map'));
} catch (e) {
  // nothing to remove
}
