import * as assert from 'assert';
import { makeRequest, Response } from '@minireq/browser';
import {
  of,
  pipe,
  subscribe,
  filter,
  map,
  take,
  flatten,
  Producer,
  Operator,
  empty,
  never,
} from '@cycle/callbags';
import { run, Driver, Plugin } from '@cycle/run';

import { runTests } from './common';
import { makeHttpPlugin, HttpApi } from '../src/index';

const uri = '//' + window.location.host;

function interval(n: number): Producer<number> {
  return (_, sink) => {
    let i = 0;
    let id: any;

    sink(0, () => {
      if (id !== undefined) clearInterval(id);
    });

    id = setInterval(() => {
      sink(1, i++);
    }, n);
  };
}

function publishReplay<T>(): Operator<T, T> {
  let subscribers: any[] = [];
  let hasLast = false;
  let last: T | undefined;

  return source => {
    source(0, (t, d) => {
      if (t === 1) {
        subscribers.forEach(sink => sink(1, d));
        last = d;
        hasLast = true;
      }
    });

    return (_, sink) => {
      subscribers.push(sink);
      sink(0, () => {});
      if (hasLast) {
        sink(1, last);
      }
    };
  };
}

describe('HTTP Driver in the browser', function () {
  runTests(uri, makeRequest());

  it('should be able to emit progress events on the response stream', done => {
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
          query: { foo: 102030, bar: 'Pub' },
        }),
      };
    }
    const plugins = {
      HTTP: makeHttpPlugin(),
    };

    run(main, plugins, []);
  });

  it('should infer a union of response and progress when progress events may be emitted', done => {
    function main(sources: { HTTP: HttpApi }) {
      let progressEventHappened = false;
      pipe(
        sources.HTTP.get({
          url: uri + '/querystring',
          progress: true,
          query: { foo: 102030, bar: 'Pub' },
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

      return {};
    }

    const plugins = {
      HTTP: makeHttpPlugin(),
    };

    run(main, plugins);
  });

  it('should not infer a union if `progress` is false', done => {
    function main(sources: { HTTP: HttpApi }) {
      pipe(
        sources.HTTP.get({
          url: uri + '/querystring',
          query: { foo: 102030, bar: 'Pub' },
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

      return {};
    }

    const plugins = {
      HTTP: makeHttpPlugin(),
    };

    run(main, plugins);
  });

  it('should return binary response when responseType option is binary', done => {
    function main(sources: { HTTP: HttpApi }) {
      pipe(
        sources.HTTP.get({
          url: uri + '/binary',
          responseType: 'binary',
        }),
        subscribe(res => {
          assert.strictEqual(res.request.url, uri + '/binary');
          assert.strictEqual(res.request.method, 'GET');
          assert.strictEqual(res.request.responseType, 'binary');

          assert.strictEqual(res.status, 200);
          assert.deepStrictEqual(
            new Uint8Array(res.data),
            new Uint8Array([1, 2, 3])
          );

          done();
        })
      );

      return {};
    }

    const plugins = {
      HTTP: makeHttpPlugin(),
    };

    run(main, plugins);
  });

  it('should be able to create a blob when responseType option is binary', done => {
    function main(sources: { HTTP: HttpApi }) {
      pipe(
        sources.HTTP.get({
          url: uri + '/binary',
          responseType: 'binary',
        }),
        subscribe(res => {
          assert.strictEqual(res.request.url, uri + '/binary');
          assert.strictEqual(res.request.method, 'GET');
          assert.strictEqual(res.request.responseType, 'binary');

          assert.strictEqual(res.status, 200);
          const fr = new FileReader();
          fr.onload = () => {
            assert.deepStrictEqual(
              new Uint8Array(fr.result as ArrayBuffer),
              new Uint8Array([1, 2, 3])
            );
            done();
          };
          fr.onerror = () => {
            done('should not be called');
          };
          fr.readAsArrayBuffer(new Blob([res.data]));
        })
      );

      return {};
    }

    const plugins = {
      HTTP: makeHttpPlugin(),
    };

    run(main, plugins);
  });

  it('should not have cross-driver race conditions, A (#592)', function (done) {
    this.timeout(10000);

    function child(sources: { HTTP: HttpApi }, num: number) {
      const vdom$ = pipe(
        sources.HTTP.response$$,
        filter(res$ => (res$.request as any).category === 'cat'),
        flatten,
        map((res: Response<any>) => 'My name is ' + res.data)
      );

      const request$ =
        num === 1
          ? of({
              category: 'cat',
              url: uri + '/hello',
            })
          : never();

      return {
        HTTP: request$,
        DOM: vdom$,
      };
    }

    function mainHTTPThenDOM(sources: { HTTP: HttpApi }) {
      const sinks$ = pipe(
        interval(1000),
        take(6),
        map(i => {
          if (i % 2 === 1) {
            return child(sources, i);
          } else {
            return {
              HTTP: empty(),
              DOM: of(''),
            };
          }
        }),
        publishReplay()
      );

      // order of sinks is important
      return {
        HTTP: pipe(
          sinks$,
          map(sinks => sinks.HTTP),
          flatten
        ),
        DOM: pipe(
          sinks$,
          map(sinks => sinks.DOM),
          flatten
        ),
      };
    }

    const expectedDOMSinks = [
      // HTTP then DOM
      '',
      'My name is Hello World',
      '',
      '',
    ];

    class DomDriver implements Driver<any, any> {
      public consumeSink(sink$: Producer<any>) {
        return pipe(
          sink$,
          subscribe(s => {
            assert.strictEqual(s, expectedDOMSinks.shift());
          })
        );
      }
    }

    const plugins = {
      HTTP: makeHttpPlugin(),
      DOM: new DomDriver(),
    };

    // HTTP then DOM:
    run(mainHTTPThenDOM, plugins);

    setTimeout(() => {
      assert.strictEqual(expectedDOMSinks.length, 0);
      done();
    }, 8500);
  });

  it('should not have cross-driver race conditions, B (#592)', function (done) {
    this.timeout(10000);

    function child(sources: { HTTP: HttpApi }, num: number) {
      const vdom$ = pipe(
        sources.HTTP.response$$,
        filter(res$ => (res$.request as any).category === 'cat'),
        flatten,
        map((res: Response<any>) => 'My name is ' + res.data)
      );

      const request$ =
        num === 1
          ? of({
              category: 'cat',
              url: uri + '/hello',
            })
          : never();

      return {
        HTTP: request$,
        DOM: vdom$,
      };
    }

    function mainDOMThenHTTP(sources: { HTTP: HttpApi }) {
      const sinks$ = pipe(
        interval(1000),
        take(6),
        map(i => {
          if (i % 2 === 1) {
            return child(sources, i);
          } else {
            return {
              HTTP: empty(),
              DOM: of(''),
            };
          }
        }),
        publishReplay()
      );

      // order of sinks is important
      return {
        DOM: pipe(
          sinks$,
          map(sinks => sinks.DOM),
          flatten
        ),
        HTTP: pipe(
          sinks$,
          map(sinks => sinks.HTTP),
          flatten
        ),
      };
    }

    const expectedDOMSinks = [
      // DOM then HTTP
      '',
      'My name is Hello World',
      '',
      '',
    ];

    class DomDriver implements Driver<any, any> {
      consumeSink(sink$: Producer<any>) {
        return pipe(
          sink$,
          subscribe(s => {
            assert.strictEqual(s, expectedDOMSinks.shift());
          })
        );
      }
    }

    const plugins = {
      HTTP: makeHttpPlugin(),
      DOM: new DomDriver(),
    };

    // HTTP then DOM:
    run(mainDOMThenHTTP, plugins);

    setTimeout(() => {
      assert.strictEqual(expectedDOMSinks.length, 0);
      done();
    }, 8500);
  });

  it('should not remember past responses when selecting', function (done) {
    this.timeout(4000);

    function delay<T>(n: number): Operator<T, T> {
      return source => (_, sink) => {
        source(0, (t, d) => {
          if (t !== 1) {
            sink(t, d);
          } else {
            setTimeout(() => sink(1, d), n);
          }
        });
      };
    }

    function main(sources: { HTTP: HttpApi }) {
      const test$ = pipe(
        of(null),
        delay(1000),
        map(() =>
          pipe(
            sources.HTTP.response$$,
            filter(res$ => (res$.request as any).category === 'cat'),
            flatten,
            map(
              (res: Response<string>) => 'I should not show this, ' + res.data
            )
          )
        ),
        flatten
      );

      const request$ = of({
        category: 'cat',
        url: uri + '/hello',
        contentType: undefined,
      });

      return {
        HTTP: request$,
        Test: test$,
      };
    }

    class TestDriver implements Driver<any, any> {
      public consumeSink(sink$: Producer<any>) {
        return pipe(
          sink$,
          subscribe(s => {
            console.log(s);
            done('No data should come through the Test sink');
          }, done)
        );
      }
    }

    const plugins = {
      HTTP: makeHttpPlugin(),
      Test: new TestDriver(),
    };

    run(main, plugins);

    setTimeout(() => {
      done();
    }, 2000);
  });
});
