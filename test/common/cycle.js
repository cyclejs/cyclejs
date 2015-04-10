'use strict';
/* global describe, it */
let assert = require('assert');
let Cycle = require('../../src/cycle');
let {Rx} = Cycle;

describe('Cycle', function () {
  describe('API', function () {
    it('should have `createStream`', function () {
      assert.strictEqual(typeof Cycle.createStream, 'function');
    });

    it('should have `render`', function () {
      assert.strictEqual(typeof Cycle.render, 'function');
    });

    it('should have `registerCustomElement`', function () {
      assert.strictEqual(typeof Cycle.registerCustomElement, 'function');
    });

    it('should have `vdomPropHook`', function () {
      assert.strictEqual(typeof Cycle.vdomPropHook, 'function');
    });

    it('should have a shortcut to Rx', function () {
      assert.strictEqual(typeof Cycle.Rx, 'object');
    });

    it('should have a shortcut to virtual-hyperscript', function () {
      assert.strictEqual(typeof Cycle.h, 'function');
    });
  });
});
