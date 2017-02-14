'use strict';
var fs = require('fs');
var ejs = require('ejs');

var template = ejs.compile(fs.readFileSync(__dirname + '/template.html', 'utf-8'));

var mdFilename = __dirname + '/../content/index.md';
var htmlFilename = __dirname + '/../index.html';
var content = fs.readFileSync(mdFilename, 'utf-8');
var outputStr = template({
  title: '',
  pathToRoot: '',
  content: content,
  frontpage: true,
  premenu: [],
  postmenu: [],
});
fs.writeFileSync(htmlFilename, outputStr, 'utf-8');
