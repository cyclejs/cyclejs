import assert from 'node:assert/strict';
import {after, before, test} from 'node:test';
import {startServer} from '../server.js';

let server;
let origin;
before(async () => {
  server = await startServer({port: 0, host: '127.0.0.1'});
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
});

for (const [route, expected] of [
  ['/', 'The homepage'],
  ['/about', 'Read more about us'],
  ['/about?from=test', 'Read more about us'],
  ['/missing', 'Unknown page /missing'],
]) {
  test(`renders ${route} before client JavaScript runs`, async () => {
    const response = await fetch(origin + route);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    const text = await response.text();
    assert.match(text, /^<!doctype html>/i);
    assert.ok(text.includes(expected));
    assert.ok(text.includes('data-app-context'));
    assert.ok(text.includes('src="/client.js"'));
  });
}

test('serves a real browser bundle separately', async () => {
  const response = await fetch(origin + '/client.js');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /javascript/);
  assert.ok((await response.text()).length > 1000);
});

test('favicon does not render an application page', async () => {
  const response = await fetch(origin + '/favicon.ico');
  assert.equal(response.status, 204);
});
