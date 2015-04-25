'use strict';
let Cycle = require('../../lib/cycle');
let express = require('express');
let browserify = require('browserify');
let serialize = require('serialize-javascript');
let {Rx, h} = Cycle;
let {computer} = require('./app');

function wrapVTreeWithHTMLBoilerplate(vtree, context, clientBundle) {
  return h('html', [
    h('head', [
      h('title', 'Cycle Isomorphism Example')
    ]),
    h('body', [
      h('div.app-container', [vtree]),
      h('script', `window.appContext = ${serialize(context)};`),
      h('script', clientBundle)
    ])
  ]);
}

function prependHTML5Doctype(html) {
  return `<!doctype html>${html}`;
}

function makeEmptyInteraction$() {
  return {
    subscribe() { },
    choose() {
      return Rx.Observable.empty();
    }
  };
}

let clientBundle$ = (() => {
  let replaySubject = new Rx.ReplaySubject(1);
  let bundleString = '';
  let bundleStream = browserify()
    .transform('babelify')
    .transform({global: true}, 'uglifyify')
    .add('./client.js')
    .bundle();
  bundleStream.on('data', function (data) {
    bundleString += data;
  });
  bundleStream.on('end', function () {
    replaySubject.onNext(bundleString);
    replaySubject.onCompleted();
    console.log('Client bundle successfully compiled.');
  });
  return replaySubject;
})();

let server = express();

server.use(function (req, res) {
  // Ignore favicon requests
  if (req.url === '/favicon.ico') {
    res.writeHead(200, {'Content-Type': 'image/x-icon'});
    res.end();
    return;
  }

  console.log(`req: ${req.method} ${req.url}`);

  let context$ = Rx.Observable.just({route: req.url});
  let vtree$ = computer(context$, makeEmptyInteraction$())
    .combineLatest(context$, clientBundle$, wrapVTreeWithHTMLBoilerplate);
  let html$ = Cycle.renderAsHTML(vtree$).map(prependHTML5Doctype);
  html$.subscribe(html => res.send(html));
});

let port = process.env.PORT || 3000;
server.listen(port);
console.log(`Listening on port ${port}`);
