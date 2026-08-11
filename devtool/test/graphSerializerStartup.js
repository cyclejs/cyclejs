const assert = require('assert');
const {
  selectGraphSerializerStartAction,
  sinksAreXStream,
} = require('../lib/graphSerializerStartup');

const xstreamSinks = {
  DOM: {setDebugListener() {}},
};
const incompatibleSinks = {
  DOM: {subscribe() {}},
};

assert.strictEqual(sinksAreXStream(null), false);
assert.strictEqual(sinksAreXStream(incompatibleSinks), false);
assert.strictEqual(sinksAreXStream(xstreamSinks), true);

assert.strictEqual(
  selectGraphSerializerStartAction(null, false, false),
  'show-invalid'
);
assert.strictEqual(
  selectGraphSerializerStartAction(incompatibleSinks, false, false),
  'show-invalid'
);
assert.strictEqual(
  selectGraphSerializerStartAction(null, false, true),
  'ignore'
);
assert.strictEqual(
  selectGraphSerializerStartAction(incompatibleSinks, false, true),
  'ignore'
);
assert.strictEqual(
  selectGraphSerializerStartAction(xstreamSinks, false, false),
  'start'
);
assert.strictEqual(
  selectGraphSerializerStartAction(xstreamSinks, false, true),
  'start'
);
assert.strictEqual(
  selectGraphSerializerStartAction(xstreamSinks, true, false),
  'ignore'
);
assert.strictEqual(
  selectGraphSerializerStartAction(null, true, true),
  'ignore'
);

console.log('graph serializer startup tests passed');
