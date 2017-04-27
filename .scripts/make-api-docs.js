'use strict';
var markdox = require('markdox');
var fs = require('fs');
var ejs = require('ejs');

var template = ejs.compile(
  fs.readFileSync(__dirname + '/../docs/.scripts/template.html', 'utf-8')
);
var argPackage = process.argv[2];
var dirOfThePackage = __dirname + '/../' + argPackage;

markdox.process(
  dirOfThePackage + '/lib/index.js', // src
  {
    output: dirOfThePackage + '/generated-api.md',
    template: __dirname + '/api-ref-template.md.ejs',
  },
  function generationCallback(err/*, output */) {
    if (err) {
      console.error(err);
    } else {
      console.log('File `' + dirOfThePackage + '/generated-api.md' + '` generated with success');

      var content =
        fs.readFileSync(__dirname + '/../docs/content/api/' + argPackage + '.md', 'utf-8') +
        fs.readFileSync(dirOfThePackage + '/generated-api.md', 'utf-8');

      var outputStr = template({
        title: 'API reference (' + argPackage + ')',
        pathToRoot: '../',
        content: content,
      });

      var htmlFilename = __dirname + '/../docs/api/' + argPackage + '.html';
      fs.writeFileSync(htmlFilename, outputStr, 'utf-8');
      console.log('File `' + htmlFilename + '` generated with success');

      fs.unlinkSync(dirOfThePackage + '/generated-api.md');
    }
  }
);
