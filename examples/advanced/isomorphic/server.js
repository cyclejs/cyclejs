import {run} from '@cycle/run';
import {Stream as xs} from 'xstream';
import {makeHTMLDriver} from '@cycle/html';
import express from 'express';
import {build} from 'esbuild';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {html, head, title, body, div, script} from './view.js';
import app from './app.js';

function wrapVTreeWithHTMLBoilerplate([vtree, context]) {
  return html([
    head([title('Cycle Isomorphism Example')]),
    body([
      div(
        '.app-container',
        {attrs: {'data-app-context': JSON.stringify(context)}},
        [vtree]
      ),
      script({attrs: {src: '/client.js', defer: true}}),
    ]),
  ]);
}

export async function buildClientBundle() {
  const result = await build({
    entryPoints: [fileURLToPath(new URL('./client.js', import.meta.url))],
    bundle: true,
    minify: true,
    write: false,
    platform: 'browser',
    format: 'iife',
  });
  return result.outputFiles[0].text;
}

export function createServer(clientBundle) {
  const server = express();
  server.get('/client.js', (req, res) => {
    res.type('application/javascript').send(clientBundle);
  });
  server.get('/favicon.ico', (req, res) => res.status(204).end());
  server.get('*', (req, res, next) => {
    const context$ = xs.of({route: req.path});
    const wrappedApp = sources => ({
      DOM: xs
        .combine(app(sources).DOM, context$)
        .take(1)
        .map(wrapVTreeWithHTMLBoilerplate),
    });
    try {
      const dispose = run(wrappedApp, {
        DOM: makeHTMLDriver(markup =>
          res.type('html').send('<!doctype html>' + markup)
        ),
        context: () => context$,
        PreventDefault: () => {},
      });
      res.once('close', dispose);
    } catch (error) {
      next(error);
    }
  });
  return server;
}

export async function startServer({
  port = Number(process.env.PORT || 3000),
  host = process.env.HOST || '127.0.0.1',
} = {}) {
  const server = createServer(await buildClientBundle());
  return new Promise((resolve, reject) => {
    const listener = server.listen(port, host, () => resolve(listener));
    listener.once('error', reject);
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  startServer()
    .then(server => {
      const address = server.address();
      console.log(
        'Listening on http://' + address.address + ':' + address.port
      );
    })
    .catch(error => {
      console.error(error);
      process.exitCode = 1;
    });
}
