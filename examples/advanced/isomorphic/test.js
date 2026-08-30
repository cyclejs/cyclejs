const assert = require('assert');
const path = require('path');
const babel = require('@babel/core');
const xs = require('xstream').default;
const {div} = require('@cycle/dom');
const {makeHTMLDriver} = require('@cycle/html');

for (const file of ['app.js', 'client.js', 'server.js']) {
  const result = babel.transformFileSync(path.join(__dirname, file));
  assert(result && result.code, `${file} should compile with the example's Babel config`);
}

let rendered;
const source = makeHTMLDriver(html => {
  rendered = html;
})(
  xs.of(div('.app-container', [div('.test', 'Hello from the server')])),
  'DOM'
);

assert.strictEqual(
  rendered,
  '<div class="app-container"><div class="test">Hello from the server</div></div>'
);
assert.strictEqual(typeof source.select, 'function');

console.log('Isomorphic compilation and server-side HTML rendering passed.');
