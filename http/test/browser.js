'use strict';
var Rx = require('rx');
var assert = require('assert');
var src = require('../lib/index');
var Rx = require('rx');
var makeHTTPDriver = src.makeHTTPDriver;
var uri = '//' + window.location.host;
require('./common')(uri);

describe('HTTP Driver in the browser', function () {
  it('should be able to emit progress events on the response stream', function(done) {
    var request$ = Rx.Observable.just({
      url: uri + '/querystring',
      method: 'GET',
      progress: true,
      query: {foo: 102030, bar: 'Pub'}
    });
    var httpDriver = makeHTTPDriver();
    var response$$ = httpDriver(request$);
    response$$.subscribe(function(response$) {
      assert.strictEqual(response$.request.url, uri + '/querystring');
      assert.strictEqual(response$.request.method, 'GET');
      assert.strictEqual(response$.request.query.foo, 102030);
      assert.strictEqual(response$.request.query.bar, 'Pub');
      var progressEventHappened = false;
      response$.subscribe(function(response) {
        if (response.type === 'progress') {
          assert.strictEqual(typeof response.total, 'number');
          progressEventHappened = true;
        } else {
          assert.strictEqual(progressEventHappened, true);
          assert.strictEqual(response.status, 200);
          assert.strictEqual(response.body.foo, '102030');
          assert.strictEqual(response.body.bar, 'Pub');
          done();
        }
      });
    });
  });
});
