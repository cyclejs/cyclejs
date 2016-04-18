import Cycle from '@cycle/rx-run';
import express from 'express';
import browserify from 'browserify';
import serialize from 'serialize-javascript';
import {Observable, ReplaySubject} from 'rx';
import {
  html,
  head,
  title,
  body,
  div,
  script,
  makeHTMLDriver
} from '@cycle/dom';
import app from './app';

function wrapVTreeWithHTMLBoilerplate(vtree, context, clientBundle) {
  return (
    html([
      head([
        title('Cycle Isomorphism Example')
      ]),
      body([
        div('.app-container', [vtree]),
        script(`window.appContext = ${serialize(context)};`),
        script(clientBundle)
      ])
    ])
  );
}

function prependHTML5Doctype(html) {
  return `<!doctype html>${html}`;
}

function wrapAppResultWithBoilerplate(appFn, context$, bundle$) {
  return function wrappedAppFn(sources) {
    let vtree$ = appFn(sources).DOM;
    let wrappedVTree$ = Observable.combineLatest(vtree$, context$, bundle$,
      wrapVTreeWithHTMLBoilerplate
    );
    return {
      DOM: wrappedVTree$
    };
  };
}

let clientBundle$ = (() => {
  let replaySubject = new ReplaySubject(1);
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

  let context$ = Observable.of({route: req.url});
  let wrappedAppFn = wrapAppResultWithBoilerplate(app, context$, clientBundle$);
  let {sources, run} = Cycle(wrappedAppFn, {
    DOM: makeHTMLDriver(),
    context: () => context$
  });
  let html$ = sources.DOM.element$.map(prependHTML5Doctype);
  html$.subscribe(html => res.send(html));
  run();
});

let port = process.env.PORT || 3000;
server.listen(port);
console.log(`Listening on port ${port}`);
