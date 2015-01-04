'use strict';
/* global describe, it */
var assert = require('assert');
var Rx = require('rx');
var Cycle = require('../src/cycle');

describe('createView', function () {
  it('should throw error if output object does not have vtree$', function () {
    assert.throws(function () {
      Cycle.createView(function () { return {}; });
    });
  });

  it('should yield simple output even when injected nothing', function (done) {
    var view = Cycle.createView(function () {
      return {
        vtree$: Rx.Observable.just(Cycle.h()),
        events: []
      };
    });
    view.get('vtree$').subscribe(function (x) {
      assert.strictEqual(typeof x, 'object');
      done();
    });
    view.inject();
  });

  it('should be cloneable', function (done) {
    var view = Cycle.createIntent(function (input) {
      return {
        vtree$: input.get('foo$').map(function () { return Cycle.h('div', 'bar'); }),
        events: []
      };
    });
    var clone = view.clone();
    clone.get('vtree$').subscribe(function (x) {
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
      Cycle.createView(function (input) {
        return {
          vtree$: input.get('foo$').map(function () { return Cycle.h('div', 'bar'); })
        };
      });
    }, /View must define `events` array/);
  });

  it('should throw error if `vtree$` is not outputted', function () {
    assert.throws(function () {
      Cycle.createView(function (input) {
        return {
          vtree: input.get('foo$').map(function () { return Cycle.h('div', 'bar'); }),
          events: []
        };
      });
    }, /View must define `vtree\$` Observable/);
  });

  it('should throw error if `vtree$` is not Observable', function () {
    assert.throws(function () {
      Cycle.createView(function () {
        return {
          vtree$: 123,
          events: []
        };
      });
    }, /View must define `vtree\$` Observable/);

    assert.throws(function () {
      Cycle.createView(function () {
        return {
          vtree$: [], // has map function but is not Observable
          events: []
        };
      });
    }, /View must define `vtree\$` Observable/);
  });

  it('should throw error if `vtree$` emits a non-vtree', function () {
    var view = Cycle.createView(function () {
      return {
        vtree$: Rx.Observable.just('bar'),
        events: []
      };
    });
    assert.throws(function () {
      view.get('vtree$').subscribe(function (x) {
        var noop = function () {};
        noop(x);
      });
    }, /View `vtree\$` must emit only VirtualNode instances/);
  });

  it('should throw error if vtree has event hook name that wasn\'t defined', function () {
    var view = Cycle.createView(function () {
      return {
        vtree$: Rx.Observable.just(Cycle.h('div', {'ev-click': 'foo'})),
        events: ['foo$']
      };
    });
    assert.throws(function () {
      view.get('vtree$').subscribe(function (x) {
        var noop = function noop() {};
        noop(x);
      });
    }, /VTree uses event hook \`[^\`]*\` which should have been defined/);
  });

  it('should silently ignore undefined vtree children', function () {
    assert.doesNotThrow(function () {
      var view = Cycle.createView(function () {
        return {
          vtree$: Rx.Observable.just(Cycle.h('div', [
            Cycle.h('div', 'a'),
            Cycle.h('div', 'b'),
            Cycle.h('div', 'c')
          ]))
          .map(function (vtree) {
            vtree.children.length = 4;
            return vtree;
          }),
          events: []
        };
      });
      view.get('vtree$').subscribe(function (x) {
        var noop = function noop() {};
        noop(x);
      });
    });
  });

  it('should work even when using combineLatest internally', function () {
    assert.doesNotThrow(function () {
      var view = Cycle.createView(function () {
        var vtree1$ = Rx.Observable.just(Cycle.h('h1', {'ev-click': 'h1Clicks$'}, 'Foo'));
        var vtree2$ = Rx.Observable.range(1,3)
          .map(function () { return Cycle.h('h2', 'Bar'); })
        return {
          vtree$: Rx.Observable.combineLatest(vtree1$, vtree2$, function (a, b) {
            return Cycle.h('div', [a, b]);
          }),
          events: ['h1Clicks$']
        };
      });
      view.get('vtree$').subscribe(function (x) {
        var noop = function noop() {};
        noop(x);
      });
    });
  });
});
