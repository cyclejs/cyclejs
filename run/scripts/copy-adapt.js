const fs = require('fs');
const path = require('path');

function rewriteSourceMapSources(map, fromDir, toDir) {
  return Object.assign({}, map, {
    sources: map.sources.map(source => {
      if (/^(?:[a-z]+:)?\/\//i.test(source) || path.isAbsolute(source)) {
        return source;
      }

      const absoluteSource = path.resolve(fromDir, source);
      const relativeSource = path.relative(toDir, absoluteSource);
      return relativeSource.split(path.sep).join('/');
    }),
  });
}

function copyFile(source, target) {
  fs.copyFileSync(source, target);
}

function copyAdaptFiles(baseDir) {
  const fromDir = path.join(baseDir, 'lib', 'cjs');
  const toDir = path.join(baseDir, 'lib');

  copyFile(path.join(fromDir, 'adapt.js'), path.join(toDir, 'adapt.js'));
  copyFile(path.join(fromDir, 'adapt.d.ts'), path.join(toDir, 'adapt.d.ts'));

  const mapPath = path.join(fromDir, 'adapt.js.map');
  const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  const nextMap = rewriteSourceMapSources(map, fromDir, toDir);
  fs.writeFileSync(
    path.join(toDir, 'adapt.js.map'),
    JSON.stringify(nextMap, null, 2) + '\n'
  );
}

module.exports = {
  copyAdaptFiles,
  rewriteSourceMapSources,
};

if (require.main === module) {
  copyAdaptFiles(path.join(__dirname, '..'));
}
