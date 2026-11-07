'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {spawnSync} = require('child_process');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cycle-example-docs-'));
const examples = path.join(root, 'examples');
fs.mkdirSync(examples);
for (const level of ['basic', 'intermediate', 'advanced']) {
  fs.mkdirSync(path.join(examples, level));
}
const demo = path.join(examples, 'basic', 'demo');
fs.mkdirSync(demo);
fs.mkdirSync(path.join(demo, 'src'));
fs.writeFileSync(
  path.join(demo, 'package.json'),
  JSON.stringify({scripts: {start: 'echo demo'}})
);
fs.writeFileSync(path.join(demo, 'src/main.js'), 'const answer = 42;\n');
fs.writeFileSync(
  path.join(examples, 'README.md'),
  '[Demo](./basic/demo/README.md)\n'
);
fs.writeFileSync(path.join(examples, 'RUNNING.md'), '# Running\n');
const guide =
  '# Demo\n\n## Learn\nConcept\n## Flow\n[Source](./src/main.js)\n## Run\nnpm start\n## Limits\nFixture only\n';
const readme = path.join(demo, 'README.md');

function check(expectedStatus, message) {
  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, 'check-example-docs.js'), '--root=' + root],
    {encoding: 'utf8'}
  );
  if (result.error) throw result.error;
  assert.strictEqual(
    result.status === 0,
    expectedStatus === 0,
    result.stdout + result.stderr
  );
  if (message)
    assert(
      (result.stdout + result.stderr).indexOf(message) !== -1,
      result.stdout + result.stderr
    );
}

fs.writeFileSync(readme, guide);
check(0);
fs.writeFileSync(readme, guide.split('\n').join('\r\n'));
check(0);
fs.unlinkSync(readme);
check(1, 'missing guide');
fs.writeFileSync(readme, guide.replace('./src/main.js', './src/missing.js'));
check(1, 'missing local target');
fs.writeFileSync(readme, guide);
fs.writeFileSync(path.join(demo, 'src/main.js'), 'const = ;\n');
check(1, 'source parse errors');
console.log(
  '5 documentation checker fixtures passed (LF, CRLF, missing guide, broken link, invalid source)'
);
console.log('Fixture retained: ' + root);
