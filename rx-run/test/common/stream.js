'use strict';
/* global describe, it */
let assert = require('assert');
let Rx = require('rx');
let createStream = require('../../src/stream2');

describe('createStream', function () {
  it('should throw an error when given no arguments', function () {
    assert.throws(function () {
      createStream();
    });
  });

  it('should throw an error when used as a constructor', function () {
    assert.throws(function () {
      new createStream(function () { return Rx.Observable.just(1); });
    }, /Cannot use `new`/i);
  });

  it('should throw an error when given an argument which is not a function', function () {
    assert.throws(function () {
      createStream(['foo$', 'bar$']);
    });
  });

  // definitionFn is a little bit lazy right now
  it.skip('should throw an error when definitionFn doesn\'t return object');

  it('should return an injectable Rx.Observable', function () {
    var stream = createStream(function () { return Rx.Observable.just(1); });
    assert.strictEqual(typeof stream, 'object');
    assert.strictEqual(typeof stream.subscribe, 'function');
    assert.strictEqual(typeof stream.inject, 'function');
    assert.strictEqual(typeof stream.dispose, 'function');
  });
});

describe('Stream', function () {
  it('should not operate after dispose() has been called', function (done) {
    var first$ = createStream(function () {
      return Rx.Observable.interval(100).map(x => x + 1).take(3);
    });
    var second$ = createStream(function (first$) {
      return first$.map(x => x * 10);
    });
    second$.inject(first$);
    second$.subscribe(function (x) {
      assert.notStrictEqual(x, 30);
    });
    setTimeout(function () { second$.dispose(); }, 250);
    setTimeout(function () {
      done();
    }, 400);
  });

  describe('injection', function () {
    it('should return the same given input', function () {
      var bar$ = createStream(function (foo$) {
        return foo$.map(function () { return 'bar'; });
      });
      var foo$ = createStream(function () {
        return Rx.Observable.just(3);
      });
      var x = bar$.inject(foo$);
      assert.strictEqual(x, foo$);
    });

    it('should return an array of the inputs, if multiple inputs', function () {
      var bar$ = createStream(function (foo1$, foo2$) {
        return foo1$.sample(foo2$).map(() => 'bar');
      });
      var foo1$ = createStream(function () {
        return Rx.Observable.just(3);
      });
      var foo2$ = createStream(function () {
        return Rx.Observable.just(2);
      });
      var x = bar$.inject(foo1$, foo2$);
      assert.strictEqual(Array.isArray(x), true);
      assert.strictEqual(x.length, 2);
      assert.strictEqual(x[0], foo1$);
      assert.strictEqual(x[1], foo2$);
    });

    it('should yield simple output when injected simple input', function (done) {
      var bar$ = createStream(function (foo$) {
        return foo$.map(() => 'bar');
      });
      bar$.subscribe(function (x) {
        assert.strictEqual(x, 'bar');
        done();
      });
      bar$.inject(Rx.Observable.just('foo'));
    });

    it('should yield simple output even when injected nothing', function (done) {
      var bar$ = createStream(function () {
        return Rx.Observable.just(246);
      });
      bar$.subscribe(function (x) {
        assert.strictEqual(x, 246);
        done();
      });
      bar$.inject();
    });

    it('should work also for a clone, in the simple output case', function (done) {
      var definitionFn = function definitionFn(foo$) {
        return foo$.map(() => 'bar');
      };
      var bar1$ = createStream(definitionFn); // jshint ignore:line
      var bar2$ = createStream(definitionFn);
      bar2$.subscribe(function (x) {
        assert.strictEqual(x, 'bar');
        done();
      });
      bar2$.inject(Rx.Observable.just('foo'));
    });

    it('should be independent to injection in clones', function (done) {
      var definitionFn = function definitionFn(number$) {
        return number$.map(x => x + 100);
      };
      var sum1$ = createStream(definitionFn);
      var sum2$ = createStream(definitionFn);
      Rx.Observable.zip(sum1$, sum2$, function (x, y) {
        return [x, y];
      }).subscribe(function (args) {
        assert.strictEqual(args[0], 103);
        assert.strictEqual(args[1], 107);
        done();
      });
      sum1$.inject(Rx.Observable.just(3));
      sum2$.inject(Rx.Observable.just(7));
    });

    it('should yield output when injected two inputs', function (done) {
      var sum$ = createStream(function (x$, y$) {
        return Rx.Observable.combineLatest(x$, y$, (x, y) => x + y);
      });
      sum$.subscribe(function (x) {
        assert.strictEqual(x, 15);
        done();
      });
      sum$.inject(Rx.Observable.just(9), Rx.Observable.just(6));
    });
  });
});
