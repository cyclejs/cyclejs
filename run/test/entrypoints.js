'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {spawnSync} = require('child_process');
const root = path.resolve(__dirname, '..');

for (const directory of ['lib', 'lib/cjs', 'lib/es6']) {
  const file = path.join(root, directory, 'adapt.js');
  const source = fs.readFileSync(file, 'utf8');
  const reference = /\/\/# sourceMappingURL=(.+)/.exec(source);
  if (reference) {
    const mapFile = path.resolve(path.dirname(file), reference[1].trim());
    const map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
    for (const sourceFile of map.sources) {
      assert(
        fs.existsSync(
          path.resolve(path.dirname(mapFile), map.sourceRoot || '', sourceFile)
        ),
        'Unresolvable source map in ' + file + ': ' + sourceFile
      );
    }
  }
}
console.log('PASS: all adapt entrypoint source maps resolve');

const legacy = require('../lib/adapt');
const canonical = require('../lib/cjs/adapt');
assert.strictEqual(legacy, canonical);
const sentinel = {};
try {
  legacy.setAdapt(() => sentinel);
  assert.strictEqual(canonical.adapt({}), sentinel);
  canonical.setAdapt(stream => stream);
  assert.strictEqual(legacy.adapt(sentinel), sentinel);
} finally {
  canonical.setAdapt(stream => stream);
}
console.log('PASS: legacy and CJS imports share the same module and adapter');

const fixtureDir = fs.mkdtempSync(path.join(root, 'lib', 'entrypoint-types-'));
const fixture = path.join(fixtureDir, 'consumer.ts');
try {
  fs.writeFileSync(
    fixture,
    "import {adapt, setAdapt, AdaptStream} from '../adapt';\n" +
      "import {adapt as canonical} from '../cjs/adapt';\n" +
      'const adapter: AdaptStream = stream => stream;\n' +
      'setAdapt(adapter);\n' +
      'export const same: typeof canonical = adapt;\n'
  );
  const result = spawnSync(
    process.execPath,
    [
      require.resolve('typescript/bin/tsc'),
      '--noEmit',
      '--strict',
      '--types',
      'node',
      fixture,
    ],
    {cwd: root, encoding: 'utf8', windowsHide: true}
  );
  if (result.error) throw result.error;
  assert.strictEqual(result.status, 0, result.stdout + result.stderr);
} finally {
  fs.unlinkSync(fixture);
  fs.rmdirSync(fixtureDir);
}
console.log(
  'PASS: legacy AdaptStream, adapt and setAdapt declarations compile'
);
