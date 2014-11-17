'use strict';
/* global describe, it */
var assert = require('assert');
var Rx = require('rx');
var Cycle = require('../src/cycle');

describe('defineView', function () {
  it('should throw error if output object does not have vtree$', function () {
    assert.throws(function () {
      Cycle.defineView([], function () { return {}; });
    });
  });

  it('should yield simple output even when injected nothing', function (done) {
    var view = Cycle.defineView(function () {
      return {
        vtree$: Rx.Observable.just(Cycle.h()),
        events: []
      };
    });
    view.vtree$.subscribe(function (x) {
      assert.strictEqual(typeof x, 'object');
      done();
    });
    view.inject();
  });

  it('should be cloneable', function (done) {
    var view = Cycle.defineIntent(['foo$'], function (input) {
      return {
        vtree$: input.foo$.map(function () { return Cycle.h('div', 'bar'); }),
        events: []
      };
    });
    var clone = view.clone();
    clone.vtree$.subscribe(function (x) {
      assert.strictEqual(typeof x, 'object');
      assert.strictEqual(x.tagName, 'div');
      assert.strictEqual(x.children[0].text, 'bar');
      done();
    });
    view.inject({foo$: Rx.Observable.just('foo')});
    clone.inject({foo$: Rx.Observable.just('foo')});
  });

  it('should throw error if `events` is not outputted', function () {
    assert.throws(function () {
      Cycle.defineView(['foo$'], function (input) {
        return {
          vtree$: input.foo$.map(function () { return Cycle.h('div', 'bar'); })
        };
      });
    }, /View must define `events` array/);
  });

  it('should throw error if `vtree$` is not outputted', function () {
    assert.throws(function () {
      Cycle.defineView(['foo$'], function (input) {
        return {
          vtree: input.foo$.map(function () { return Cycle.h('div', 'bar'); }),
          events: []
        };
      });
    }, /View must define `vtree\$` Observable/);
  });

  it('should throw error if `vtree$` emits a non-vtree', function () {
    var view = Cycle.defineView(function () {
      return {
        vtree$: Rx.Observable.just('bar'),
        events: []
      };
    });
    assert.throws(function () {
      view.vtree$.subscribe(function (x) {
        var noop = function () {};
        noop(x);
      });
    }, /View `vtree\$` must emit only VirtualNode instances/);
  });

  it('should throw error if vtree has event hook name that wasn\'t defined', function () {
    var view = Cycle.defineView(function () {
      return {
        vtree$: Rx.Observable.just(Cycle.h('div', {'ev-click': 'foo'})),
        events: ['foo$']
      };
    });
    assert.throws(function () {
      view.vtree$.subscribe(function (x) {
        var noop = function noop() {};
        noop(x);
      });
    }, /VTree uses event hook \`[^\`]*\` which should have been defined/);
  });
});
