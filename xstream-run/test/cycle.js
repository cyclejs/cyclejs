/* eslint-disable */
'use strict';
/* global describe, it */
let assert = require('assert');
let Cycle = require('../lib/index').default;
let xs = require('xstream').default;
let concat = require('xstream/extra/concat').default;
let delay = require('xstream/extra/delay').default;
let sinon = require('sinon');

if (global && typeof global === 'object') {
  global.window = window || {};
}
let window = global.window;

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
      return xs.of('b');
    }
    let {sinks, sources} = Cycle(app, {other: driver});
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

    function app(ext) {
      return {
        other: ext.other.take(1).startWith('a')
      };
    }
    function driver() {
      return xs.of('b');
    }
    let {sinks, sources} = Cycle(app, {other: driver});

    sinon.assert.calledOnce(spy);
  });

  it('should return a run() which in turn returns a dispose()', function (done) {
    function app(sources) {
      return {
        other: concat(
          sources.other.take(6).map(x => String(x)).startWith('a'),
          xs.never()
        )
      };
    }
    function driver(sink) {
      return sink.map(x => x.charCodeAt(0)).compose(delay(1));
    }
    let {sinks, sources, run} = Cycle(app, {other: driver});
    let dispose;
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
    let number$ = xs.periodic(50).map(i => i+1);
    function app() {
      return {other: number$};
    }
    let {sinks, sources, run} = Cycle(app, {
      other: number$ => number$.map(number => 'x' + number)
    });
    let dispose;
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
        return xs.of('b').debug(spy);
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
        sources.other.addListener({next: () => {}, error: () => {}, complete: () => {}});
        return {
          other: xs.of(10),
        };
      }
      let mutable = 'correct';
      function driver(sink) {
        return sink.map(x => 'a' + 10).debug(x => {
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
        return xs.of('b');
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
