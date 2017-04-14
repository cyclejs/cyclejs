import 'mocha';
import * as assert from 'assert';
import { mockHTTPSource } from '../../lib/index';
import xs from 'xstream';

describe('mockHttpSource', function () {
  it('should be in accessible in the API', function () {
    assert.strictEqual(typeof mockHTTPSource, 'function');
  });

  it('should make an empty Observable stream of http responses on category foo', function (done) {
    const userEvents = mockHTTPSource({
      'foo': xs.empty(),
    });
    userEvents.select('foo').subscribe({
      next: () => done(new Error('Should not emit any value')),
      error: (err: any) => done(err),
      complete: () => done(),
    });
  });
});
