import * as assert from 'assert';
import {
  Producer,
  pipe,
  first,
  startWith,
  map,
  of,
  subscribe,
  never,
  empty,
  take,
  flatten,
  makeSubject,
  multicast,
  uponEnd
} from '@cycle/callbags';

import { run, Driver, Plugins } from '../src/index';

describe('run', function() {
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
        other: pipe(sources.other, first(), startWith('a'))
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

    const plugins: Plugins = {
      other: [new TestDriver(), null]
    };

    const dispose = run(app, plugins, []);
    assert.strictEqual(typeof dispose, 'function');
    assert.strictEqual(numData, 1);
    dispose();
  });

  it('should support driver that asynchronously subscribes to sink', function(done) {
    function app(_sources: any): any {
      return {
        foo: of(10)
      };
    }

    const expected = [10];

    class TestDriver implements Driver<never, number> {
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
      foo: [new TestDriver(), null]
    };

    run(app, plugins, []);

    setTimeout(() => {
      assert.strictEqual(expected.length, 0);
      done();
    }, 100);
  });

  it('should forbid cross-driver synchronous races (#592)', function(done) {
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
              url: 'http://jsonplaceholder.typicode.com/users/1'
            })
          : never();

      return {
        HTTP: request$,
        DOM: vdom$
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
              DOM: of('')
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
        )
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
              DOM: of('')
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
        )
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
      ''
    ];

    class DomDriver implements Driver<never, string> {
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
              url: 'http://jsonplaceholder.typicode.com/users/1'
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
      HTTP: [new HttpDriver(), null],
      DOM: [new DomDriver(), null]
    };

    // HTTP then DOM:
    const dispose = run(mainHTTPThenDOM, plugins, []);
    setTimeout(() => {
      assert.strictEqual(expectedDOMSinks.length, 4);
      assert.strictEqual(requestsSent, 1);
      dispose();

      // DOM then HTTP:
      run(mainDOMThenHTTP, plugins, []);
      setTimeout(() => {
        assert.strictEqual(expectedDOMSinks.length, 0);
        assert.strictEqual(requestsSent, 2);
        done();
      }, 1000);
    }, 1000);
  });

  /*it('should report errors from main() in the console', function(done) {
    const sandbox = sinon.createSandbox();
    sandbox.stub(console, 'error');

    function main(sources: any): any {
      return {
        other: sources.other
          .take(1)
          .startWith('a')
          .map(() => {
            throw new Error('malfunction');
          }),
      };
    }
    function driver(sink: Stream<any>) {
      sink.addListener({
        next: () => {},
        error: (err: any) => {},
      });
      return xs.of('b');
    }

    let caught = false;
    try {
      run(main, {other: driver});
    } catch (e) {
      caught = true;
    }
    setTimeout(() => {
      sinon.assert.calledOnce(console.error as any);
      sinon.assert.calledWithExactly(
        console.error as any,
        sinon.match((err: any) => err.message === 'malfunction')
      );

      // Should be false because the error was already reported in the console.
      // Otherwise we would have double reporting of the error.
      assert.strictEqual(caught, false);

      sandbox.restore();
      done();
    }, 80);
  });

  it('should call DevTool internal function to pass sinks', function() {
    let window: any;
    if (typeof global === 'object') {
      (global as any).window = {};
      window = (global as any).window;
    }
    const sandbox = sinon.createSandbox();
    const spy = sandbox.spy();
    window.CyclejsDevTool_startGraphSerializer = spy;

    function app(ext: any): any {
      return {
        other: ext.other.take(1).startWith('a'),
      };
    }
    function driver() {
      return xs.of('b');
    }
    run(app, {other: driver});

    sinon.assert.calledOnce(spy);
  });

  it('should adapt() a simple source (stream)', function(done) {
    let appCalled = false;
    function app(sources: any): any {
      assert.strictEqual(typeof sources.other, 'string');
      assert.strictEqual(sources.other, 'this is adapted');
      appCalled = true;

      return {
        other: xs.of(1, 2, 3),
      };
    }

    function driver(sink: Stream<string>) {
      return xs.of(10, 20, 30);
    }

    setAdapt(stream => 'this is adapted');
    run(app, {other: driver});
    setAdapt(x => x);

    assert.strictEqual(appCalled, true);
    done();
  });

  it('should support sink-only drivers', function(done) {
    function app(sources: any): any {
      return {
        other: xs.of(1, 2, 3),
      };
    }

    let driverCalled = false;
    function driver(sink: Stream<string>) {
      assert.strictEqual(typeof sink, 'object');
      assert.strictEqual(typeof sink.fold, 'function');
      driverCalled = true;
    }

    run(app, {other: driver});

    assert.strictEqual(driverCalled, true);
    done();
  });

  it('should not adapt() sinks', function(done) {
    function app(sources: any): any {
      return {
        other: xs.of(1, 2, 3),
      };
    }

    let driverCalled = false;
    function driver(sink: Stream<string>) {
      assert.strictEqual(typeof sink, 'object');
      assert.strictEqual(typeof sink.fold, 'function');
      driverCalled = true;
      return xs.of(10, 20, 30);
    }

    setAdapt(stream => 'this not a stream');
    run(app, {other: driver});
    setAdapt(x => x);

    assert.strictEqual(driverCalled, true);
    done();
  });*/
});
