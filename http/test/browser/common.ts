import * as assert from 'assert';
import {
  RequestInput,
  Response,
  ResponseStream,
  RequestOptions,
} from '../../src/index';
import {Stream} from 'xstream';
import {HTTPSource, makeHTTPDriver} from '../../src/rxjs';
import {Observable, of, merge, Subject} from 'rxjs';
import {mergeAll, switchMap, map, delay, shareReplay} from 'rxjs/operators';
import {setup} from '@cycle/rxjs-run';
import isolate from '@cycle/isolate';

export function runTests(uri: string) {
  describe('makeHTTPDriver', function() {
    it('should be a driver factory', function() {
      assert.strictEqual(typeof makeHTTPDriver, 'function');
      const output = makeHTTPDriver();
      assert.strictEqual(typeof output, 'function');
    });
  });

  describe('HTTP Driver', function() {
    this.timeout(8000);

    it('should throw when request stream emits neither string nor object', function(done) {
      function main(_sources: {HTTP: HTTPSource}) {
        return {
          HTTP: of(123 as any),
        };
      }

      const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});

      sources.HTTP.select()
        .pipe(mergeAll())
        .subscribe({
          next: () => {
            done('next should not be called');
          },
          error: (err: any) => {
            assert.strictEqual(
              err.message,
              'Observable of requests given to ' +
                'HTTP Driver must emit either URL strings or objects with ' +
                'parameters.'
            );
            done();
          },
          complete: () => {
            done('complete should not be called');
          },
        });
      run();
    });

    it('should throw when given options object without url string', function(done) {
      function main(_sources: {HTTP: HTTPSource}) {
        return {
          HTTP: of({method: 'post'} as any),
        };
      }

      const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});

      sources.HTTP.select()
        .pipe(mergeAll())
        .subscribe({
          next: () => {
            done('next should not be called');
          },
          error: (err: any) => {
            assert.strictEqual(
              err.message,
              'Please provide a `url` property in the request ' + 'options.'
            );
            done();
          },
          complete: () => {
            done('complete should not be called');
          },
        });
      run();
    });

    it('should return response metastream when given a simple URL string', function(done) {
      function main(_sources: {HTTP: HTTPSource}) {
        return {
          HTTP: of(uri + '/hello'),
        };
      }

      const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});
      const response$$ = sources.HTTP.select();
      assert.strictEqual(typeof response$$.pipe, 'function'); // is RxJS v5

      response$$.subscribe({
        next: response$ => {
          assert.strictEqual(typeof response$.request, 'object');
          assert.strictEqual(response$.request.url, uri + '/hello');
          assert.strictEqual(typeof response$.pipe, 'function'); // is RxJS v5
          response$.subscribe(function(response: any) {
            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.text, 'Hello World');
            done();
          });
        },
      });
      run();
    });

    it('should return HTTPSource with isolateSource and isolateSink', function(done) {
      function main(_sources: {HTTP: HTTPSource}) {
        return {
          HTTP: of(uri + '/hello'),
        };
      }

      const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});
      const httpSource = sources.HTTP;

      run();
      assert.strictEqual(typeof sources.HTTP.isolateSource, 'function');
      assert.strictEqual(typeof sources.HTTP.isolateSink, 'function');
      done();
    });

    it('should return response metastream when given simple options obj', function(done) {
      function main(_sources: {HTTP: HTTPSource}) {
        return {
          HTTP: of({
            url: uri + '/pet',
            method: 'POST',
            send: {name: 'Woof', species: 'Dog'},
          }),
        };
      }

      const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});

      const response$$ = sources.HTTP.select();
      response$$.subscribe(function(response$) {
        assert.strictEqual(response$.request.url, uri + '/pet');
        assert.strictEqual(response$.request.method, 'POST');
        assert.strictEqual((response$.request.send as any).name, 'Woof');
        assert.strictEqual((response$.request.send as any).species, 'Dog');
        response$.subscribe(function(response: any) {
          assert.strictEqual(response.status, 200);
          assert.strictEqual(response.text, 'added Woof the Dog');
          done();
        });
      });
      run();
    });

    it('should return response metastream when send with type string [#674]', function(done) {
      function main(_sources: {HTTP: HTTPSource}) {
        return {
          HTTP: of({
            url: uri + '/pet',
            method: 'POST',
            send: 'name=Woof&species=Dog',
          }),
        };
      }

      const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});

      const response$$ = sources.HTTP.select();
      response$$.subscribe(function(response$) {
        assert.strictEqual(response$.request.url, uri + '/pet');
        assert.strictEqual(response$.request.method, 'POST');
        assert.strictEqual(
          response$.request.send as string,
          'name=Woof&species=Dog'
        );
        response$.subscribe(function(response: any) {
          assert.strictEqual(response.status, 200);
          assert.strictEqual(response.text, 'added Woof the Dog');
          done();
        });
      });
      run();
    });

    it('should have DevTools flag in select() source stream', function(done) {
      function main(_sources: {HTTP: HTTPSource}) {
        return {
          HTTP: of({
            url: uri + '/pet',
            method: 'POST',
            send: {name: 'Woof', species: 'Dog'},
          }),
        };
      }

      const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});

      const response$$ = sources.HTTP.select();
      assert.strictEqual((response$$ as any)._isCycleSource, 'HTTP');
      done();
      run();
    });

    it('should have DevTools flag in response$$ source stream', function(done) {
      function main(_sources: {HTTP: HTTPSource}) {
        return {
          HTTP: of({
            url: uri + '/pet',
            method: 'POST',
            send: {name: 'Woof', species: 'Dog'},
          }),
        };
      }

      const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});

      const response$$ = sources.HTTP.select();
      assert.strictEqual((response$$ as any)._isCycleSource, 'HTTP');
      done();
      run();
    });

    it('should return response metastream when given another options obj', function(done) {
      function main(_sources: {HTTP: HTTPSource}) {
        return {
          HTTP: of({
            url: uri + '/querystring',
            method: 'GET',
            query: {foo: 102030, bar: 'Pub'},
          }),
        };
      }

      const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});

      const response$$ = sources.HTTP.select();
      response$$.subscribe(function(response$) {
        assert.strictEqual(response$.request.url, uri + '/querystring');
        assert.strictEqual(response$.request.method, 'GET');
        assert.strictEqual((response$.request.query as any).foo, 102030);
        assert.strictEqual((response$.request.query as any).bar, 'Pub');
        response$.subscribe(function(response: any) {
          assert.strictEqual(response.status, 200);
          assert.strictEqual(response.body.foo, '102030');
          assert.strictEqual(response.body.bar, 'Pub');
          done();
        });
      });
      run();
    });

    it('should return response metastream when given yet another options obj', function(done) {
      function main(_sources: {HTTP: HTTPSource}) {
        return {
          HTTP: of({
            url: uri + '/delete',
            method: 'DELETE',
            query: {foo: 102030, bar: 'Pub'},
          }),
        };
      }

      const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});
      const response$$ = sources.HTTP.select();

      response$$.subscribe(function(response$) {
        assert.strictEqual(response$.request.url, uri + '/delete');
        assert.strictEqual(response$.request.method, 'DELETE');
        response$.subscribe(function(response: any) {
          assert.strictEqual(response.status, 200);
          assert.strictEqual(response.body.deleted, true);
          done();
        });
      });
      run();
    });

    it("should not be possible to change the metastream's request", function(done) {
      function main(_sources: {HTTP: HTTPSource}) {
        return {
          HTTP: of({
            url: uri + '/hello',
            method: 'GET',
          }),
        };
      }

      const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});

      sources.HTTP.select()
        .pipe(
          map(response$ => {
            response$.request = 1234 as any;
            return response$;
          })
        )
        .subscribe(
          function next(response$) {
            done('next should not be called');
          },
          err => {
            assert.strictEqual(err instanceof TypeError, true);
            done();
          }
        );
      run();
    });

    it('should send 500 server errors to response$ onError', function(done) {
      function main(_sources: {HTTP: HTTPSource}) {
        return {
          HTTP: of(uri + '/error'),
        };
      }

      const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});
      const response$$ = sources.HTTP.select();

      response$$.subscribe(function(response$) {
        assert.strictEqual(typeof response$.request, 'object');
        assert.strictEqual(response$.request.url, uri + '/error');
        response$.subscribe({
          next: () => {
            done('next should not be called');
          },
          error: (err: any) => {
            assert.strictEqual(err.status, 500);
            assert.strictEqual(err.message, 'Internal Server Error');
            assert.strictEqual(err.response.text, 'boom');
            done();
          },
          complete: () => {
            done('complete should not be called');
          },
        });
      });
      run();
    });

    it('should not be sensitive to ordering of sinks (issue #476)', function(done) {
      function main(_sources: {HTTP: HTTPSource}) {
        const request$ = of({
          url: uri + '/hello',
          method: 'GET',
        });
        const str$ = _sources.HTTP.select().pipe(
          mergeAll(),
          map((res: any) => res.text as string)
        );

        // Notice HTTP comes before Test here. This is crucial for this test.
        return {
          HTTP: request$,
          Test: str$,
        };
      }
      const testDriverExpected = ['Hello World'];

      function testDriver(sink: Stream<string>) {
        sink.subscribe({
          next: x => {
            assert.strictEqual(testDriverExpected.length, 1);
            assert.strictEqual(x, testDriverExpected.shift());
            assert.strictEqual(testDriverExpected.length, 0);
            done();
          },
        });
      }

      const {sources, run} = setup(main, {
        HTTP: makeHTTPDriver(),
        Test: testDriver,
      });
      run();
    });
  });

  describe('isolateSource and isolateSink', function() {
    it('should exist on the HTTPSource', function(done) {
      function main(_sources: {HTTP: HTTPSource}) {
        return {
          HTTP: new Subject<RequestOptions>(),
        };
      }
      const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});

      assert.strictEqual(typeof sources.HTTP.isolateSource, 'function');
      assert.strictEqual(typeof sources.HTTP.isolateSink, 'function');
      done();
    });

    it('should exist on a scoped HTTPSource', function(done) {
      function main(_sources: {HTTP: HTTPSource}) {
        return {
          HTTP: new Subject<RequestOptions>(),
        };
      }
      const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});

      const scopedHTTPSource = sources.HTTP.isolateSource(sources.HTTP, 'foo');

      assert.strictEqual(typeof scopedHTTPSource.isolateSource, 'function');
      assert.strictEqual(typeof scopedHTTPSource.isolateSink, 'function');
      done();
    });

    it('should hide responses from outside the scope', function(done) {
      const proxyRequest$ = new Subject<RequestOptions>();
      function main(_sources: {HTTP: HTTPSource}) {
        return {
          HTTP: proxyRequest$,
        };
      }

      const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});

      const ignoredRequest$ = of(uri + '/json');
      const request$ = of(uri + '/hello').pipe(delay(10));
      const scopedRequest$ = sources.HTTP.isolateSink(request$, 'foo');
      const scopedHTTPSource = sources.HTTP.isolateSource(sources.HTTP, 'foo');

      scopedHTTPSource.select().subscribe(function(response$) {
        assert.strictEqual(typeof response$.request, 'object');
        assert.strictEqual(response$.request.url, uri + '/hello');
        response$.subscribe(function(response: any) {
          assert.strictEqual(response.status, 200);
          assert.strictEqual(response.text, 'Hello World');
          done();
        });
      });

      merge(ignoredRequest$, scopedRequest$).subscribe(proxyRequest$ as any);

      run();
    });

    it('should hide responses even if using the same scope multiple times', function(done) {
      const proxyRequest$ = new Subject<RequestOptions>();
      function main(_sources: {HTTP: HTTPSource}) {
        return {
          HTTP: proxyRequest$,
        };
      }

      const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});

      const ignoredRequest$ = of(uri + '/json');
      const request$ = of(uri + '/hello').pipe(delay(10));
      const fooInsideBarRequest$ = sources.HTTP.isolateSink(
        sources.HTTP.isolateSink(request$, 'foo'),
        'bar'
      ).pipe(shareReplay());
      const fooInsideBarHTTPSource = sources.HTTP.isolateSource(
        sources.HTTP.isolateSource(sources.HTTP, 'bar'),
        'foo'
      );
      const fooInsideFooHTTPSource = sources.HTTP.isolateSource(
        sources.HTTP.isolateSource(sources.HTTP, 'foo'),
        'foo'
      );

      fooInsideFooHTTPSource.select().subscribe(function(response$) {
        assert(false);
        done('should not be called');
      });

      fooInsideBarHTTPSource.select().subscribe(function(response$) {
        assert.strictEqual(typeof response$.request, 'object');
        assert.strictEqual(response$.request.url, uri + '/hello');
        response$.subscribe(function(response) {
          assert.strictEqual(response.status, 200);
          assert.strictEqual(response.text, 'Hello World');
          done();
        });
      });

      merge(ignoredRequest$, fooInsideBarRequest$).subscribe(
        proxyRequest$ as any
      );

      run();
    });

    it('should emit responses when isolated many scopes deep', function(done) {
      let dispose: any;
      function main(_sources: {HTTP: HTTPSource}) {
        _sources.HTTP.select('hello').subscribe(function(response$) {
          assert.strictEqual(typeof response$.request, 'object');
          assert.strictEqual(response$.request.url, uri + '/hello');
          response$.subscribe(function(response) {
            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.text, 'Hello World');
            dispose();
            done();
          });
        });

        return {
          HTTP: of({
            url: uri + '/hello',
            category: 'hello',
          }).pipe(delay(10)),
        };
      }

      function wrapper1(_sources: {HTTP: HTTPSource}) {
        return isolate(main, {HTTP: 'wrapper1'})(_sources);
      }

      function wrapper2(_sources: {HTTP: HTTPSource}) {
        return isolate(wrapper1, {HTTP: 'wrapper2'})(_sources);
      }

      const {sources, run} = setup(wrapper2, {HTTP: makeHTTPDriver()});

      dispose = run();
    });

    it('should allow null scope to bypass isolation', function(done) {
      const proxyRequest$ = new Subject<any>();
      function main(_sources: {HTTP: HTTPSource}) {
        return {
          HTTP: proxyRequest$,
        };
      }

      const {sources, run} = setup(main, {HTTP: makeHTTPDriver()});

      const ignoredRequest$ = of(uri + '/json');
      const request$ = of(uri + '/hello').pipe(delay(100));
      const scopedRequest$ = sources.HTTP.isolateSink(proxyRequest$, null);
      const scopedHTTPSource = sources.HTTP.isolateSource(sources.HTTP, null);

      const expected = [uri + '/json', uri + '/hello'];

      scopedHTTPSource.select().subscribe(function(response$: any) {
        assert.strictEqual(typeof response$.request, 'object');
        assert.strictEqual(response$.request.url, expected.shift());
        if (expected.length === 0) {
          done();
        }
      });

      run();

      merge(ignoredRequest$, request$).subscribe(proxyRequest$);
    });
  });
}
