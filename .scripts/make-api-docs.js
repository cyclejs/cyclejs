'use strict';
var markdox = require('markdox');
var fs = require('fs');

var argPackage = process.argv[2];
var dirOfThePackage = __dirname + '/../' + argPackage;

markdox.process(
  dirOfThePackage + '/lib/index.js', // src
  {
    output: dirOfThePackage + '/generated-api.md',
    template: __dirname + '/cycle-docs-template.md.ejs',
  },
  function generationCallback(err/*, output */) {
    if (err) {
      console.error(err);
    } else {
      console.log('File `' + dirOfThePackage + '/generated-api.md' + '` generated with success');

      const outputStr =
        fs.readFileSync(__dirname + '/../docs/.scripts/api-ref-template-pre.html', 'utf-8') +
        fs.readFileSync(dirOfThePackage + '/.scripts/docs-template.md', 'utf-8') +
        fs.readFileSync(dirOfThePackage + '/generated-api.md', 'utf-8') +
        fs.readFileSync(__dirname + '/../docs/.scripts/api-ref-template-post.html', 'utf-8');

      const htmlFilename = __dirname + '/../docs/api/' + argPackage + '.html';
      fs.writeFileSync(htmlFilename, outputStr, 'utf-8');
      console.log('File `' + htmlFilename + '` generated with success');

      fs.unlinkSync(dirOfThePackage + '/generated-api.md');
    }
  }
);
