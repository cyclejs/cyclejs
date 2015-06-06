'use strict';
/* global describe, it */
let assert = require('assert');
let Cycle = require('../../src/core/cycle');

describe('Cycle', function () {
  describe('API', function () {
    it('should have `run`', function () {
      assert.strictEqual(typeof Cycle.run, 'function');
    });

    it('should have `makeDOMAdapter`', function () {
      assert.strictEqual(typeof Cycle.makeDOMAdapter, 'function');
    });

    it('should have `makeHTMLAdapter`', function () {
      assert.strictEqual(typeof Cycle.makeHTMLAdapter, 'function');
    });

    it('should have a shortcut to Rx', function () {
      assert.strictEqual(typeof Cycle.Rx, 'object');
    });

    it('should have a shortcut to virtual-hyperscript', function () {
      assert.strictEqual(typeof Cycle.h, 'function');
    });

    it('should have a shortcut to virtual-dom\'s svg', function () {
      assert.strictEqual(typeof Cycle.svg, 'function');
    });
  });

  describe('run()', function () {
    it('should return app output and adapters output', function () {
      function app(ext) {
        return {
          other: ext.get('other').take(1).startWith('a')
        };
      }
      function adapter() {
        return {
          get: () => Cycle.Rx.Observable.just('b')
        };
      }
      let [left, right] = Cycle.run(app, {other: adapter});
      assert.strictEqual(typeof left, 'object');
      assert.strictEqual(typeof left.other.subscribe, 'function');
      assert.strictEqual(typeof right, 'object');
      assert.strictEqual(typeof right.get, 'function');
      assert.strictEqual(typeof right.get('other').subscribe, 'function');
    });

    it('should return a disposable adapters output', function (done) {
      function app(res) {
        return {
          other: res.get('other').take(6).map(x => String(x)).startWith('a')
        };
      }
      function adapter(req) {
        return {
          get: () => req.map(x => x.charCodeAt(0))
        };
      }
      let [requests, responses] = Cycle.run(app, {other: adapter});
      responses.get('other').subscribe(x => {
        assert.strictEqual(x, 97);
        responses.dispose();
        done();
      });
    });
  });
});
