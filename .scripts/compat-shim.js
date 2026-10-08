// Generates a backwards-compatibility entry point under a package's lib/
// that re-exports the real compiled module from lib/cjs.
//
// Copying the compiled file itself (cp lib/cjs/x.* lib/) left its source map
// pointing at ../../src relative to lib/, which escapes the package root and
// breaks source-map consumers. Re-exporting keeps the original module and its
// correct map authoritative; the shim itself needs no map.
//
// Usage: node ../.scripts/compat-shim.js <package-dir> <module-name>
const fs = require('fs');
const path = require('path');

const [packageDir, moduleName] = process.argv.slice(2);
if (!packageDir || !moduleName) {
  console.error('Usage: node compat-shim.js <package-dir> <module-name>');
  process.exit(1);
}

const libDir = path.join(__dirname, '..', packageDir, 'lib');
if (!fs.existsSync(path.join(libDir, 'cjs', moduleName + '.js'))) {
  console.error('Missing lib/cjs/' + moduleName + '.js in ' + packageDir);
  process.exit(1);
}
// A previous build may have copied lib/cjs/<module>.js.map into lib/.
// The re-export has no inline sourceMappingURL; remove that obsolete map so
// incremental builds and prepublish archives cannot ship a broken source path.
const staleSourceMap = path.join(libDir, moduleName + '.js.map');
if (fs.existsSync(staleSourceMap)) fs.unlinkSync(staleSourceMap);

fs.writeFileSync(
  path.join(libDir, moduleName + '.js'),
  "module.exports = require('./cjs/" + moduleName + "');\n"
);
fs.writeFileSync(
  path.join(libDir, moduleName + '.d.ts'),
  "export * from './cjs/" + moduleName + "';\n"
);
console.log('Wrote lib/' + moduleName + '.{js,d.ts} re-export shim');
