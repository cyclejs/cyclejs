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
    it.skip('should return app output and adapters output', function () {
      assert.fail(); // TODO
    });

    it.skip('should return a disposable adapters output', function () {
      assert.fail(); // TODO
    });
  });
});
