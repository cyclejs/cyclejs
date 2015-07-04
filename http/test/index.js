'use strict';
/* global describe, it */
let assert = require('assert');
let {makeHTTPDriver} = require('../src/index');
let {Rx} = require('@cycle/core');

var NODE = true;
var uri = 'http://localhost:5000';
if (typeof window !== 'undefined') {
  NODE = false;
  uri = '//' + window.location.host;
}
else {
  process.env.ZUUL_PORT = 5000;
  require('./support/server');
  uri = 'http://localhost:5000';
}

describe('makeHTTPDriver', function () {
  it('should be a driver factory', function () {
    assert.strictEqual(typeof makeHTTPDriver, 'function');
    let output = makeHTTPDriver();
    assert.strictEqual(typeof output, 'function');
  });
});

describe('HTTP Driver', function () {
  it('should throw when request stream emits neither string nor object', (done) => {
    let request$ = Rx.Observable.just(123);
    let httpDriver = makeHTTPDriver();
    let response$$ = httpDriver(request$);
    response$$.mergeAll().subscribe(
      function onNext() { assert.fail(); },
      function onError(err) {
        assert.strictEqual(err.message, 'Observable of requests given to ' +
          'HTTP Driver must emit either URL strings or objects with parameters.'
        );
        done();
      }
    );
  });

  it('should throw when given options object without url string', (done) => {
    let request$ = Rx.Observable.just({method: 'post'});
    let httpDriver = makeHTTPDriver();
    let response$$ = httpDriver(request$);
    response$$.mergeAll().subscribe(
      function onNext() { assert.fail(); },
      function onError(err) {
        assert.strictEqual(
          err.message, 'Please provide a `url` property in the request options.'
        );
        done();
      }
    );
  });

  it('should return response metastream when given a simple URL string', (done) => {
    let request$ = Rx.Observable.just(uri + '/hello');
    let httpDriver = makeHTTPDriver();
    let response$$ = httpDriver(request$);
    response$$.subscribe(response$ => {
      assert.strictEqual(response$.request, uri + '/hello');
      response$.subscribe(response => {
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.text, 'Hello World');
        done();
      });
    });
  });

  it('should return response metastream when given simple options obj', (done) => {
    let request$ = Rx.Observable.just({
      url: uri + '/pet',
      method: 'POST',
      send: {name: 'Woof', species: 'Dog'}
    });
    let httpDriver = makeHTTPDriver();
    let response$$ = httpDriver(request$);
    response$$.subscribe(response$ => {
      assert.strictEqual(response$.request.url, uri + '/pet');
      assert.strictEqual(response$.request.method, 'POST');
      assert.strictEqual(response$.request.send.name, 'Woof');
      assert.strictEqual(response$.request.send.species, 'Dog');
      response$.subscribe(response => {
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.text, 'added Woof the Dog');
        done();
      });
    });
  });

  it('should return response metastream when given another options obj', (done) => {
    let request$ = Rx.Observable.just({
      url: uri + '/querystring',
      method: 'GET',
      query: {foo: 102030, bar: 'Pub'}
    });
    let httpDriver = makeHTTPDriver();
    let response$$ = httpDriver(request$);
    response$$.subscribe(response$ => {
      assert.strictEqual(response$.request.url, uri + '/querystring');
      assert.strictEqual(response$.request.method, 'GET');
      assert.strictEqual(response$.request.query.foo, 102030);
      assert.strictEqual(response$.request.query.bar, 'Pub');
      response$.subscribe(response => {
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.foo, '102030');
        assert.strictEqual(response.body.bar, 'Pub');
        done();
      });
    });
  });

  it('should send 500 server errors to response$ onError', (done) => {
    let request$ = Rx.Observable.just(uri + '/error');
    let httpDriver = makeHTTPDriver();
    let response$$ = httpDriver(request$);
    response$$.subscribe(response$ => {
      assert.strictEqual(response$.request, uri + '/error');
      response$.subscribe(
        function onNext() { assert.fail(); },
        function onError(err) {
          assert.strictEqual(err.status, 500);
          assert.strictEqual(err.message, 'Internal Server Error');
          assert.strictEqual(err.response.text, 'boom');
          done();
        }
      );
    });
  });
});
