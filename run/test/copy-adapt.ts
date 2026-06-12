// tslint:disable-next-line
import 'mocha';
import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const {
  copyAdaptFiles,
  rewriteSourceMapSources,
} = require('../scripts/copy-adapt');

describe('copy-adapt', function() {
  it('rewrites copied source map sources relative to lib', function() {
    const sourceMap = {
      version: 3,
      file: 'adapt.js',
      sourceRoot: '',
      sources: ['../../src/adapt.ts'],
      names: [],
      mappings: '',
    };

    const fromDir = path.join('project', 'run', 'lib', 'cjs');
    const toDir = path.join('project', 'run', 'lib');
    const nextMap = rewriteSourceMapSources(sourceMap, fromDir, toDir);

    assert.deepStrictEqual(nextMap.sources, ['../src/adapt.ts']);
  });

  it('copies the compatibility entrypoint with a corrected source map', function() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cycle-run-'));
    fs.mkdirSync(path.join(dir, 'lib'));
    const cjsDir = path.join(dir, 'lib', 'cjs');
    fs.mkdirSync(cjsDir);

    fs.writeFileSync(
      path.join(cjsDir, 'adapt.js'),
      '//# sourceMappingURL=adapt.js.map\n'
    );
    fs.writeFileSync(path.join(cjsDir, 'adapt.d.ts'), 'export {};\n');
    fs.writeFileSync(
      path.join(cjsDir, 'adapt.js.map'),
      JSON.stringify({
        version: 3,
        file: 'adapt.js',
        sourceRoot: '',
        sources: ['../../src/adapt.ts'],
        names: [],
        mappings: '',
      })
    );

    copyAdaptFiles(dir);

    assert.strictEqual(
      fs.readFileSync(path.join(dir, 'lib', 'adapt.js'), 'utf8'),
      '//# sourceMappingURL=adapt.js.map\n'
    );
    assert.strictEqual(
      fs.readFileSync(path.join(dir, 'lib', 'adapt.d.ts'), 'utf8'),
      'export {};\n'
    );

    const copiedMap = JSON.parse(
      fs.readFileSync(path.join(dir, 'lib', 'adapt.js.map'), 'utf8')
    );
    assert.deepStrictEqual(copiedMap.sources, ['../src/adapt.ts']);
  });
});
