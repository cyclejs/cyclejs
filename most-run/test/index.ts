import 'mocha';
import * as assert from 'assert';
import * as sinon from 'sinon';
import {run, setup} from '../lib';
import * as most from 'most';
import {Stream} from 'most';
import xs from 'xstream';
// require('creed').shim()

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
      setup(() => ({}), {});
    }, /Second argument given to Cycle must be an object with at least one/i);
  });

  it('should return sinks object and sources object', function() {
    type MySources = {
      other: Stream<string>;
    };

    type MySinks = {
      other: Stream<string>;
    };

    function app(sources: MySources): MySinks {
      return {
        other: sources.other.take(1).startWith('a'),
      };
    }
    function driver() {
      return most.of('b');
    }
    let {sinks, sources} = setup(app, {other: driver});
    assert.strictEqual(typeof sinks, 'object');
    assert.strictEqual(typeof sinks.other.observe, 'function');
    assert.strictEqual(typeof sources, 'object');
    assert.notStrictEqual(typeof sources.other, 'undefined');
    assert.notStrictEqual(sources.other, null);
    assert.strictEqual(typeof sources.other.observe, 'function');
  });

  it('should return a run() which in turn returns a dispose()', function(done) {
    type TestSources = {
      other: Stream<number>;
    };

    type TestSinks = {
      other: Stream<string>;
    };

    function app(sources: TestSources): TestSinks {
      return {
        other: most.concat(
          sources.other.take(6).map(x => String(x)).startWith('a'),
          most.never(),
        ),
      };
    }
    function driver(xsSink: any) {
      return most.from(xsSink).map((x: string) => x.charCodeAt(0)).delay(1);
    }
    let {sinks, sources, run} = setup(app, {other: driver});
    let dispose: any;
    sources.other
      .observe(x => {
        assert.strictEqual(x, 97);
        dispose();
        done();
      })
      .catch(done);
    dispose = run();
  });

  it('should not type check drivers that use xstream', function() {
    type MySources = {
      other: Stream<string>;
    };

    type MySinks = {
      other: Stream<string>;
    };

    function app(sources: MySources): MySinks {
      return {
        other: sources.other.take(1).startWith('a'),
      };
    }
    function xsdriver(sink: xs<string>): xs<string> {
      return xs.of('b');
    }

    const {sinks, sources} = setup(app, {other: xsdriver});
    assert.strictEqual(typeof sinks, 'object');
    assert.strictEqual(typeof sinks.other.subscribe, 'function');
    assert.strictEqual(typeof sources, 'object');
    assert.notStrictEqual(typeof sources.other, 'undefined');
    assert.notStrictEqual(sources.other, null);
    assert.strictEqual(typeof sources.other.subscribe, 'function');
  });

  it('should not work after has been disposed', function(done) {
    let number$ = most.periodic(50, 1).scan((x, y) => x + y, 0).map(i => i + 1);
    function app(sources: any): any {
      return {other: number$};
    }
    let {sinks, sources, run} = setup(app, {
      other: (num$: any) => most.from(num$).map((num: number) => 'x' + num),
    });
    let dispose: any;
    sources.other
      .observe((x: any) => {
        assert.notStrictEqual(x, 'x3');
        if (x === 'x2') {
          dispose();
          setTimeout(() => {
            done();
          }, 100);
        }
      })
      .catch(done);
    dispose = run();
  });
});

describe('run()', function() {
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
      run(() => ({}), {});
    }, /Second argument given to Cycle must be an object with at least one/i);
  });

  it('should return a dispose function', function() {
    let sandbox = sinon.sandbox.create();
    const spy = sandbox.spy();
    function app(sources: any) {
      return {
        other: sources.other.take(1).startWith('a'),
      };
    }
    function driver() {
      return most.of('b').tap(spy);
    }
    let dispose = run(app, {other: driver});
    assert.strictEqual(typeof dispose, 'function');
    setTimeout(() => {
      sinon.assert.calledOnce(spy);
    });
    dispose();
  });

  // Skipped until we make this test not brittle with async timing
  it('should report errors from main() in the console', function(done) {
    let sandbox = sinon.sandbox.create();
    sandbox.stub(console, 'error');

    function main(sources: any): any {
      return {
        other: sources.other.map(() => {
          throw new Error('malfunction');
        }),
      };
    }
    function driver(xsSink: any) {
      most.from(xsSink).drain().catch(() => {});
      return most.of('b');
    }

    let caught = false;
    try {
      run(main, {other: driver});
    } catch (err) {
      assert.strictEqual(err.message, 'malfunction');
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

      done();
    }, 100);
  });
});
