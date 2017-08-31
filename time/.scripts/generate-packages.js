#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

const basePath = path.join(__dirname, '..');

const template = fs.readFileSync(path.join(basePath, 'index.template.ts'), 'utf-8');

const entryPoints = [
  {streamType: 'Stream', blankName: true, exportTime: true },
  {packageName: 'most', streamType: 'Stream'},
  {packageName: 'rxjs', streamType: 'Observable'},
];

const ownPackageJson = JSON.parse(fs.readFileSync(
  path.join(basePath, 'package.json'), 'utf-8')
);

const templateWithoutContent = template.split('\n').slice(2).join('\n') ;

entryPoints.forEach(entryPoint => {
  const targetFolder = entryPoint.packageName ? path.join(basePath, entryPoint.packageName) : basePath;

  fs.copySync(path.join(basePath, 'packageTemplate'), targetFolder, {
    overwrite: false,
  });
  fs.ensureDirSync(path.join(targetFolder, 'src'));

  if(entryPoint.packageName) {
    const jsonPath = path.join(targetFolder, 'package.json');
    let packageJson = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    packageJson.name = '@cycle/' + (!entryPoint.packageName ? '' : entryPoint.packageName + '-') + 'time';
    packageJson.version = ownPackageJson.version;
    packageJson.dependencies = {
      '@cycle/time': '^' + ownPackageJson.version,
      [entryPoint.packageName]: '*'
    };
    packageJson['browserify-shim'] = {
      [entryPoint.packageName]: 'global:' + (entryPoint.packageName || 'xstream')
    };
    fs.writeFileSync(jsonPath, JSON.stringify(packageJson, null, 2));
  }

  const contents = ('// Generated from index.template.ts\n' + templateWithoutContent)
    .replace(/\$\$PACKAGE_NAME\$\$/g, entryPoint.packageName || 'xstream')
    .replace(/\$\$STREAM_TYPE\$\$/g, entryPoint.streamType)
    .replace(/\$\$EXPORT\$\$/g, entryPoint.packageName ? '' : "export * from './index.common'")
    .replace(/\$\$TIME_PACKAGE\$\$/g, !entryPoint.packageName ? './index.common' : '@cycle/time');

  const packagePath = path.join(targetFolder, 'src', 'index.ts');

  fs.writeFileSync(packagePath, contents, 'utf-8', {flags: 'w+'});
});
