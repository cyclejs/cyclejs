import * as assert from 'assert';
import { of, pipe, subscribe, flatten, map, Producer } from '@cycle/callbags';
import { RequestFn, Response } from '@minireq/browser';
import { run, Driver, Plugin } from '@cycle/run';

import { HttpApi, makeHttpPlugin } from '../src/index';

export function runTests(uri: string, request: RequestFn) {
  describe('common tests between Node.js and the browser', function() {
    this.timeout(8000);

    it('should throw when request stream emits neither string nor object', done => {
      function main(sources: { HTTP: HttpApi }) {
        pipe(
          sources.HTTP.response$$,
          flatten,
          subscribe(
            () => done('should not deliver data'),
            err => {
              assert.strictEqual(
                err.message,
                'Observable of requests given to ' +
                  'HTTP Driver must emit either URL strings or objects with ' +
                  'parameters.'
              );

              done();
            }
          )
        );

        return {
          HTTP: of(123 as any)
        };
      }

      const plugins = {
        HTTP: makeHttpPlugin(request)
      };

      run(main, plugins, []);
    });

    it('should throw when given options object without url string', done => {
      function main(sources: { HTTP: HttpApi }) {
        pipe(
          sources.HTTP.post({ method: 'POST' } as any),
          subscribe(
            () => done('should not deliver data'),
            err => {
              assert.strictEqual(
                err.message,
                'Please provide a `url` property in the request ' + 'options.'
              );
              done();
            }
          )
        );
        return {
          HTTP: of({ method: 'post' } as any)
        };
      }

      const plugins = {
        HTTP: makeHttpPlugin(request)
      };

      run(main, plugins, []);
    });

    it('should return response metastream when given a simple URL string', done => {
      function main(sources: { HTTP: HttpApi }) {
        pipe(
          sources.HTTP.response$$,
          subscribe(res$ => {
            assert.strictEqual(typeof res$.request, 'object');
            assert.strictEqual(res$.request.url, uri + '/hello');
            pipe(
              res$,
              // Without using the API we can not know if the request may emit progress events
              subscribe((res: Response<any>) => {
                assert.strictEqual(res.status, 500);
                assert.strictEqual(
                  res.data,
                  'Expected Content-Type request header to be undefined, but got application/json'
                );
                done();
              })
            );
          })
        );

        return {
          HTTP: of(uri + '/hello')
        };
      }

      const plugins = {
        HTTP: makeHttpPlugin(request)
      };

      run(main, plugins, []);
    });

    it('should return response metastream when given a simple URL string with content-type specified', done => {
      function main(sources: { HTTP: HttpApi }) {
        pipe(
          sources.HTTP.response$$,
          subscribe(res$ => {
            assert.strictEqual(typeof res$.request, 'object');
            assert.strictEqual(res$.request.url, uri + '/hello');
            pipe(
              res$,
              subscribe((res: Response<any>) => {
                assert.strictEqual(res.status, 200);
                assert.strictEqual(res.data, 'Hello World');
                done();
              })
            );
          })
        );

        return {
          HTTP: of({
            url: uri + '/hello',
            contentType: undefined
          })
        };
      }

      const plugins = {
        HTTP: makeHttpPlugin(request)
      };

      run(main, plugins, []);
    });

    it('should return response metastream when given simple options obj', function(done) {
      function main(sources: { HTTP: HttpApi }) {
        pipe(
          sources.HTTP.response$$,
          subscribe(res$ => {
            assert.strictEqual(res$.request.url, uri + '/pet');
            assert.strictEqual(res$.request.method, 'POST');
            assert.strictEqual((res$.request.send as any).name, 'Woof');
            assert.strictEqual((res$.request.send as any).species, 'Dog');
            pipe(
              res$,
              subscribe((res: Response<any>) => {
                assert.strictEqual(res.status, 200);
                assert.strictEqual(res.data, 'added Woof the Dog');
                done();
              })
            );
          })
        );

        return {
          HTTP: of({
            url: uri + '/pet',
            method: 'POST',
            send: { name: 'Woof', species: 'Dog' }
          })
        };
      }

      const plugins = {
        HTTP: makeHttpPlugin(request)
      };

      run(main, plugins, []);
    });

    it('should return response metastream when send with type string [#674]', done => {
      function main(sources: { HTTP: HttpApi }) {
        pipe(
          sources.HTTP.response$$,
          subscribe(res$ => {
            assert.strictEqual(res$.request.url, uri + '/pet');
            assert.strictEqual(res$.request.method, 'POST');
            assert.strictEqual(res$.request.send, 'name=Woof&species=Dog');
            pipe(
              res$,
              subscribe((res: Response<any>) => {
                assert.strictEqual(res.status, 200);
                assert.strictEqual(res.data, 'added Woof the Dog');
                done();
              })
            );
          })
        );

        return {
          HTTP: of({
            url: uri + '/pet',
            method: 'POST',
            send: 'name=Woof&species=Dog',
            contentType: 'application/x-www-form-urlencoded'
          })
        };
      }

      const plugins = {
        HTTP: makeHttpPlugin(request)
      };

      run(main, plugins, []);
    });

    it('should return response metastream when given another options obj', done => {
      function main(sources: { HTTP: HttpApi }) {
        pipe(
          sources.HTTP.response$$,
          subscribe(res$ => {
            assert.strictEqual(res$.request.url, uri + '/querystring');
            assert.strictEqual(res$.request.method, 'GET');
            assert.strictEqual((res$.request.query as any).foo, 102030);
            assert.strictEqual((res$.request.query as any).bar, 'Pub');
            pipe(
              res$,
              subscribe((res: Response<any>) => {
                assert.strictEqual(res.status, 200);
                assert.strictEqual(res.data.foo, '102030');
                assert.strictEqual(res.data.bar, 'Pub');
                done();
              })
            );
          })
        );

        return {
          HTTP: of({
            url: uri + '/querystring',
            method: 'GET',
            query: { foo: 102030, bar: 'Pub' }
          })
        };
      }

      const plugins = {
        HTTP: makeHttpPlugin(request)
      };

      run(main, plugins, []);
    });

    it('should return response metastream when given yet another options obj', done => {
      function main(sources: { HTTP: HttpApi }) {
        pipe(
          sources.HTTP.response$$,
          subscribe(res$ => {
            assert.strictEqual(res$.request.url, uri + '/delete');
            assert.strictEqual(res$.request.method, 'DELETE');
            pipe(
              res$,
              subscribe((res: Response<any>) => {
                assert.strictEqual(res.status, 200);
                assert.strictEqual(res.data.deleted, true);
                done();
              })
            );
          })
        );

        return {
          HTTP: of({
            url: uri + '/delete',
            method: 'DELETE',
            query: { foo: 102030, bar: 'Pub' }
          })
        };
      }

      const plugins = {
        HTTP: makeHttpPlugin(request)
      };

      run(main, plugins, []);
    });

    it("should not be possible to change the metastream's request", done => {
      function main(sources: { HTTP: HttpApi }) {
        pipe(
          sources.HTTP.response$$,
          map(res$ => {
            try {
              res$.request = 1234 as any;
            } catch (err) {
              assert.strictEqual(err instanceof TypeError, true);
              done();
            }
            return res$;
          }),
          subscribe(() => {})
        );

        return {
          HTTP: of({
            url: uri + '/hello',
            method: 'GET'
          })
        };
      }

      const plugins = {
        HTTP: makeHttpPlugin(request)
      };

      run(main, plugins, []);
    });

    it('should send 500 server errors to response$ onError', done => {
      function main(sources: { HTTP: HttpApi }) {
        pipe(
          sources.HTTP.response$$,
          subscribe(res$ => {
            assert.strictEqual(typeof res$.request, 'object');
            assert.strictEqual(res$.request.url, uri + '/error');
            pipe(
              res$,
              subscribe((res: Response<any>) => {
                assert.strictEqual(res.status, 500);
                assert.strictEqual(res.data, 'boom');
                done();
              })
            );
          })
        );

        return {
          HTTP: of(uri + '/error')
        };
      }

      const plugins = {
        HTTP: makeHttpPlugin(request)
      };

      run(main, plugins, []);
    });

    it('should not be sensitive to ordering of sinks (issue #476)', done => {
      function main(sources: { HTTP: HttpApi }) {
        const request$ = of({
          url: uri + '/hello',
          method: 'GET',
          contentType: undefined
        });

        const str$ = pipe(
          sources.HTTP.response$$,
          flatten,
          map((res: Response<any>) => res.data as string)
        );

        // Notice HTTP comes before Test here. This is crucial for this test.
        return {
          HTTP: request$,
          Test: str$
        };
      }
      const testDriverExpected = ['Hello World'];

      class TestDriver implements Driver<undefined, string> {
        provideSource() {
          return null;
        }

        consumeSink(sink: Producer<string>) {
          return pipe(
            sink,
            subscribe(x => {
              assert.strictEqual(testDriverExpected.length, 1);
              assert.strictEqual(x, testDriverExpected.shift());
              assert.strictEqual(testDriverExpected.length, 0);
              done();
            })
          );
        }
      }

      const plugins: Record<string, Plugin<any, any>> = {
        HTTP: makeHttpPlugin(request),
        Test: [new TestDriver(), null]
      };

      run(main, plugins, []);
    });
  });

  /*describe('isolateSource and isolateSink', function() {
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
  });*/
}
