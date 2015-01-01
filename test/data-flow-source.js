'use strict';
/* global describe, it */
var assert = require('assert');
var DataFlowSource = require('../src/data-flow-source');

describe('DataFlowSource', function () {
  describe('constructor', function () {
    it('should throw an error if constructor input is not object', function () {
      assert.throws(function () {
        new DataFlowSource(function () {});
      }, /DataFlowSource expects the constructor argument to be the output object/);
    });

    it('should throw an error when given more than one argument', function () {
      assert.throws(function () {
        new DataFlowSource({foo: 'bar'}, 'baz');
      }, /DataFlowSource expects only one argument: the output object/);
    });

    it('should copy keys from the input object to itself', function () {
      var source = new DataFlowSource({foo: 'bar', baz: 'qux'});
      assert.equal(source.foo, 'bar');
      assert.equal(source.baz, 'qux');
    });
  });

  it('might have an inject function', function () {
    var source = new DataFlowSource({foo: 'bar'});
    var injectIsFunction = typeof source.inject === 'function';
    var injectIsUndefined = typeof source.inject === 'undefined';
    assert.strictEqual(injectIsFunction || injectIsUndefined, true);
  });

  it('should throw an error if has inject function and it was called', function () {
    var source = new DataFlowSource({foo: 'bar'});
    assert.throws(function () {
      source.inject({baz: '123'});
    }, /DataFlowSource cannot be injected/);
  });
});
