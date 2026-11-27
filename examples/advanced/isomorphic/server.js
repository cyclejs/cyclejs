import {run} from '@cycle/run';
import {Stream as xs} from 'xstream';
import express from 'express';
import * as esbuild from 'esbuild';
import serialize from 'serialize-javascript';
import {h} from 'snabbdom/build/h.js';
import {makeHTMLDriver} from '@cycle/html';
import app from './app.js';

function wrapVTreeWithHTMLBoilerplate([vtree, context]) {
  return h('html', {}, [
    h('head', {}, [h('title', {}, 'Cycle Isomorphism Example')]),
    h('body', {}, [
      h('div.app-container', {}, [vtree]),
      h('script', {props: {innerHTML: `window.appContext = ${serialize(context)};`}}),
      h('script', {attrs: {src: '/client.js'}}),
    ]),
  ]);
}

function prependHTML5Doctype(html) {
  return `<!doctype html>${html}`;
}

function wrapAppResultWithBoilerplate(appFn, context$) {
  return function wrappedAppFn(sources) {
    const vdom$ = appFn(sources).DOM;
    const wrappedVDOM$ = xs
      .combine(vdom$.take(1), context$.take(1))
      .map(wrapVTreeWithHTMLBoilerplate);

    return {
      DOM: wrappedVDOM$,
    };
  };
}

const bundleResult = await esbuild.build({
  entryPoints: ['client.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  write: false,
});
const clientBundle = bundleResult.outputFiles[0].text;

const server = express();

server.get('/client.js', (req, res) => {
  res.type('application/javascript').send(clientBundle);
});

server.use(function (req, res) {
  // Ignore favicon requests
  if (req.url === '/favicon.ico') {
    res.writeHead(200, {'Content-Type': 'image/x-icon'});
    res.end();
    return;
  }
  console.log(`req: ${req.method} ${req.url}`);

  const context$ = xs.of({route: req.url});
  const wrappedAppFn = wrapAppResultWithBoilerplate(app, context$);

  run(wrappedAppFn, {
    DOM: makeHTMLDriver(html => res.send(prependHTML5Doctype(html))),
    context: () => context$,
    PreventDefault: () => {},
  });
});

const port = process.env.PORT || 3000;
server.listen(port);
console.log(`Listening on port ${port}`);
