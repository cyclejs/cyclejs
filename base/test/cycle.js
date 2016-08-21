import {describe, it} from 'mocha'
import assert from 'assert'
import sinon from 'sinon'
import Cycle from '../lib'
import * as Rx from 'rx'
import * as RxJS from 'rxjs'
import testStreamAdapter from './test-stream-adapter';
import testStreamAdapterTwo from './test-stream-adapter-two'

describe('Cycle', function () {
  it('should be a function', () => {
    assert.strictEqual(typeof Cycle, 'function')
  })

  it('should throw if first argument is not a function', function () {
    assert.throws(() => {
      Cycle('not a function', {}, {streamAdapter: testStreamAdapter});
    }, /First argument given to Cycle must be the 'main' function/i);
  });

  it('should throw if second argument is not an object', function () {
    assert.throws(() => {
      Cycle(() => {}, 'not an object', {streamAdapter: testStreamAdapter});
    }, /Second argument given to Cycle must be an object with driver functions/i);
  });

  it('should throw if second argument is an empty object', function () {
    assert.throws(() => {
      Cycle(() => {}, {}, {streamAdapter: testStreamAdapter});
    }, /Second argument given to Cycle must be an object with at least one/i);
  });

  it('should throw if streamAdapter is not supplied', function () {
    assert.throws(() => {
      Cycle(() => {}, {other: () => {}}, {})
    }, /Third argument given to Cycle must be an options object with the streamAdapter key supplied with a valid stream adapter/i)
  });

  it('should return sinks object and sources object and run()', function () {
    function app(sources) {
      return {
        other: sources.other.take(1).startWith('a')
      };
    }
    function driver() {
      return Rx.Observable.of('b');
    }
    const {sinks, sources, run} = Cycle(app, {other: driver}, {streamAdapter: testStreamAdapter});
    assert.strictEqual(typeof sinks, 'object');
    assert.strictEqual(typeof sinks.other.subscribe, 'function');
    assert.strictEqual(typeof sources, 'object');
    assert.notStrictEqual(typeof sources.other, 'undefined');
    assert.notStrictEqual(sources.other, null);
    assert.strictEqual(typeof sources.other.subscribe, 'function');
    assert.strictEqual(typeof run, 'function')
  });

  describe('run()', () => {
    it('should return a disposable drivers output', function (done) {
      function app(sources) {
        return {
          other: sources.other.take(6).map(x => String(x)).startWith('a')
        };
      }
      function driver(sink) {
        return sink.map(x => x.charCodeAt(0)).delay(1);
      }
      const {sinks, sources, run} = Cycle(app, {other: driver}, {streamAdapter: testStreamAdapter});

      sources.other.subscribe(x => {
        assert.strictEqual(x, 97);
      });

      const dispose = run();
      dispose();
      done();
    });

    it('should allow writing one-liner drivers with default streamAdapter', function(done) {
      function app(sources) {
        return {}
      }

      const {sinks, sources, run} = Cycle(app, {
        other: () => Rx.Observable.of(1, 2, 'Correct', 4),
      }, {streamAdapter: testStreamAdapter});

      sources.other.skip(2).take(1).subscribe(function(x) {
        assert.strictEqual(typeof x, 'string');
        assert.strictEqual(x, 'Correct');
      });

      const dispose = run();
      setTimeout(function() {
        dispose();
        done();
      }, 10)
    });

    it('should have DevTool-enabled flag for each simple source', function(done) {
      function app(sources) {
        return {}
      }

      const {sinks, sources, run} = Cycle(app, {
        other: () => Rx.Observable.of(1, 2, 'Correct', 4),
      }, {streamAdapter: testStreamAdapter});

      assert.strictEqual(sources.other._isCycleSource, 'other');
      done();
    });

    it('should not break when given a noop driver', function(done) {
      function app(sources) {
        return {}
      }

      assert.doesNotThrow(() => {
        const {sinks, sources, run} = Cycle(app, {
          noop: () => { },
        }, {streamAdapter: testStreamAdapter});
      })

      done();
    });

    it('should convert sources between stream libraries', function(done) {
      function app(sources) {
        assert(testStreamAdapterTwo.isValidStream(sources.other))
        return {
          other: sources.other.switchMap(() => RxJS.Observable.of(10)).startWith(1)
        }
      }

      function driver(sink$) {
        assert(testStreamAdapter.isValidStream(sink$))
        return sink$.doOnNext(() => {}).map(() => 5)
      }

      driver.streamAdapter = testStreamAdapter

      const {sinks, sources, run} = Cycle(app, {
        other: driver
      }, {streamAdapter: testStreamAdapterTwo});

      sources.other.take(1).subscribe(function(x) {
        assert.strictEqual(typeof x, 'number');
        assert.strictEqual(x, 5);
      });

      const dispose = run();
      setTimeout(function() {
        dispose();
        done();
      }, 10)
    });

    it('should run synchronously', function () {
      function app() {
        return {
          other: Rx.Observable.from([9, 19, 29]),
        };
      }
      let mutable = 'wrong';
      function driver(sink) {
        return sink.map(x => 'a' + 9)
      }
      const {sinks, sources, run} = Cycle(app, {other: driver}, {streamAdapter: testStreamAdapter});

      let invoked = false;
      sources.other.first().subscribe(x => {
        assert.strictEqual(x, 'a9');
        assert.strictEqual(mutable, 'correct');
        invoked = true;
      });
      mutable = 'correct';
      const dispose = run();
      dispose();
      assert.strictEqual(invoked, true);
    });

    it('should not work after has been disposed', function (done) {
      let sandbox = sinon.sandbox.create();
      const spy = sandbox.spy();
      function app() {
        return {
          other: Rx.Observable.range(1, 3).concatMap(x =>
            Rx.Observable.of(x).delay(50)
          ).doOnNext(spy)
        };
      }
      const {sinks, sources, run} = Cycle(app, {
        other: number$ => number$.map(number => 'x' + number)
      }, {streamAdapter: testStreamAdapter});

      const dispose = run();

      sources.other.subscribe(function (x) {
        assert.notStrictEqual(x, 'x3');
        if (x === 'x2') {
          dispose();
          setTimeout(() => {
            sinon.assert.calledTwice(spy);
            sandbox.restore();
            done();
          }, 100);
        }
      });
    });

    it('should report errors from main() in the console', function (done) {
      let sandbox = sinon.sandbox.create();
      sandbox.stub(console, "error");

      function main(sources) {
        return {
          other: sources.other.take(1).startWith('a').map(() => {
            throw new Error('malfunction');
          })
        };
      }
      function driver() {
        return Rx.Observable.of('b');
      }

      Cycle(main, {other: driver}, {streamAdapter: testStreamAdapter}).run();
      setTimeout(() => {
        sinon.assert.calledOnce(console.error);
        sinon.assert.calledWithExactly(console.error, sinon.match("malfunction"));

        sandbox.restore();
        done();
      }, 10);
    });
  });
});
