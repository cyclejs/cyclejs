#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, '..');

const template = fs.readFileSync(path.join(basePath, 'index.template.ts'), 'utf-8');

const entryPoints = [
  {packageName: 'xstream', streamType: 'Stream', outFile: 'xstream.ts', timeImportDir: 'lib'},
  {packageName: 'most', streamType: 'Stream', outFile: 'most.ts', timeImportDir: 'lib'},
  {packageName: 'rxjs', streamType: 'Observable', outFile: 'rxjs.ts', timeImportDir: 'lib'},
  {packageName: 'xstream', streamType: 'Stream', outFile: 'es6.ts', timeImportDir: 'lib/es6'},
  {packageName: 'most', streamType: 'Stream', outFile: 'most-es6.ts', timeImportDir: 'lib/es6'},
  {packageName: 'rxjs', streamType: 'Observable', outFile: 'rxjs.es6.ts', timeImportDir: 'lib/es6'}
];

const templateWithoutContent = template.split('\n').slice(2).join('\n') ;

entryPoints.forEach(entryPoint => {
  const contents = ('// Generated from index.template.ts\n' + templateWithoutContent)
    .replace(/\$\$TIME_DIRECTORY\$\$/g, entryPoint.timeImportDir)
    .replace(/\$\$PACKAGE_NAME\$\$/g, entryPoint.packageName)
    .replace(/\$\$STREAM_TYPE\$\$/g, entryPoint.streamType);

  fs.writeFileSync(path.join(basePath, entryPoint.outFile), contents, 'utf-8');
});

