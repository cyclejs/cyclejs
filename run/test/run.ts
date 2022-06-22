import * as assert from 'assert';
import {
  Producer,
  pipe,
  first,
  startWith,
  map,
  of,
  fromArray,
  subscribe,
  never,
  empty,
  take,
  flatten,
  makeSubject,
  multicast,
  Operator,
} from '@cycle/callbags';

import {
  run,
  Driver,
  ReadonlyDriver,
  WriteonlyDriver,
  Plugins,
} from '../src/index';

describe('run', function () {
  it('should throw if first argument is not a function', () => {
    assert.throws(() => {
      (run as any)('not a function');
    }, /First argument given to Cycle must be the 'main' function/i);
  });

  it('should throw if second argument is not an object', () => {
    assert.throws(() => {
      (run as any)(() => {}, 'not an object');
    }, /Second argument given to Cycle must be an object with plugins/i);
  });

  it('should throw if second argument is an empty object', () => {
    assert.throws(() => {
      (run as any)(() => {}, {});
    }, /Second argument given to Cycle must be an object with at least one plugin/i);
  });

  it('should return a dispose function', () => {
    let numData = 0;

    type NiceSources = {
      other: Producer<string>;
    };
    type NiceSinks = {
      other: Producer<string>;
    };

    function app(sources: NiceSources): NiceSinks {
      return {
        other: pipe(sources.other, first(), startWith('a')),
      };
    }

    class TestDriver implements Driver<string, string> {
      provideSource() {
        return pipe(
          of('b'),
          map(x => {
            numData++;
            return x;
          })
        );
      }
    }

    const plugins = {
      other: new TestDriver(),
    };

    const dispose = run(app, plugins);
    assert.strictEqual(typeof dispose, 'function');
    assert.strictEqual(numData, 1);
    dispose();
  });

  it('should support driver that asynchronously subscribes to sink', function (done) {
    function app(_sources: any): any {
      return {
        foo: of(10),
      };
    }

    const expected = [10];

    class TestDriver implements WriteonlyDriver<number> {
      consumeSink(sink$: Producer<number>) {
        let buffer: number[] = [];
        const dispose = pipe(
          sink$,
          subscribe(x => buffer.push(x))
        );

        setTimeout(() => {
          while (buffer.length > 0) {
            const x = buffer.shift();
            assert.strictEqual(x, expected.shift());
          }
          pipe(
            sink$,
            subscribe(x => {
              assert.strictEqual(x, expected.shift());
            })
          );
        });
        return dispose;
      }
    }

    const plugins: Plugins = {
      foo: new TestDriver(),
    };

    run(app, plugins);

    setTimeout(() => {
      assert.strictEqual(expected.length, 0);
      done();
    }, 100);
  });

  it('should forbid cross-driver synchronous races (#592)', function (done) {
    this.timeout(4000);

    function interval(n: number): Producer<number> {
      return (_, sink) => {
        let i = 0;

        const id = setInterval(() => {
          sink(1, i++);
        }, n);

        sink(0, () => {
          clearInterval(id);
        });
      };
    }

    const periodic = (n: number) => pipe(interval(n), multicast);

    function child(sources: { HTTP: Producer<any> }, num: number) {
      const vdom$ = pipe(
        sources.HTTP,
        // filter(res => (res.request as any).category == 'cat'),
        // flatten,
        map(res => res.body.name),
        map((name: string) => 'My name is ' + name)
      );

      const request$ =
        num === 1
          ? of({
              category: 'cat',
              url: 'http://jsonplaceholder.typicode.com/users/1',
            })
          : never();

      return {
        HTTP: request$,
        DOM: vdom$,
      };
    }

    function mainHTTPThenDOM(sources: any) {
      const sinks$ = pipe(
        periodic(100),
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
        })
      );

      // order of sinks is important to reproduce the bug
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

    function mainDOMThenHTTP(sources: any) {
      const sinks$ = pipe(
        periodic(100),
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
        })
      );

      // order of sinks is important to reproduce the bug
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

    let requestsSent = 0;
    const expectedDOMSinks = [
      // HTTP then DOM:
      '',
      'My name is Louis',
      '',
      '',
      //DOM then HTTP:
      '',
      'My name is Louis',
      '',
      '',
    ];

    class DomDriver implements WriteonlyDriver<string> {
      consumeSink(sink$: Producer<string>) {
        return pipe(
          sink$,
          subscribe(s => {
            assert.strictEqual(s, expectedDOMSinks.shift());
          })
        );
      }
    }

    class HttpDriver implements Driver<any, any> {
      private subject = makeSubject<any>();

      consumeSink(sink$: Producer<any>) {
        return pipe(
          sink$,
          subscribe(req => {
            assert.deepStrictEqual(req, {
              category: 'cat',
              url: 'http://jsonplaceholder.typicode.com/users/1',
            });
            requestsSent++;

            this.subject(1, { body: { name: 'Louis' } });
          })
        );
      }

      provideSource() {
        return this.subject;
      }
    }

    const plugins: Plugins = {
      HTTP: new HttpDriver(),
      DOM: new DomDriver(),
    };

    // HTTP then DOM:
    const dispose = run(mainHTTPThenDOM, plugins);
    setTimeout(() => {
      assert.strictEqual(expectedDOMSinks.length, 4);
      assert.strictEqual(requestsSent, 1);
      dispose();

      // DOM then HTTP:
      run(mainDOMThenHTTP, plugins);
      setTimeout(() => {
        assert.strictEqual(expectedDOMSinks.length, 0);
        assert.strictEqual(requestsSent, 2);
        done();
      }, 1000);
    }, 1000);
  });

  it('should report errors from main() to a custom error handler', done => {
    function map2<A, B>(f: (a: A) => B): Operator<A, B> {
      return source => (_, sink) => {
        source(0, (t, d) => {
          if (t === 1) {
            try {
              const result = f(d);
              sink(1, result);
            } catch (e) {
              sink(2, e);
            }
          } else sink(t, d);
        });
      };
    }

    function main(sources: any): any {
      return {
        other: pipe(
          sources.other,
          take(1),
          map2(() => {
            throw new Error('malfunction');
          })
        ),
      };
    }

    class TestDriver implements Driver<string, any> {
      consumeSink(sink$: Producer<any>) {
        return pipe(
          sink$,
          subscribe(() => {})
        );
      }

      provideSource() {
        return of('b');
      }
    }

    const plugins: Plugins = {
      other: new TestDriver(),
    };

    let numCalled = 0;

    const handler = (err: any) => {
      numCalled++;
      assert.strictEqual(err.message, 'malfunction');
    };

    let caught = false;
    try {
      run(main, plugins, [], handler);
    } catch (e) {
      caught = true;
    }
    setTimeout(() => {
      assert.strictEqual(numCalled, 1);

      // Should be false because the error was already reported in the console.
      // Otherwise we would have double reporting of the error.
      assert.strictEqual(caught, false);

      done();
    }, 80);
  });

  it('should support sink-only and source-only drivers', done => {
    function app(sources: any): any {
      return {
        other: sources.read,
      };
    }

    let driverCalled = false;
    let expected = [1, 2, 3];

    class WriteDriver implements WriteonlyDriver<number> {
      consumeSink(sink$: Producer<number>) {
        assert.strictEqual(typeof sink$, 'function');
        driverCalled = true;

        return pipe(
          sink$,
          subscribe(x => {
            assert.strictEqual(x, expected.shift());
          })
        );
      }
    }

    class ReadDriver implements ReadonlyDriver<number> {
      provideSource() {
        return fromArray([1, 2, 3]);
      }
    }

    const plugins: Plugins = {
      other: new WriteDriver(),
      read: new ReadDriver(),
    };

    run(app, plugins);

    assert.strictEqual(driverCalled, true);
    done();
  });
});
