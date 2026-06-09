const fs = require('fs');
const path = require('path');

const outputDirectory = path.join(__dirname, '..', 'lib');
const commonjsDirectory = path.join(outputDirectory, 'cjs');

for (const file of ['adapt.js', 'adapt.d.ts']) {
  fs.writeFileSync(
    path.join(outputDirectory, file),
    fs.readFileSync(path.join(commonjsDirectory, file))
  );
}

const sourceMap = JSON.parse(
  fs.readFileSync(path.join(commonjsDirectory, 'adapt.js.map'), 'utf8')
);
sourceMap.sources = sourceMap.sources.map(source =>
  source.replace(/^\.\.\/\.\.\//, '../')
);

fs.writeFileSync(
  path.join(outputDirectory, 'adapt.js.map'),
  JSON.stringify(sourceMap)
);
