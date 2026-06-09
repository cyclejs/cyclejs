'use strict';

const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const examplesRoot = path.join(root, 'examples');
const tempRoot = path.join(os.tmpdir(), 'cyclejs-example-e2e');
const packRoot = path.join(tempRoot, '_local-packages');
const dryRun = process.argv.includes('--dry-run');
const requestedExamples = process.argv
  .slice(2)
  .filter(arg => arg !== '--dry-run')
  .map(arg => path.resolve(root, arg));

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function mkdirp(dir) {
  if (fs.existsSync(dir)) return;
  mkdirp(path.dirname(dir));
  fs.mkdirSync(dir);
}

function removeDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const file = path.join(dir, entry);
    const stat = fs.lstatSync(file);
    if (stat.isDirectory()) {
      removeDir(file);
    } else {
      fs.unlinkSync(file);
    }
  }
  fs.rmdirSync(dir);
}

function copyDir(source, target) {
  mkdirp(target);
  for (const entry of fs.readdirSync(source)) {
    if (entry === 'node_modules' || entry === 'dist') continue;

    const sourceFile = path.join(source, entry);
    const targetFile = path.join(target, entry);
    const stat = fs.statSync(sourceFile);

    if (stat.isDirectory()) {
      copyDir(sourceFile, targetFile);
    } else {
      fs.copyFileSync(sourceFile, targetFile);
    }
  }
}

function posixPath(file) {
  return file.split(path.sep).join('/');
}

function run(command, args, cwd) {
  const result = childProcess.spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed in ${cwd}`);
  }
}

function runAndCapture(command, args, cwd) {
  const result = childProcess.spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.stdout.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
    throw new Error(`${command} ${args.join(' ')} failed in ${cwd}`);
  }

  return result.stdout.trim();
}

function collectPackageDirs(dir, dirs) {
  for (const entry of fs.readdirSync(dir)) {
    const file = path.join(dir, entry);
    if (!fs.statSync(file).isDirectory()) continue;

    if (fs.existsSync(path.join(file, 'package.json'))) {
      dirs.push(file);
    }

    collectPackageDirs(file, dirs);
  }
}

function collectLocalPackages() {
  const packages = new Map();

  for (const entry of fs.readdirSync(root)) {
    const file = path.join(root, entry, 'package.json');
    if (!fs.existsSync(file)) continue;

    const pkg = readJson(file);
    if (pkg.name && pkg.name.startsWith('@cycle/')) {
      packages.set(pkg.name, path.join(root, entry));
    }
  }

  return packages;
}

function packLocalPackages(localPackages) {
  if (dryRun) return localPackages;

  mkdirp(packRoot);
  const tarballs = new Map();

  for (const [name, packageDir] of localPackages) {
    const output = runAndCapture('npm', ['pack', packageDir, '--pack-destination', packRoot], root);
    const filename = output.split(/\r?\n/).pop();
    tarballs.set(name, path.join(packRoot, filename));
  }

  return tarballs;
}

function rewriteLocalDependencies(pkg, packageDir, localPackages) {
  for (const section of ['dependencies', 'devDependencies']) {
    const dependencies = pkg[section];
    if (!dependencies) continue;

    for (const name of Object.keys(dependencies)) {
      const localPackageDir = localPackages.get(name);
      if (!localPackageDir) continue;

      const relative = posixPath(path.relative(packageDir, localPackageDir));
      dependencies[name] = `file:${relative.startsWith('.') ? relative : `./${relative}`}`;
    }
  }
}

function runnableScript(pkg) {
  if (!pkg.scripts) return null;
  if (pkg.scripts.build) return ['run', 'build'];
  if (pkg.scripts.browserify) return ['run', 'browserify'];
  return null;
}

const examplePackageDirs = [];
collectPackageDirs(examplesRoot, examplePackageDirs);

const selectedPackageDirs = requestedExamples.length === 0
  ? examplePackageDirs
  : examplePackageDirs.filter(dir => requestedExamples.includes(dir));

if (selectedPackageDirs.length === 0) {
  throw new Error('No example packages matched the requested paths');
}

removeDir(tempRoot);
mkdirp(tempRoot);

const localPackages = collectLocalPackages();
const localPackageSources = packLocalPackages(localPackages);

try {
  for (const exampleDir of selectedPackageDirs) {
    const relativeExampleDir = path.relative(examplesRoot, exampleDir);
    const tempExampleDir = path.join(tempRoot, relativeExampleDir);

    copyDir(exampleDir, tempExampleDir);

    const packageFile = path.join(tempExampleDir, 'package.json');
    const pkg = readJson(packageFile);
    rewriteLocalDependencies(pkg, tempExampleDir, localPackageSources);
    writeJson(packageFile, pkg);

    const script = runnableScript(pkg);
    if (!script) {
      console.log(`Skipping ${relativeExampleDir}: no build or browserify script`);
      continue;
    }

    console.log(`Testing ${relativeExampleDir}`);
    if (dryRun) continue;

    run('npm', ['install', '--ignore-scripts', '--no-package-lock', '--legacy-peer-deps'], tempExampleDir);
    run('npm', script, tempExampleDir);
  }
} finally {
  if (!dryRun) removeDir(tempRoot);
}
