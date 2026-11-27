// Deep imports of @cycle/run/lib/adapt need the compiled adapt module in the
// root of lib, but copying it there breaks the relative source paths in its
// source map. This rewrites those paths so they resolve inside the published
// package again.
const fs = require('fs');
const path = require('path');

for (const file of fs.readdirSync(path.join('lib', 'cjs'))) {
  if (file.startsWith('adapt.')) {
    fs.copyFileSync(path.join('lib', 'cjs', file), path.join('lib', file));
  }
}

const mapPath = path.join('lib', 'adapt.js.map');
const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
map.sources = map.sources.map(source => source.replace('../../src', '../src'));
fs.writeFileSync(mapPath, JSON.stringify(map));
