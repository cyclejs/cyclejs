'use strict';
var fs = require('fs');
var ejs = require('ejs');

var template = ejs.compile(fs.readFileSync(__dirname + '/template.html', 'utf-8'));

var mdFilename = __dirname + '/../content/releases.md';
var htmlFilename = __dirname + '/../releases.html';
var content = fs.readFileSync(mdFilename, 'utf-8');
var outputStr = template({
  title: 'Releases',
  pathToRoot: '',
  content: content,
  premenu: [],
  postmenu: [],
});
fs.writeFileSync(htmlFilename, outputStr, 'utf-8');
