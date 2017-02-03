import Cycle from '@cycle/xstream-run';
import xs from 'xstream';
import express from 'express';
import browserify from 'browserify';
import serialize from 'serialize-javascript';
import {html, head, title, body, div, script, makeHTMLDriver} from '@cycle/dom';
import app from './app';


const wrapVTreeWithHTMLBoilerplate = ([vtree, context, clientBundle]) =>

  html([
    head([
      title('Cycle Isomorphism Example')
    ]),
    body([
      div('.app-container', [vtree]),

      // inject as script to run in the client browser
      // and set the context to {route: route}
      script(`window.appContext = ${serialize(context)};`),
      script(clientBundle)
    ])
  ])

const prependHTML5Doctype = html => `<!doctype html>${html}`


const wrapAppResultWithBoilerplate = (appFn, context$, bundle$) =>
  sources => {

    // use vNode tree returned from appFn
    let vtree$ = appFn(sources).DOM;

    let wrappedVTree$ = xs

      // combine 3 streams into Stream of triples : Stream<Array>
      // combine guarantees availability of all values
      // without streams we would need to wait from several sources
      .combine(
        vtree$, 
        context$, 
        bundle$.take(1)
      )

      // wrap into container and inject scripts
      .map(wrapVTreeWithHTMLBoilerplate)

      // last vNode stream
      .last();

    return {

      // stream of vNode with scripts injected
      DOM: wrappedVTree$
    };
  };


// compile the bundle script to run in the client's browser
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

// setup Express middleware
server.use(function (req, res) {

  // Ignore favicon requests
  if (req.url === '/favicon.ico') {
    res.writeHead(200, {'Content-Type': 'image/x-icon'});
    res.end();
    return;
  }

  console.log(`req: ${req.method} ${req.url}`);

  // Wrap requested 'url' as route Stream<Object>
  let context$ = xs.of({route: req.url});

  let wrappedAppFn = wrapAppResultWithBoilerplate(
    app, 
    context$, 
    clientBundle$
  );

  Cycle.run(wrappedAppFn, {
    DOM: makeHTMLDriver(html => res.send(prependHTML5Doctype(html))),

    // context evaluates to stream of route objects
    // (emitted once and immediately)
    context: () => context$,
    PreventDefault: () => {},
  });
});


let port = process.env.PORT || 3000;
server.listen(port);
console.log(`Listening on port ${port}`);
