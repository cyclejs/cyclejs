'use strict';
var markdox = require('markdox');

function generateDocs(options) {
  markdox.process(
    options.src,
    {output: options.output, template: options.template},
    function generationCallback(err/*, output */) {
      if (err) {
        console.error(err);
      } else {
        console.log('File `' + options.output + '` generated with success');
      }
    }
  );
}

var argPackage = process.argv[2];

generateDocs({
  src: __dirname + '/../' + argPackage + '/lib/index.js',
  output: __dirname + '/../' + argPackage + '/generated-api.md',
  template: __dirname + '/cycle-docs-template.md.ejs',
});
