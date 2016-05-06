import Cycle from '@cycle/xstream-run';
import xs from 'xstream';
import express from 'express';
import browserify from 'browserify';
import serialize from 'serialize-javascript';
import {html, head, title, body, div, script, makeHTMLDriver} from '@cycle/dom';
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
    let wrappedVTree$ = xs.combine(wrapVTreeWithHTMLBoilerplate,
      vtree$, context$, bundle$
    ).take(1);
    return {
      DOM: wrappedVTree$
    };
  };
}

let clientBundle$ = (() => {
  let bundle$ = xs.createWithMemory();
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
    bundle$.shamefullySendNext(bundleString);
    console.log('Client bundle successfully compiled.');
  });
  return bundle$;
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

  let context$ = xs.of({route: req.url});
  let wrappedAppFn = wrapAppResultWithBoilerplate(app, context$, clientBundle$);
  let {sources, run} = Cycle(wrappedAppFn, {
    DOM: makeHTMLDriver(),
    context: () => context$,
    PreventDefault: () => {},
  });
  let html$ = sources.DOM.elements.map(prependHTML5Doctype);
  html$.addListener({
    next: html => res.send(html),
    error: err => res.sendStatus(500),
    complete: () => {}
  });
  run();
});

let port = process.env.PORT || 3000;
server.listen(port);
console.log(`Listening on port ${port}`);
