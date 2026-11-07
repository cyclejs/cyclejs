'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {spawnSync} = require('child_process');

function execute(command, args, options) {
  const result = spawnSync(
    command,
    args,
    Object.assign({encoding: 'utf8'}, options)
  );
  if (result.error) throw result.error;
  assert.strictEqual(result.status, 0, result.stdout + result.stderr);
  return result.stdout;
}

async function runtime(name, installed) {
  // Initialize the declared xstream observable symbol before loading an adapter.
  // These legacy stream libraries otherwise cache different symbol fallbacks.
  require('xstream');
  const root = require(path.join(installed, name));
  const compiled = require(path.join(installed, 'lib/cjs', name));
  assert.strictEqual(
    root,
    compiled,
    'root entrypoint must share the compiled module'
  );
  assert.strictEqual(typeof root.timeDriver, 'function');
  const Time = root.mockTimeSource();
  const input =
    name === 'rxjs'
      ? require('rxjs')
          .of('a')
          .pipe(Time.delay(60))
      : Time.delay(60)(require('most').of('a'));
  Time.assertEqual(input, Time.diagram('---(a|)'));
  await Time.runPromise();
  console.log(
    name + ': packed module identity and virtual-time behavior passed'
  );
}

function main(tarball) {
  assert(
    tarball,
    'Pass an npm pack tarball: pnpm run test-package ./package.tgz'
  );
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'cycle-time-package-')
  );
  // Retain the unpacked artifact for inspection, without traversing dependencies.
  console.log('Package consumer fixture: ' + directory);
  execute('tar', ['-xf', path.resolve(tarball), '-C', directory]);
  const modules = path.join(directory, 'node_modules');
  const scope = path.join(modules, '@cycle');
  fs.mkdirSync(modules);
  fs.mkdirSync(scope);
  const installed = path.join(scope, 'time');
  fs.renameSync(path.join(directory, 'package'), installed);
  fs.symlinkSync(
    path.resolve(__dirname, '../node_modules'),
    path.join(installed, 'node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir'
  );
  for (const name of ['rxjs', 'most']) {
    assert(
      fs.existsSync(path.join(installed, name + '.js')),
      name + ' runtime omitted from tarball'
    );
    assert(
      fs.existsSync(path.join(installed, name + '.d.ts')),
      name + ' declaration omitted from tarball'
    );
    console.log(
      execute(process.execPath, [
        __filename,
        '--runtime',
        name,
        installed,
      ]).trim()
    );
    // Resolve the actual package subpath from the independent consumer directory.
    execute(process.execPath, ['-e', "require('@cycle/time/" + name + "')"], {
      cwd: directory,
    });
  }
  const declarationTest = path.join(directory, 'consumer.ts');
  fs.writeFileSync(
    declarationTest,
    [
      "import {mockTimeSource as rxTime, timeDriver as rxDriver} from '@cycle/time/rxjs';",
      "import {mockTimeSource as mostTime, timeDriver as mostDriver} from '@cycle/time/most';",
      'rxTime().diagram("a|"); mostTime().diagram("a|");',
      'const drivers: Array<Function> = [rxDriver, mostDriver];',
    ].join('\n')
  );
  execute(process.execPath, [
    require.resolve('typescript/bin/tsc'),
    '--noEmit',
    '--strict',
    '--lib',
    'es2015,dom',
    '--moduleResolution',
    'node',
    declarationTest,
  ]);
  console.log(
    'Packed RxJS/Most subpaths and strict TypeScript consumer passed'
  );
  // Node 8-compatible cleanup; never recursively traverse linked dependency trees.
  fs.unlinkSync(declarationTest);
  if (process.platform === 'win32') {
    fs.rmdirSync(path.join(installed, 'node_modules'));
  } else {
    fs.unlinkSync(path.join(installed, 'node_modules'));
  }
  console.log('Artifact retained without dependency link: ' + directory);
}

if (process.argv[2] === '--runtime') {
  runtime(process.argv[3], process.argv[4]).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  main(process.argv[2]);
}
