'use strict';
/* global describe, it */
let assert = require('assert');
let Cycle = require('../../src/cycle');

describe('Cycle', function () {
  describe('API', function () {
    it('should have `render`', function () {
      assert.strictEqual(typeof Cycle.render, 'function');
    });

    it('should have `CustomElementsRegistry`', function () {
      assert.strictEqual(typeof Cycle.CustomElementsRegistry, 'function');
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
