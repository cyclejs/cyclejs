import * as assert from 'assert';
import { makeRequest } from '@minireq/browser';
import { of, pipe, subscribe } from '@cycle/callbags';
import { run } from '@cycle/run';

import { runTests } from './common';
import { makeHttpPlugin, HttpApi } from '../src/index';

const uri = '//' + window.location.host;

describe('HTTP Driver in the browser', function() {
  runTests(uri, makeRequest());

  it('should be able to emit progress events on the response stream', function(done) {
    function main(sources: { HTTP: HttpApi }) {
      pipe(
        sources.HTTP.response$$,
        subscribe(res$ => {
          let progressEventHappened = false;
          assert.strictEqual(res$.request.url, uri + '/querystring');
          assert.strictEqual(res$.request.method, 'GET');
          assert.strictEqual((res$.request.query as any).foo, 102030);
          assert.strictEqual((res$.request.query as any).bar, 'Pub');
          pipe(
            res$,
            subscribe(res => {
              if (res.type === 'progress') {
                assert.strictEqual(typeof res.event.loaded, 'number');
                progressEventHappened = true;
              } else {
                assert.strictEqual(progressEventHappened, true);
                assert.strictEqual(res.status, 200);
                assert.strictEqual(res.data.foo, '102030');
                assert.strictEqual(res.data.bar, 'Pub');
                done();
              }
            })
          );
        })
      );

      return {
        HTTP: of({
          url: uri + '/querystring',
          method: 'GET',
          progress: true,
          query: { foo: 102030, bar: 'Pub' }
        })
      };
    }
    const plugins = {
      HTTP: makeHttpPlugin()
    };

    run(main, plugins, []);
  });

  it('should infer a union of response and progress when progress events may be emitted', function(done) {
    function main(sources: { HTTP: HttpApi }) {
      let progressEventHappened = false;
      pipe(
        sources.HTTP.get({
          url: uri + '/querystring',
          progress: true,
          query: { foo: 102030, bar: 'Pub' }
        }),
        subscribe(res => {
          assert.strictEqual(res.request.url, uri + '/querystring');
          assert.strictEqual(res.request.method, 'GET');
          assert.strictEqual((res.request.query as any).foo, 102030);
          assert.strictEqual((res.request.query as any).bar, 'Pub');

          if (res.type === 'progress') {
            assert.strictEqual(typeof res.event.loaded, 'number');
            progressEventHappened = true;
          } else {
            assert.strictEqual(progressEventHappened, true);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.foo, '102030');
            assert.strictEqual(res.data.bar, 'Pub');
            done();
          }
        })
      );
    }

    const plugins = {
      HTTP: makeHttpPlugin()
    };

    run(main, plugins, []);
  });

  it('should not infer a union if `progress` is false', function(done) {
    function main(sources: { HTTP: HttpApi }) {
      pipe(
        sources.HTTP.get({
          url: uri + '/querystring',
          query: { foo: 102030, bar: 'Pub' }
        }),
        subscribe(res => {
          assert.strictEqual(res.request.url, uri + '/querystring');
          assert.strictEqual(res.request.method, 'GET');
          assert.strictEqual((res.request.query as any).foo, 102030);
          assert.strictEqual((res.request.query as any).bar, 'Pub');

          // No need for a conditional here
          assert.strictEqual(res.status, 200);
          assert.strictEqual(res.data.foo, '102030');
          assert.strictEqual(res.data.bar, 'Pub');
          done();
        })
      );
    }

    const plugins = {
      HTTP: makeHttpPlugin()
    };

    run(main, plugins, []);
  });

  /*it('should return binary response when responseType option is arraybuffer', function(done) {
    function main(_sources: { HTTP: HTTPSource }) {
      return {
        HTTP: of({
          url: uri + '/binary',
          method: 'GET',
          responseType: 'arraybuffer'
        })
      };
    }

    const { sources, run } = setup(main, { HTTP: makeHTTPDriver() });

    const response$$ = sources.HTTP.select();
    response$$.subscribe(function(response$) {
      assert.strictEqual(response$.request.url, uri + '/binary');
      assert.strictEqual(response$.request.method, 'GET');
      assert.strictEqual(response$.request.responseType, 'arraybuffer');
      response$.subscribe(function(response) {
        assert.strictEqual(response.status, 200);
        assert.deepStrictEqual(
          new Uint8Array(response.body),
          new Uint8Array([1, 2, 3])
        );
        done();
      });
    });
    run();
  });

  it('should return binary response when responseType option is blob', function(done) {
    function main(_sources: { HTTP: HTTPSource }) {
      return {
        HTTP: of({
          url: uri + '/binary',
          method: 'GET',
          responseType: 'blob'
        })
      };
    }

    const { sources, run } = setup(main, { HTTP: makeHTTPDriver() });

    const response$$ = sources.HTTP.select();
    response$$.subscribe(function(response$) {
      assert.strictEqual(response$.request.url, uri + '/binary');
      assert.strictEqual(response$.request.method, 'GET');
      assert.strictEqual(response$.request.responseType, 'blob');
      response$.subscribe(function(response) {
        assert.strictEqual(response.status, 200);
        const fr = new FileReader();
        fr.onload = ev => {
          assert.deepStrictEqual(
            new Uint8Array(fr.result as ArrayBuffer),
            new Uint8Array([1, 2, 3])
          );
          done();
        };
        fr.onerror = ev => {
          done('should not be called');
        };
        fr.readAsArrayBuffer(response.body);
      });
    });
    run();
  });

  it('should not have cross-driver race conditions, A (#592)', function(done) {
    this.timeout(10000);

    function child(_sources: any, num: any) {
      const vdom$ = _sources.HTTP.select('cat').pipe(
        mergeAll(),
        map((res: any) => 'My name is ' + res.text)
      );

      const request$ =
        num === 1
          ? of({
              category: 'cat',
              url: uri + '/hello'
            })
          : never();

      return {
        HTTP: request$,
        DOM: vdom$
      };
    }

    function mainHTTPThenDOM(_sources: any) {
      const sinks$ = interval(1000).pipe(
        take(6),
        map(i => {
          if (i % 2 === 1) {
            return child(_sources, i);
          } else {
            return {
              HTTP: empty(),
              DOM: of('')
            };
          }
        }),
        publishReplay(1),
        refCount()
      );

      // order of sinks is important
      return {
        HTTP: sinks$.pipe(switchMap(sinks => sinks.HTTP)),
        DOM: sinks$.pipe(switchMap(sinks => sinks.DOM))
      };
    }

    const expectedDOMSinks = [
      // HTTP then DOM
      '',
      'My name is Hello World',
      '',
      ''
    ];

    function domDriver(sink: any) {
      sink.addListener({
        next: (s: any) => {
          assert.strictEqual(s, expectedDOMSinks.shift());
        },
        error: (err: any) => {}
      });
    }

    // HTTP then DOM:
    globalRun(mainHTTPThenDOM, {
      HTTP: makeHTTPDriver(),
      DOM: domDriver
    });
    setTimeout(() => {
      assert.strictEqual(expectedDOMSinks.length, 0);
      done();
    }, 8500);
  });

  it('should not have cross-driver race conditions, B (#592)', function(done) {
    this.timeout(10000);

    function child(_sources: any, num: any) {
      const vdom$ = _sources.HTTP.select('cat').pipe(
        mergeAll(),
        map((res: any) => 'My name is ' + res.text)
      );

      const request$ =
        num === 1
          ? of({
              category: 'cat',
              url: uri + '/hello'
            })
          : never();

      return {
        HTTP: request$,
        DOM: vdom$
      };
    }

    function mainDOMThenHTTP(_sources: any) {
      const sinks$ = interval(1000).pipe(
        take(6),
        map(i => {
          if (i % 2 === 1) {
            return child(_sources, i);
          } else {
            return {
              HTTP: empty(),
              DOM: of('')
            };
          }
        }),
        publishReplay(1),
        refCount()
      );

      // order of sinks is important
      return {
        DOM: sinks$.pipe(switchMap(sinks => sinks.DOM)),
        HTTP: sinks$.pipe(switchMap(sinks => sinks.HTTP))
      };
    }

    const expectedDOMSinks = [
      // DOM then HTTP
      '',
      'My name is Hello World',
      '',
      ''
    ];

    function domDriver(sink: any) {
      sink.addListener({
        next: (s: any) => {
          assert.strictEqual(s, expectedDOMSinks.shift());
        },
        error: (err: any) => {}
      });
    }

    // HTTP then DOM:
    globalRun(mainDOMThenHTTP, {
      HTTP: makeHTTPDriver(),
      DOM: domDriver
    });
    setTimeout(() => {
      assert.strictEqual(expectedDOMSinks.length, 0);
      done();
    }, 8500);
  });

  it('should not remember past responses when selecting', function(done) {
    this.timeout(4000);

    function main(_sources: any) {
      const test$ = of(null).pipe(
        delay(1000),
        mergeMap(() =>
          _sources.HTTP.select('cat').pipe(
            mergeAll(),
            map((res: any) => 'I should not show this, ' + res.text)
          )
        )
      );

      const request$ = of({
        category: 'cat',
        url: uri + '/hello'
      });

      return {
        HTTP: request$,
        Test: test$
      };
    }

    function testDriver(sink: any) {
      sink.addListener({
        next: (s: any) => {
          console.log(s);
          done('No data should come through the Test sink');
        },
        error: (err: any) => {
          done(err);
        }
      });
    }

    globalRun(main, {
      HTTP: makeHTTPDriver(),
      Test: testDriver
    });

    setTimeout(() => {
      done();
    }, 2000);
  });*/
});
