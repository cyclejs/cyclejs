/* eslint-disable */
'use strict';
/* global describe, it */
let assert = require('assert');
let isolate = require('../src/index');
let Rx = require('rx');
let sinon = require('sinon');

describe('isolate', function () {
  it('should be a function', function () {
    assert.strictEqual(typeof isolate, 'function');
  });

  it('should throw if first argument is not a function', function () {
    assert.throws(() => {
      isolate('not a function');
    }, /First argument given to isolate\(\) must be a 'dataflowComponent' function/i);
  });

  it('should throw if second argument is not a string', function () {
    function MyDataflowComponent() {}
    assert.throws(() => {
      isolate(MyDataflowComponent, null);
    }, /Second argument given to isolate\(\) must be a string for 'scope'/i);
  });

  it('should return a function', function () {
    function MyDataflowComponent() {}
    const scopedMyDataflowComponent = isolate(MyDataflowComponent, `myScope`);
    assert.strictEqual(typeof scopedMyDataflowComponent, `function`);
  });

  it('should make a new scope if second argument is undefined', function () {
    function MyDataflowComponent() {}
    const scopedMyDataflowComponent = isolate(MyDataflowComponent);
    assert.strictEqual(typeof scopedMyDataflowComponent, `function`);
  });

  describe('scopedDataflowComponent', function () {
    it('should return a valid dataflow component', function () {
      function driver() {
        return {};
      }

      function MyDataflowComponent(sources) {
        return {
          other: Rx.Observable.just('a')
        };
      }
      const scopedMyDataflowComponent = isolate(MyDataflowComponent);
      const scopedSinks = scopedMyDataflowComponent({other: driver()});

      assert.strictEqual(typeof scopedSinks, `object`);
      scopedSinks.other.subscribe(x => {
        assert.strictEqual(x, 'a');
      })
    })

    it('should call `isolateSource` of drivers', function () {
      function driver() {
        const someFunc = function (v) {
          const scope = this.scope;
          return {
            scope: scope.concat(v),
            someFunc,
            isolateSource
          };
        };
        const isolateSource = function (source, scope) {
          return source.someFunc(scope);
        };
        return {
          scope: [],
          someFunc,
          isolateSource
        };
      }

      function MyDataflowComponent(sources) {
        return {
          other: sources.other.someFunc('a')
        };
      }
      const scopedMyDataflowComponent = isolate(MyDataflowComponent, `myScope`);
      const scopedSinks = scopedMyDataflowComponent({other: driver()});
      assert.strictEqual(scopedSinks.other.scope.length, 2);
      assert.strictEqual(scopedSinks.other.scope[0], `myScope`);
      assert.strictEqual(scopedSinks.other.scope[1], `a`);
    });

    it('should call `isolateSink` of drivers', function () {
      function driver() {
        const isolateSink = function (sink, scope) {
          return sink.map(v => `${v} ${scope}`);
        };
        return {
          isolateSink
        };
      }

      function MyDataflowComponent(sources) {
        return {
          other: ['a']
        };
      }
      const scopedMyDataflowComponent = isolate(MyDataflowComponent, `myScope`);
      const scopedSinks = scopedMyDataflowComponent({other: driver()});
      assert.strictEqual(scopedSinks.other.length, 1);
      assert.strictEqual(scopedSinks.other[0], `a myScope`);
    });
  });
});
