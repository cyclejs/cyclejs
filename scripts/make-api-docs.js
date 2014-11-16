'use strict';
var markdox = require('markdox');

var options = {
  output: './docs/api.md',
  template: './scripts/docs-template.md.ejs'
};

markdox.process('./src/cycle.js', options, function (err/*, output */) {
  if (err) {
    console.error(err);
  } else {
    console.log('File `' + options.output + '` generated with success');
  }
});
