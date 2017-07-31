import 'mocha';
import * as assert from 'assert';
import * as sinon from 'sinon';
import {run, setup, Sources, Sinks, Driver} from '../lib';
import {setAdapt} from '../lib/adapt';
import xs, {Stream} from 'xstream';
import concat from 'xstream/extra/concat';
import delay from 'xstream/extra/delay';

let window: any;
if (typeof global === 'object') {
  (global as any).window = {};
  window = (global as any).window;
}

describe('setup', function() {
  it('should be a function', function() {
    assert.strictEqual(typeof setup, 'function');
  });

  it('should throw if first argument is not a function', function() {
    assert.throws(() => {
      (setup as any)('not a function');
    }, /First argument given to Cycle must be the 'main' function/i);
  });

  it('should throw if second argument is not an object', function() {
    assert.throws(() => {
      (setup as any)(() => {}, 'not an object');
    }, /Second argument given to Cycle must be an object with driver functions/i);
  });

  it('should throw if second argument is an empty object', function() {
    assert.throws(() => {
      (setup as any)(() => {}, {});
    }, /Second argument given to Cycle must be an object with at least one/i);
  });

  it('should return sinks object and sources object', function() {
    function app(ext: any): any {
      return {
        other: ext.other.take(1).startWith('a'),
      };
    }
    function driver() {
      return xs.of('b');
    }
    let {sinks, sources} = setup(app, {other: driver});
    assert.strictEqual(typeof sinks, 'object');
    assert.strictEqual(typeof sinks.other.addListener, 'function');
    assert.strictEqual(typeof sources, 'object');
    assert.notStrictEqual(typeof sources.other, 'undefined');
    assert.notStrictEqual(sources.other, null);
    assert.strictEqual(typeof sources.other.addListener, 'function');
  });

  it('should type-check keyof sources and sinks in main and drivers', function() {
    type Sources = {
      str: Stream<string>;
      obj: Stream<object>;
    };

    function app(sources: Sources) {
      return {
        str: sources.str.take(1).startWith('a'), // good
        // str: sources.obj.mapTo('good'), // good
        // strTYPO: sources.str.take(1).startWith('a'), // bad
        // str: xs.of(123), // bad
        num: xs.of(100), // good
        // numTYPO: xs.of(100), // bad
        // num: xs.of('BAD TYPE'), // bad
      };
    }

    const stringDriver: Driver<Stream<string>, Stream<string>> = (
      sink: Stream<string>,
    ) => xs.of('b');

    const numberWriteOnlyDriver: Driver<Stream<number>, void> = (
      sink: Stream<number>,
    ) => {};

    const objectReadOnlyDriver: Driver<void, Stream<object>> = () => xs.of({});

    setup(app, {
      str: stringDriver,
      num: numberWriteOnlyDriver,
      obj: objectReadOnlyDriver,
    });
  });

  it('should type-check keyof sources and sinks, supporting interfaces', function() {
    interface Sources {
      str: Stream<string>;
      obj: Stream<object>;
    }

    interface Sinks {
      str: Stream<string>;
      num: Stream<number>;
    }

    function app(sources: Sources): Sinks {
      return {
        str: sources.str.take(1).startWith('a'), // good
        // str: sources.obj.mapTo('good'), // good
        // strTYPO: sources.str.take(1).startWith('a'), // bad
        // str: xs.of(123), // bad
        num: xs.of(100), // good
        // numTYPO: xs.of(100), // bad
        // num: xs.of('BAD TYPE'), // bad
      };
    }

    const stringDriver: Driver<Stream<string>, Stream<string>> = (
      sink: Stream<string>,
    ) => xs.of('b');

    const numberWriteOnlyDriver: Driver<Stream<number>, void> = (
      sink: Stream<number>,
    ) => {};

    const objectReadOnlyDriver: Driver<void, Stream<object>> = () => xs.of({});

    setup(app, {
      str: stringDriver,
      num: numberWriteOnlyDriver,
      obj: objectReadOnlyDriver,
    });
  });

  it('should type-check and allow more drivers than sinks', function() {
    type Sources = {
      str: Stream<string>;
      num: Stream<number>;
      obj: Stream<object>;
    };

    function app(sources: Sources) {
      return {};
    }

    function stringDriver(sink: Stream<string>) {
      return xs.of('b');
    }

    const numberDriver = (sink: Stream<number>) => xs.of(100);

    const objectReadOnlyDriver = () => xs.of({});

    setup(app, {
      str: stringDriver,
      num: numberDriver,
      obj: objectReadOnlyDriver,
    });
  });

  it('should call DevTool internal function to pass sinks', function() {
    let sandbox = sinon.sandbox.create();
    let spy = sandbox.spy();
    window['CyclejsDevTool_startGraphSerializer'] = spy;

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

  it('should return a run() which in turn returns a dispose()', function(done) {
    type TestSources = {
      other: Stream<number>;
    };

    function app(sources: TestSources) {
      return {
        other: concat(
          sources.other.take(6).map(x => String(x)).startWith('a'),
          xs.never(),
        ),
      };
    }

    function driver(sink: Stream<string>) {
      return sink.map(x => x.charCodeAt(0)).compose(delay(1));
    }

    const {sources, run} = setup(app, {other: driver});

    let dispose: any;
    sources.other.addListener({
      next: x => {
        assert.strictEqual(x, 97);
        dispose(); // will trigger this listener's complete
      },
      error: err => done(err),
      complete: () => done(),
    });
    dispose = run();
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

  it('should not work after has been disposed', function(done) {
    type MySources = {
      other: Stream<string>;
    };

    function app(sources: MySources) {
      return {other: xs.periodic(100).map(i => i + 1)};
    }
    function driver(num$: Stream<number>): Stream<string> {
      return num$.map(num => 'x' + num);
    }

    const {sources, run} = setup(app, {
      other: driver,
    });

    let dispose: any;
    sources.other.addListener({
      next: x => {
        assert.notStrictEqual(x, 'x3');
        if (x === 'x2') {
          dispose(); // will trigger this listener's complete
        }
      },
      error: err => done(err),
      complete: () => done(),
    });
    dispose = run();
  });
});

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
    let sandbox = sinon.sandbox.create();
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

    let dispose = run(app, {other: driver});
    assert.strictEqual(typeof dispose, 'function');
    sinon.assert.calledOnce(spy);
    dispose();
  });

  it('should happen synchronously', function(done) {
    let sandbox = sinon.sandbox.create();
    const spy = sandbox.spy();
    function app(sources: any): any {
      sources.other.addListener({
        next: () => {},
        error: () => {},
        complete: () => {},
      });
      return {
        other: xs.of(10),
      };
    }
    let mutable = 'correct';
    function driver(sink: Stream<number>): Stream<string> {
      return sink.map(x => 'a' + 10).debug(x => {
        assert.strictEqual(x, 'a10');
        assert.strictEqual(mutable, 'correct');
        spy();
      });
    }
    run(app, {other: driver});
    mutable = 'wrong';
    setTimeout(() => {
      sinon.assert.calledOnce(spy);
      done();
    }, 20);
  });

  it('should support driver that asynchronously subscribes to sink', function(
    done,
  ) {
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

      const request$ = num === 1
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
      const sinks$ = xs.periodic(100).take(6).map(i => {
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
      const sinks$ = xs.periodic(100).take(6).map(i => {
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
      let isBufferOpen = true;
      const buffer: Array<any> = [];
      const earlySource = xs.create({
        start(listener: any) {
          while (buffer.length > 0) {
            listener.next(buffer.shift());
          }
          isBufferOpen = false;
        },
        stop() {},
      });
      const source = sink.map(req => ({body: {name: 'Louis'}}));
      source.addListener({
        next: x => {
          if (isBufferOpen) {
            buffer.push(x);
          }
        },
        error: (err: any) => {},
      });
      return xs.merge(earlySource, source).debug(x => {
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
    let sandbox = sinon.sandbox.create();
    sandbox.stub(console, 'error');

    function main(sources: any): any {
      return {
        other: sources.other.take(1).startWith('a').map(() => {
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
      assert.strictEqual(e.message, 'malfunction');
      caught = true;
    }
    setTimeout(() => {
      sinon.assert.calledOnce(console.error as any);
      sinon.assert.calledWithExactly(
        console.error as any,
        sinon.match('malfunction'),
      );

      // Should be false because the error was already reported in the console.
      // Otherwise we would have double reporting of the error.
      assert.strictEqual(caught, false);

      sandbox.restore();
      done();
    }, 80);
  });
});
