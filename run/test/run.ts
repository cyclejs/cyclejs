import * as assert from 'assert';
import * as sinon from 'sinon';
import {run} from '../src/index';
import {setAdapt} from '../src/adapt';
import xs, {Stream} from 'xstream';

describe('run', function() {
  it('should be a function', function() {
    assert.strictEqual(typeof run, 'function');
  });

  it('should throw if first argument is not a function', function() {
    assert.throws(() => {
      (run as any)('not a function');
    }, /First argument given to Cycle must be the 'main' function/i);
  });

  it('should throw if second argument is not an object', function() {
    assert.throws(() => {
      (run as any)(() => {}, 'not an object');
    }, /Second argument given to Cycle must be an object with driver functions/i);
  });

  it('should throw if second argument is an empty object', function() {
    assert.throws(() => {
      (run as any)(() => {}, {});
    }, /Second argument given to Cycle must be an object with at least one/i);
  });

  it('should return a dispose function', function() {
    const sandbox = sinon.createSandbox();
    const spy = sandbox.spy();

    type NiceSources = {
      other: Stream<string>;
    };
    type NiceSinks = {
      other: Stream<string>;
    };

    function app(sources: NiceSources): NiceSinks {
      return {
        other: sources.other.take(1).startWith('a'),
      };
    }

    function driver() {
      return xs.of('b').debug(spy);
    }

    const dispose = run(app, {other: driver});
    assert.strictEqual(typeof dispose, 'function');
    sinon.assert.calledOnce(spy);
    dispose();
  });

  it('should support driver that asynchronously subscribes to sink', function(done) {
    function app(sources: any): any {
      return {
        foo: xs.of(10),
      };
    }

    const expected = [10];
    function driver(sink: Stream<number>): Stream<any> {
      const buffer: Array<number> = [];
      sink.addListener({
        next: x => {
          buffer.push(x);
        },
      });
      setTimeout(() => {
        while (buffer.length > 0) {
          const x = buffer.shift();
          assert.strictEqual(x, expected.shift());
        }
        sink.subscribe({
          next(x) {
            assert.strictEqual(x, expected.shift());
          },
          error() {},
          complete() {},
        });
      });
      return xs.never();
    }

    run(app, {foo: driver});

    setTimeout(() => {
      assert.strictEqual(expected.length, 0);
      done();
    }, 100);
  });

  it('should forbid cross-driver synchronous races (#592)', function(done) {
    this.timeout(4000);

    function child(sources: any, num: number) {
      const vdom$ = sources.HTTP
        // .select('cat')
        // .flatten()
        .map((res: any) => res.body.name)
        .map((name: string) => 'My name is ' + name);

      const request$ =
        num === 1
          ? xs.of({
              category: 'cat',
              url: 'http://jsonplaceholder.typicode.com/users/1',
            })
          : xs.never();

      return {
        HTTP: request$,
        DOM: vdom$,
      };
    }

    function mainHTTPThenDOM(sources: any) {
      const sinks$ = xs
        .periodic(100)
        .take(6)
        .map(i => {
          if (i % 2 === 1) {
            return child(sources, i);
          } else {
            return {
              HTTP: xs.empty(),
              DOM: xs.of(''),
            };
          }
        });

      // order of sinks is important to reproduce the bug
      return {
        HTTP: sinks$.map(sinks => sinks.HTTP).flatten(),
        DOM: sinks$.map(sinks => sinks.DOM).flatten(),
      };
    }

    function mainDOMThenHTTP(sources: any) {
      const sinks$ = xs
        .periodic(100)
        .take(6)
        .map(i => {
          if (i % 2 === 1) {
            return child(sources, i);
          } else {
            return {
              HTTP: xs.empty(),
              DOM: xs.of(''),
            };
          }
        });

      // order of sinks is important to reproduce the bug
      return {
        DOM: sinks$.map(sinks => sinks.DOM).flatten(),
        HTTP: sinks$.map(sinks => sinks.HTTP).flatten(),
      };
    }

    let requestsSent = 0;
    const expectedDOMSinks = [
      /* HTTP then DOM: */ '',
      'My name is Louis',
      '',
      '',
      /* DOM then HTTP: */ '',
      'My name is Louis',
      '',
      '',
    ];

    function domDriver(sink: Stream<string>) {
      sink.addListener({
        next: s => {
          assert.strictEqual(s, expectedDOMSinks.shift());
        },
        error: (err: any) => {},
      });
    }

    function httpDriver(sink: Stream<any>) {
      const source = sink.map(req => ({body: {name: 'Louis'}}));
      source.addListener({
        next: x => {},
        error: (err: any) => {},
      });
      return source.debug(x => {
        requestsSent += 1;
      });
    }

    // HTTP then DOM:
    const dispose = run(mainHTTPThenDOM, {
      HTTP: httpDriver,
      DOM: domDriver,
    });
    setTimeout(() => {
      assert.strictEqual(expectedDOMSinks.length, 4);
      assert.strictEqual(requestsSent, 1);
      dispose();

      // DOM then HTTP:
      run(mainDOMThenHTTP, {
        HTTP: httpDriver,
        DOM: domDriver,
      });
      setTimeout(() => {
        assert.strictEqual(expectedDOMSinks.length, 0);
        assert.strictEqual(requestsSent, 2);
        done();
      }, 1000);
    }, 1000);
  });

  it('should report errors from main() in the console', function(done) {
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
  });
});
