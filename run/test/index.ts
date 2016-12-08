import 'mocha';
import * as assert from 'assert';
import * as sinon from 'sinon';
import {run, setup} from '../lib';
import xs, {Stream} from 'xstream';
import concat from 'xstream/extra/concat';
import delay from 'xstream/extra/delay';

let window: any;
if (typeof global === 'object') {
  (global as any).window = {};
  window = (global as any).window;
}

describe('Cycle', function () {
  it('should have `run`', function () {
    assert.strictEqual(typeof run, 'function');
  });

  it('should throw if first argument is not a function', function () {
    assert.throws(() => {
      (setup as any)('not a function');
    }, /First argument given to Cycle must be the 'main' function/i);
  });

  it('should throw if second argument is not an object', function () {
    assert.throws(() => {
      (setup as any)(() => {}, 'not an object');
    }, /Second argument given to Cycle must be an object with driver functions/i);
  });

  it('should throw if second argument is an empty object', function () {
    assert.throws(() => {
      (setup as any)(() => {}, {});
    }, /Second argument given to Cycle must be an object with at least one/i);
  });

  it('should return sinks object and sources object', function () {
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

  it('should call DevTool internal function to pass sinks', function () {
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

  it('should return a run() which in turn returns a dispose()', function (done) {
    interface TestSources {
      other: Stream<number>;
    }
    interface TestSinks {
      other: Stream<string>;
    }

    function app(sources: TestSources): TestSinks {
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
    let {sources, run} = setup<TestSources, TestSinks>(app, {other: driver});
    let dispose: any;
    sources.other.addListener({
      next: x => {
        assert.strictEqual(x, 97);
        dispose();
        done();
      },
      error: err => done(err),
      complete: () => done('complete should not be called'),
    });
    dispose = run();
  });

  it('should not work after has been disposed', function (done) {
    interface MySources {
      other: Stream<string>;
    }
    interface MySinks {
      other: Stream<number>;
    }

    function app(sources: MySources): MySinks {
      return {other: xs.periodic(100).map(i => i + 1)};
    }
    function driver(num$: Stream<number>): Stream<string> {
      return num$.map(num => 'x' + num);
    }

    const {sources, run} = setup<MySources, MySinks>(app, {
      other: driver,
    });

    let dispose: any;
    sources.other.addListener({
      next: (x) => {
        assert.notStrictEqual(x, 'x3');
        if (x === 'x2') {
          dispose();
          setTimeout(() => {
            done();
          }, 100);
        }
      },
      error: err => done(err),
      complete: () => done('complete should not be called'),
    });
    dispose = run();
  });

  describe('run()', function () {
    it('should throw if first argument is not a function', function () {
      assert.throws(() => {
        (run as any)('not a function');
      }, /First argument given to Cycle must be the 'main' function/i);
    });

    it('should throw if second argument is not an object', function () {
      assert.throws(() => {
        (run as any)(() => {}, 'not an object');
      }, /Second argument given to Cycle must be an object with driver functions/i);
    });

    it('should throw if second argument is an empty object', function () {
      assert.throws(() => {
        (run as any)(() => {}, {});
      }, /Second argument given to Cycle must be an object with at least one/i);
    });

    it('should return a dispose function', function () {
      let sandbox = sinon.sandbox.create();
      const spy = sandbox.spy();

      interface NiceSources {
        other: Stream<string>;
      }
      interface NiceSinks {
        other: Stream<string>;
      }

      function app(sources: NiceSources): NiceSinks {
        return {
          other: sources.other.take(1).startWith('a'),
        };
      }

      function driver() {
        return xs.of('b').debug(spy);
      }

      let dispose = run<NiceSources, NiceSinks>(app, {other: driver});
      assert.strictEqual(typeof dispose, 'function');
      sinon.assert.calledOnce(spy);
      dispose();
    });

    it('should happen synchronously', function (done) {
      let sandbox = sinon.sandbox.create();
      const spy = sandbox.spy();
      function app(sources: any): any {
        sources.other.addListener({next: () => {}, error: () => {}, complete: () => {}});
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

    it('should report errors from main() in the console', function (done) {
      let sandbox = sinon.sandbox.create();
      sandbox.stub(console, 'error');

      function main(sources: any): any {
        return {
          other: sources.other.take(1).startWith('a').map(() => {
            throw new Error('malfunction');
          }),
        };
      }
      function driver() {
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
        sinon.assert.calledWithExactly(console.error as any, sinon.match('malfunction'));
        assert.strictEqual(caught, true);

        sandbox.restore();
        done();
      }, 80);
    });
  });
});
