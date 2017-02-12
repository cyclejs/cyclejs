'use strict';
var fs = require('fs');
var ejs = require('ejs');

var template = ejs.compile(fs.readFileSync(__dirname + '/template.html', 'utf-8'));

var content =
  fs.readFileSync(__dirname + '/../content/documentation/getting-started.md', 'utf-8') +
  '\n' +
  fs.readFileSync(__dirname + '/../content/documentation/dialogue-abstraction.md', 'utf-8') +
  '\n' +
  fs.readFileSync(__dirname + '/../content/documentation/streams.md', 'utf-8') +
  '\n' +
  fs.readFileSync(__dirname + '/../content/documentation/basic-examples.md', 'utf-8') +
  '\n' +
  fs.readFileSync(__dirname + '/../content/documentation/model-view-intent.md', 'utf-8') +
  '\n' +
  fs.readFileSync(__dirname + '/../content/documentation/components.md', 'utf-8') +
  '\n' +
  fs.readFileSync(__dirname + '/../content/documentation/drivers.md', 'utf-8')

var outputStr = template({
  title: 'Documentation',
  pathToRoot: '',
  content: content,
});

fs.writeFileSync(__dirname + '/../documentation.html', outputStr, 'utf-8');