var fs = require('fs');
var Rx = require('rx');
var exec = Rx.Observable.fromNodeCallback(require('child_process').exec);
var writeFile = Rx.Observable.fromNodeCallback(fs.writeFile);
var pkg = require(__dirname + '/../package.json');

pkg.name = '@cycle/rx-run';
var root = __dirname + '/..';

Rx.Observable.of(null)
  .flatMap(exec('mkdir -p ' + root + '/rx-run'))
  .flatMap(exec('mkdir -p ' + root + '/rx-run/dist'))
  .flatMap(exec('mkdir -p ' + root + '/rx-run/docs'))
  .flatMap(exec('mkdir -p ' + root + '/rx-run/lib'))
  .flatMap(exec('mkdir -p ' + root + '/rx-run/src'))
  .flatMap(exec('mkdir -p ' + root + '/rx-run/test'))
  .flatMap(exec('cp ' + root + '/.* ' + root + '/rx-run 2>/dev/null || :'))
  .flatMap(exec('cp ' + root + '/* ' + root + '/rx-run 2>/dev/null || :'))
  .flatMap(exec('cp -r ' + root + '/dist ' + root + '/rx-run/'))
  .flatMap(exec('cp -r ' + root + '/docs ' + root + '/rx-run/'))
  .flatMap(exec('cp -r ' + root + '/lib ' + root + '/rx-run/'))
  .flatMap(exec('cp -r ' + root + '/src ' + root + '/rx-run/'))
  .flatMap(exec('cp -r ' + root + '/test ' + root + '/rx-run/'))
  .flatMap(writeFile(
    root + '/rx-run/package.json',
    JSON.stringify(pkg, null, '  '),
    'utf8'
  ))
  .flatMap(exec('cd ' + root + '/rx-run && npm install && npm publish --access=public'))
  .subscribe();
