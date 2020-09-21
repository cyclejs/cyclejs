import * as assert from 'assert';
import {
  of,
  pipe,
  subscribe,
  flatten,
  map,
  Producer,
  merge,
  multicast,
  Operator,
} from '@cycle/callbags';
import { RequestFn, Response } from '@minireq/browser';
import { run, applyApis, Driver, Plugin } from '@cycle/run';
import { isolate } from '@cycle/utils';
// @ts-ignore
import delayInternal from 'callbag-delay';

import { HttpApi, makeHttpPlugin } from '../src/index';

function delay<T>(n: number): Operator<T, T> {
  return delayInternal(n);
}

export function runTests(uri: string, request: RequestFn) {
  describe('common tests between Node.js and the browser', function () {
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
          HTTP: of(123 as any),
        };
      }

      const plugins = {
        HTTP: makeHttpPlugin(request),
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
          HTTP: of({ method: 'post' } as any),
        };
      }

      const plugins = {
        HTTP: makeHttpPlugin(request),
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
          HTTP: of(uri + '/hello'),
        };
      }

      const plugins = {
        HTTP: makeHttpPlugin(request),
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
            contentType: undefined,
          }),
        };
      }

      const plugins = {
        HTTP: makeHttpPlugin(request),
      };

      run(main, plugins, []);
    });

    it('should return response metastream when given simple options obj', function (done) {
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
            send: { name: 'Woof', species: 'Dog' },
          }),
        };
      }

      const plugins = {
        HTTP: makeHttpPlugin(request),
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
            contentType: 'application/x-www-form-urlencoded',
          }),
        };
      }

      const plugins = {
        HTTP: makeHttpPlugin(request),
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
            query: { foo: 102030, bar: 'Pub' },
          }),
        };
      }

      const plugins = {
        HTTP: makeHttpPlugin(request),
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
            query: { foo: 102030, bar: 'Pub' },
          }),
        };
      }

      const plugins = {
        HTTP: makeHttpPlugin(request),
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
          HTTP: of(uri + '/hello'),
        };
      }

      const plugins = {
        HTTP: makeHttpPlugin(request),
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
          HTTP: of(uri + '/error'),
        };
      }

      const plugins = {
        HTTP: makeHttpPlugin(request),
      };

      run(main, plugins, []);
    });

    it('should not be sensitive to ordering of sinks (issue #476)', done => {
      function main(sources: { HTTP: HttpApi }) {
        const request$ = of({
          url: uri + '/hello',
          method: 'GET',
          contentType: undefined,
        });

        const str$ = pipe(
          sources.HTTP.response$$,
          flatten,
          map((res: Response<any>) => res.data as string)
        );

        // Notice HTTP comes before Test here. This is crucial for this test.
        return {
          HTTP: request$,
          Test: str$,
        };
      }
      const testDriverExpected = ['Hello World'];

      class TestDriver implements Driver<undefined, string> {
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
        Test: [new TestDriver(), null],
      };

      run(main, plugins, []);
    });
  });

  describe('isolateSource and isolateSink', () => {
    it('should exist on the HttpApi', () => {
      function main(sources: { HTTP: HttpApi }) {
        assert.strictEqual(typeof sources.HTTP.isolateSource, 'function');
        assert.strictEqual(typeof sources.HTTP.isolateSink, 'function');
        return {};
      }
      run(main, { HTTP: makeHttpPlugin(request) }, []);
    });

    it('should exist on a scoped HTTPSource', () => {
      function main(sources: { HTTP: HttpApi }) {
        const scopedHTTPSource = sources.HTTP.isolateSource('foo');

        assert.strictEqual(typeof scopedHTTPSource.isolateSource, 'function');
        assert.strictEqual(typeof scopedHTTPSource.isolateSink, 'function');
        return {};
      }
      run(main, { HTTP: makeHttpPlugin(request) }, []);
    });

    it('should hide responses from outside the scope', done => {
      function main(sources: { HTTP: HttpApi }) {
        const ignoredRequest$ = pipe(of(uri + '/json'), delay(1));
        const request$ = pipe(
          of({ url: uri + '/hello', method: 'GET', contentType: undefined }),
          delay(10)
        );
        const scopedRequest$ = sources.HTTP.isolateSink(request$, 'foo');
        const scopedHTTPSource = sources.HTTP.isolateSource('foo');

        pipe(
          scopedHTTPSource.response$$,
          subscribe(response$ => {
            assert.strictEqual(typeof response$.request, 'object');
            assert.strictEqual(response$.request.url, uri + '/hello');

            pipe(
              response$,
              subscribe((response: Response<any>) => {
                assert.strictEqual(response.status, 200);
                assert.strictEqual(response.data, 'Hello World');
                done();
              })
            );
          })
        );

        return {
          HTTP: merge(ignoredRequest$, scopedRequest$),
        };
      }

      run(main, { HTTP: makeHttpPlugin(request) }, []);
    });

    it('should hide responses even if using the same scope multiple times', done => {
      function main(sources: { HTTP: HttpApi }) {
        const ignoredRequest$ = pipe(of(uri + '/json'), delay(1));
        const request$ = pipe(
          of({ url: uri + '/hello', method: 'GET', contentType: undefined }),
          delay(10)
        );

        const fooInsideBarRequest$ = pipe(
          sources.HTTP.isolateSink(
            sources.HTTP.isolateSink(request$, 'foo'),
            'bar'
          ),
          multicast
        );
        const fooInsideBarHTTPSource = sources.HTTP.isolateSource(
          'bar'
        ).isolateSource('foo');
        const fooInsideFooHTTPSource = sources.HTTP.isolateSource(
          'foo'
        ).isolateSource('foo');

        pipe(
          fooInsideFooHTTPSource.response$$,
          subscribe(_response$ => {
            done('should not be called');
          })
        );

        pipe(
          fooInsideBarHTTPSource.response$$,
          subscribe(response$ => {
            assert.strictEqual(typeof response$.request, 'object');
            assert.strictEqual(response$.request.url, uri + '/hello');

            pipe(
              response$,
              subscribe((response: Response<any>) => {
                assert.strictEqual(response.status, 200);
                assert.strictEqual(response.data, 'Hello World');
                done();
              })
            );
          })
        );

        return {
          HTTP: merge(ignoredRequest$, fooInsideBarRequest$),
        };
      }

      run(main, { HTTP: makeHttpPlugin(request) }, []);
    });

    it('should emit responses when isolated many scopes deep', done => {
      let dispose: any;
      function main(sources: { HTTP: HttpApi }) {
        pipe(
          sources.HTTP.get({ url: uri + '/hello', contentType: undefined }),
          delay(10),
          subscribe(response => {
            assert.strictEqual(typeof response.request, 'object');
            assert.strictEqual(response.request.url, uri + '/hello');

            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.data, 'Hello World');
            dispose();
            done();
          })
        );

        return {};
      }

      function wrapper1(sources: { HTTP: HttpApi }) {
        return isolate(main, { HTTP: 'wrapper1' })(sources);
      }

      function wrapper2(sources: { HTTP: HttpApi }) {
        return isolate(wrapper1, { HTTP: 'wrapper2' })(sources);
      }

      dispose = run(wrapper2, { HTTP: makeHttpPlugin(request) }, []);
    });

    it('should stay isolated even if discharged with `applyApi`', done => {
      let dispose: any;
      let mapped = false;

      function main(sources: { HTTP: HttpApi }) {
        pipe(
          sources.HTTP.get({ url: uri + '/hello', contentType: undefined }),
          delay(10),
          subscribe(response => {
            assert.strictEqual(mapped, true);
            assert.strictEqual(typeof response.request, 'object');
            assert.strictEqual(response.request.url, uri + '/hello');

            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.data, 'Hello World');
            dispose();
            done();
          })
        );

        return {};
      }

      function wrapper1(sources: { HTTP: HttpApi }) {
        const isolatedMain = isolate(main, { HTTP: 'wrapper1' });
        const appliedSinks = applyApis(isolatedMain, ['HTTP'])(sources);
        assert.strictEqual(typeof appliedSinks.HTTP, 'function');
        return appliedSinks;
      }

      function wrapper2(sources: { HTTP: HttpApi }) {
        const sinks = isolate(wrapper1, { HTTP: 'wrapper2' })(sources);
        return {
          HTTP: pipe(
            sinks.HTTP,
            map((req: any) => {
              mapped = true;
              assert.deepStrictEqual(req.namespace, ['wrapper2', 'wrapper1']);
              return req;
            })
          ),
        };
      }

      dispose = run(wrapper2, { HTTP: makeHttpPlugin(request) }, []);
    });
  });
}
