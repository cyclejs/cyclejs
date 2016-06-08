'use strict';
/* global describe, it */
var assert = require('assert');
var src = require('../lib/index');
var Rx = require('rxjs');
var Cycle = require('@cycle/rxjs-run').default;
var makeHTTPDriver = src.makeHTTPDriver;

function run(uri) {
  describe('makeHTTPDriver', function () {
    it('should be a driver factory', function () {
      assert.strictEqual(typeof makeHTTPDriver, 'function');
      var output = makeHTTPDriver();
      assert.strictEqual(typeof output, 'function');
    });
  });

  describe('HTTP Driver', function () {
    it('should throw when request stream emits neither string nor object',
      function(done) {
        function main(sources) {
          return {
            HTTP: Rx.Observable.of(123)
          }
        }

        var output = Cycle(main, { HTTP: makeHTTPDriver() });
        output.sources.HTTP.response$$.mergeAll().subscribe(
          function next() { assert.fail(); },
          function error(err) {
            assert.strictEqual(err.message, 'Observable of requests given to ' +
              'HTTP Driver must emit either URL strings or objects with ' +
              'parameters.'
            );
            done();
          },
          function complete() { assert.fail(); }
        );
        output.run();
      }
    );

    it('should throw when given options object without url string',
      function(done) {
        function main() {
          return {
            HTTP: Rx.Observable.of({method: 'post'})
          }
        }
        var output = Cycle(main, { HTTP: makeHTTPDriver() });
        output.sources.HTTP.response$$.mergeAll().subscribe(
          function next() { assert.fail(); },
          function error(err) {
            assert.strictEqual(
              err.message, 'Please provide a `url` property in the request ' +
              'options.'
            );
            done();
          },
          function complete() { assert.fail(); }
        );
        output.run();
      }
    );

    it('should return response metastream when given a simple URL string',
      function(done) {
        function main() {
          return {
            HTTP: Rx.Observable.of(uri + '/hello')
          }
        }

        var output = Cycle(main, { HTTP: makeHTTPDriver() });

        output.sources.HTTP.response$$.subscribe(function(response$) {
          assert.strictEqual(typeof response$.request, 'object');
          assert.strictEqual(response$.request.url, uri + '/hello');
          response$.subscribe(function(response) {
            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.text, 'Hello World');
            done();
          });
        });
        output.run();
      }
    );

    it('should return HTTPSource with isolateSource and isolateSink',
      function(done) {
        function main() {
          return {
            HTTP: Rx.Observable.of(uri + '/hello')
          }
        }
        var output = Cycle(main, { HTTP: makeHTTPDriver() });
        output.run();
        var httpSource = output.sources.HTTP;
        assert.strictEqual(typeof httpSource.isolateSource, 'function');
        assert.strictEqual(typeof httpSource.isolateSink, 'function');
        done();
      }
    );

    it('should return response metastream when given simple options obj',
      function(done) {
        function main() {
          return {
            HTTP: Rx.Observable.of({
              url: uri + '/pet',
              method: 'POST',
              send: {name: 'Woof', species: 'Dog'}
            })
          };
        }

        var output = Cycle(main, { HTTP: makeHTTPDriver() });

        var response$$ = output.sources.HTTP.select();
        response$$.subscribe(function(response$) {
          assert.strictEqual(response$.request.url, uri + '/pet');
          assert.strictEqual(response$.request.method, 'POST');
          assert.strictEqual(response$.request.send.name, 'Woof');
          assert.strictEqual(response$.request.send.species, 'Dog');
          response$.subscribe(function(response) {
            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.text, 'added Woof the Dog');
            done();
          });
        });
        output.run();
      }
    );

    it('should return response metastream when given another options obj',
      function(done) {
        function main() {
          return {
            HTTP: Rx.Observable.of({
              url: uri + '/querystring',
              method: 'GET',
              query: {foo: 102030, bar: 'Pub'}
            })
          }
        }

        var output = Cycle(main, { HTTP: makeHTTPDriver() });

        var response$$ = output.sources.HTTP.response$$;
        response$$.subscribe(function(response$) {
          assert.strictEqual(response$.request.url, uri + '/querystring');
          assert.strictEqual(response$.request.method, 'GET');
          assert.strictEqual(response$.request.query.foo, 102030);
          assert.strictEqual(response$.request.query.bar, 'Pub');
          response$.subscribe(function(response) {
            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.body.foo, '102030');
            assert.strictEqual(response.body.bar, 'Pub');
            done();
          });
        });
        output.run();
      }
    );

    it('should return response metastream when given yet another options obj',
      function(done) {
        function main() {
          return {
            HTTP: Rx.Observable.of({
              url: uri + '/delete',
              method: 'DELETE',
              query: {foo: 102030, bar: 'Pub'}
            })
          }
        }

        var output = Cycle(main, { HTTP: makeHTTPDriver() });
        var response$$ = output.sources.HTTP.response$$;

        response$$.subscribe(function(response$) {
          assert.strictEqual(response$.request.url, uri + '/delete');
          assert.strictEqual(response$.request.method, 'DELETE');
          response$.subscribe(function(response) {
            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.body.deleted, true);
            done();
          });
        });
        output.run();
      }
    );

    it('should not be possible to change the metastream\'s request',
      function () {
        function main() {
          return {
            HTTP: Rx.Observable.of({
              url: uri + '/hello',
              method: 'GET'
            })
          }
        }

        var output = Cycle(main, { HTTP: makeHTTPDriver() });
        var response$$ = output.sources.HTTP.response$$;

        response$$
          .map(function (response$) {
            response$.request = 1234;
            return response$;
          })
          .subscribe(function next(response$) {
            assert.fail();
          }, function error(err) {
            assert.strictEqual(err instanceof TypeError, true);
          });
        output.run();
      }
    )

    it('should send 500 server errors to response$ onError',
      function(done) {
        function main() {
          return {
            HTTP: Rx.Observable.of(uri + '/error')
          }
        }

        var output = Cycle(main, { HTTP: makeHTTPDriver() });
        var response$$ = output.sources.HTTP.response$$;

        response$$.subscribe(function(response$) {
          assert.strictEqual(typeof response$.request, 'object');
          assert.strictEqual(response$.request.url, uri + '/error');
          response$.subscribe(
            function next() { assert.fail(); },
            function error(err) {
              assert.strictEqual(err.status, 500);
              assert.strictEqual(err.message, 'Internal Server Error');
              assert.strictEqual(err.response.text, 'boom');
              done();
            },
            function complete() { assert.fail(); }
          );
        });
        output.run();
      }
    );
  });

  describe('isolateSource and isolateSink', function () {
    it('should exist on the HTTPSource', function(done) {
      function main() {
        return {
          HTTP: new Rx.Subject()
        }
      }
      var output = Cycle(main, { HTTP: makeHTTPDriver() });
      var httpSource = output.sources.HTTP;

      assert.strictEqual(typeof httpSource.isolateSource, 'function');
      assert.strictEqual(typeof httpSource.isolateSink, 'function');
      done();
    });

    it('should exist on a scoped HTTPSource', function(done) {
      function main() {
        return {
          HTTP: new Rx.Subject()
        }
      }
      var output = Cycle(main, { HTTP: makeHTTPDriver() });
      var httpSource = output.sources.HTTP;

      var scopedHTTPSource = httpSource.isolateSource(httpSource, 'foo');

      assert.strictEqual(typeof scopedHTTPSource.isolateSource, 'function');
      assert.strictEqual(typeof scopedHTTPSource.isolateSink, 'function');
      done();
    });

    it('should hide responses from outside the scope',
      function(done) {
        var proxyRequest$ = new Rx.Subject();
        function main() {
          return {
            HTTP: proxyRequest$
          }
        }

        var output = Cycle(main, { HTTP: makeHTTPDriver() });
        var httpSource = output.sources.HTTP;

        var ignoredRequest$ = Rx.Observable.of(uri + '/json');
        var request$ = Rx.Observable.of(uri + '/hello').delay(10);
        var scopedRequest$ = httpSource.isolateSink(request$, 'foo');
        var scopedHTTPSource = httpSource.isolateSource(httpSource, 'foo');

        scopedHTTPSource.response$$.subscribe(function(response$) {
          assert.strictEqual(typeof response$.request, 'object');
          assert.strictEqual(response$.request.url, uri + '/hello');
          response$.subscribe(function(response) {
            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.text, 'Hello World');
            done();
          });
        });

        Rx.Observable.merge(ignoredRequest$, scopedRequest$)
          .subscribe(proxyRequest$);

        output.run();
      }
    );
  });
}

module.exports = run;
