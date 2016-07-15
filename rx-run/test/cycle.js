/* eslint-disable */
'use strict';
/* global describe, it */
let assert = require('assert');
let Cycle = require('../lib/index').default;
let Rx = require('rx');
let sinon = require('sinon');

describe('Cycle', function () {
  it('should have `run`', function () {
    assert.strictEqual(typeof Cycle.run, 'function');
  });

  it('should throw if first argument is not a function', function () {
    assert.throws(() => {
      Cycle('not a function');
    }, /First argument given to Cycle must be the 'main' function/i);
  });

  it('should throw if second argument is not an object', function () {
    assert.throws(() => {
      Cycle(() => {}, 'not an object');
    }, /Second argument given to Cycle must be an object with driver functions/i);
  });

  it('should throw if second argument is an empty object', function () {
    assert.throws(() => {
      Cycle(() => {}, {});
    }, /Second argument given to Cycle must be an object with at least one/i);
  });

  it('should return sinks object and sources object', function () {
    function app(ext) {
      return {
        other: ext.other.take(1).startWith('a')
      };
    }
    function driver() {
      return Rx.Observable.just('b');
    }
    let {sinks, sources} = Cycle(app, {other: driver});
    assert.strictEqual(typeof sinks, 'object');
    assert.strictEqual(typeof sinks.other.subscribe, 'function');
    assert.strictEqual(typeof sources, 'object');
    assert.notStrictEqual(typeof sources.other, 'undefined');
    assert.notStrictEqual(sources.other, null);
    assert.strictEqual(typeof sources.other.subscribe, 'function');
  });

  it('should return a run() which in turn returns a dispose()', function (done) {
    function app(sources) {
      return {
        other: sources.other.take(6).map(x => String(x)).startWith('a')
      };
    }
    function driver(sink) {
      return sink.map(x => x.charCodeAt(0)).delay(1);
    }
    let {sinks, sources, run} = Cycle(app, {other: driver});
    let dispose;
    sources.other.subscribe(x => {
      assert.strictEqual(x, 97);
      dispose();
      done();
    });
    dispose = run();
  });

  it('should not work after has been disposed', function (done) {
    let number$ = Rx.Observable.range(1, 3)
      .concatMap(x => Rx.Observable.just(x).delay(50));
    function app() {
      return {other: number$};
    }
    let {sinks, sources, run} = Cycle(app, {
      other: number$ => number$.map(number => 'x' + number)
    });
    let dispose;
    sources.other.subscribe(function (x) {
      assert.notStrictEqual(x, 'x3');
      if (x === 'x2') {
        dispose();
        setTimeout(() => {
          done();
        }, 100);
      }
    });
    dispose = run();
  });

  describe('run()', function () {
    it('should throw if first argument is not a function', function () {
      assert.throws(() => {
        Cycle.run('not a function');
      }, /First argument given to Cycle must be the 'main' function/i);
    });

    it('should throw if second argument is not an object', function () {
      assert.throws(() => {
        Cycle.run(() => {}, 'not an object');
      }, /Second argument given to Cycle must be an object with driver functions/i);
    });

    it('should throw if second argument is an empty object', function () {
      assert.throws(() => {
        Cycle.run(() => {}, {});
      }, /Second argument given to Cycle must be an object with at least one/i);
    });

    it('should return a dispose function', function () {
      let sandbox = sinon.sandbox.create();
      const spy = sandbox.spy();
      function app(ext) {
        return {
          other: ext.other.take(1).startWith('a')
        };
      }
      function driver() {
        return Rx.Observable.just('b').doOnNext(spy);
      }
      let dispose = Cycle.run(app, {other: driver});
      assert.strictEqual(typeof dispose, 'function');
      sinon.assert.calledOnce(spy);
      dispose();
    });

    it('should happen synchronously', function (done) {
      let sandbox = sinon.sandbox.create();
      const spy = sandbox.spy();
      function app(sources) {
        sources.other.subscribe();
        return {
          other: Rx.Observable.of(10),
        };
      }
      let mutable = 'correct';
      function driver(sink) {
        return sink.map(x => 'a' + 10).doOnNext(x => {
          assert.strictEqual(x, 'a10');
          assert.strictEqual(mutable, 'correct');
          spy();
        });
      }
      Cycle.run(app, {other: driver});
      mutable = 'wrong';
      setTimeout(() => {
        sinon.assert.calledOnce(spy);
        done();
      }, 20);
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
        return Rx.Observable.just('b');
      }

      Cycle.run(main, {other: driver});
      setTimeout(() => {
        sinon.assert.calledOnce(console.error);
        sinon.assert.calledWithExactly(console.error, sinon.match("malfunction"));

        sandbox.restore();
        done();
      }, 20);
    });
  });
});
