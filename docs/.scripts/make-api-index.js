'use strict';
var fs = require('fs');
var ejs = require('ejs');

var template = ejs.compile(fs.readFileSync(__dirname + '/template.html', 'utf-8'));

var mdFilename = __dirname + '/../content/api/index.md';
var htmlFilename = __dirname + '/../api/index.html';
var content = fs.readFileSync(mdFilename, 'utf-8');
var outputStr = template({
  title: 'API reference',
  pathToRoot: '../',
  content: content,
  premenu: [],
  postmenu: [
    {title: 'Cycle Run', link: 'api/run.html'},
    {title: 'Cycle RxJS Run', link: 'api/rxjs-run.html'},
    {title: 'Cycle Most Run', link: 'api/most-run.html'},
    {title: 'Cycle DOM', link: 'api/dom.html'},
    {title: 'Cycle HTML', link: 'api/html.html'},
    {title: 'Cycle HTTP', link: 'api/http.html'},
    {title: 'Cycle History', link: 'api/history.html'},
    {title: 'Cycle Isolate', link: 'api/isolate.html'},
    {title: 'Cycle JSONP', link: 'api/jsonp.html'},
  ],
});
fs.writeFileSync(htmlFilename, outputStr, 'utf-8');
