'use strict';
/* global describe, it */
let assert = require('assert');
let Cycle = require('../src/cycle');
let sinon = require('sinon');

describe('Cycle', function () {
  describe('API', function () {
    it('should have `run`', function () {
      assert.strictEqual(typeof Cycle.run, 'function');
    });

    it('should have a shortcut to Rx', function () {
      assert.strictEqual(typeof Cycle.Rx, 'object');
    });
  });

  describe('run()', function () {
    it('should throw if first argument is not a function', function () {
      assert.throws(() => {
        Cycle.run('not a function');
      }, /First argument given to Cycle\.run\(\) must be the 'main' function/i);
    });

    it('should throw if second argument is not an object', function () {
      assert.throws(() => {
        Cycle.run(() => {}, 'not an object');
      }, /Second argument given to Cycle\.run\(\) must be an object with driver functions/i);
    });

    it('should throw if second argument is an empty object', function () {
      assert.throws(() => {
        Cycle.run(() => {}, {});
      }, /Second argument given to Cycle\.run\(\) must be an object with at least one/i);
    });

    it('should return requests object and responses object', function () {
      function app(ext) {
        return {
          other: ext.other.take(1).startWith('a')
        };
      }
      function driver() {
        return Cycle.Rx.Observable.just('b');
      }
      let [left, right] = Cycle.run(app, {other: driver});
      assert.strictEqual(typeof left, 'object');
      assert.strictEqual(typeof left.other.subscribe, 'function');
      assert.strictEqual(typeof right, 'object');
      assert.notStrictEqual(typeof right.other, 'undefined');
      assert.notStrictEqual(right.other, null);
      assert.strictEqual(typeof right.other.subscribe, 'function');
    });

    it('should return a disposable drivers output', function (done) {
      function app(res) {
        return {
          other: res.other.take(6).map(x => String(x)).startWith('a')
        };
      }
      function driver(req) {
        return req.map(x => x.charCodeAt(0)).delay(1);
      }
      let [requests, responses] = Cycle.run(app, {other: driver});
      responses.other.subscribe(x => {
        assert.strictEqual(x, 97);
        requests.dispose();
        responses.dispose();
        done();
      });
    });

    it('should happen on event loop\'s next tick', function (done) {
      function app() {
        return {
          other: Cycle.Rx.Observable.from([10, 20, 30]),
        };
      }
      let mutable = 'wrong';
      function driver(req) {
        return req.map(x => 'a' + 10)
      }
      let [requests, responses] = Cycle.run(app, {other: driver});
      responses.other.take(1).subscribe(x => {
        assert.strictEqual(x, 'a10');
        assert.strictEqual(mutable, 'correct');
        requests.dispose();
        responses.dispose();
        done();
      });
      mutable = 'correct';
    });

    it('should not work after has been disposed', function (done) {
      let number$ = Cycle.Rx.Observable.range(1, 3)
        .concatMap(x => Cycle.Rx.Observable.just(x).delay(50));
      function app() {
        return {other: number$};
      }
      let [requests, responses] = Cycle.run(app, {
        other: number$ => number$.map(number => 'x' + number)
      });
      responses.other.subscribe(function (x) {
        assert.notStrictEqual(x, 'x3');
        if (x === 'x2') {
          requests.dispose();
          responses.dispose();
          setTimeout(() => {
            done();
          }, 100);
        }
      });
    });

    it('should report errors from main() in the console', function (done) {
      let sandbox = sinon.sandbox.create();
      sandbox.stub(console, "error");

      function main(responses) {
        return {
          other: responses.other.take(1).startWith('a').map(() => {
            throw new Error('malfunction');
          })
        };
      }
      function driver() {
        return Cycle.Rx.Observable.just('b');
      }

      Cycle.run(main, {other: driver});
      setTimeout(() => {
        sinon.assert.calledOnce(console.error);
        sinon.assert.calledWithExactly(console.error, sinon.match("malfunction"));

        sandbox.restore();
        done();
      }, 10);
    });
  });
});
