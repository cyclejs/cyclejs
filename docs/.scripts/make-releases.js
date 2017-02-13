'use strict';
var fs = require('fs');
var ejs = require('ejs');

var template = ejs.compile(fs.readFileSync(__dirname + '/template.html', 'utf-8'));

var chapters = [
  {id: 'getting-started', title: 'Getting started'},
  {id: 'dialogue', title: 'Dialogue abstraction'},
  {id: 'streams', title: 'Streams'},
  {id: 'basic-examples', title: 'Basic examples'},
  {id: 'model-view-intent', title: 'Model-View-Intent'},
  {id: 'components', title: 'Components'},
  {id: 'drivers', title: 'Drivers'},
]

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
