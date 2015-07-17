'use strict';
/* global describe, it */
let assert = require('assert');
let Cycle = require('../src/cycle');

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
      }, /First argument given to Cycle\.run\(\) must be the `main` function/i);
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
        return req.map(x => x.charCodeAt(0));
      }
      let [requests, responses] = Cycle.run(app, {other: driver});
      responses.other.subscribe(x => {
        assert.strictEqual(x, 97);
        responses.dispose();
        done();
      });
    });
  });
});
