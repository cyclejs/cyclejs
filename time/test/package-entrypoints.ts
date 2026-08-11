import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import {
  mockTimeSource as mostMockTimeSource,
  timeDriver as mostTimeDriver,
} from '../most';
import {
  mockTimeSource as rxjsMockTimeSource,
  timeDriver as rxjsTimeDriver,
} from '../rxjs';

describe('@cycle/time package entrypoints', () => {
  it('exposes the Most and RxJS runtime APIs from the package root', () => {
    assert.equal(typeof mostMockTimeSource, 'function');
    assert.equal(typeof mostTimeDriver, 'function');
    assert.equal(typeof rxjsMockTimeSource, 'function');
    assert.equal(typeof rxjsTimeDriver, 'function');
  });

  it('includes the runtime and declaration entrypoints when published', () => {
    const manifestPath = path.resolve(__dirname, '..', 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const expectedFiles = ['most.js', 'most.d.ts', 'rxjs.js', 'rxjs.d.ts'];

    expectedFiles.forEach(filename => {
      assert.notEqual(manifest.files.indexOf(filename), -1, filename);
    });
  });
});
