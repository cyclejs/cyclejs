/* eslint-disable */
'use strict';
/* global describe, it */
let assert = require('assert');
let Cycle = require('../src/cycle');
let Rx = require('rx');
let sinon = require('sinon');

describe('Cycle', function () {
  describe('API', function () {
    it('should have `run`', function () {
      assert.strictEqual(typeof Cycle.run, 'function');
    });

    it('should have `isolate`', function () {
      assert.strictEqual(typeof Cycle.isolate, 'function');
    });
  });

  describe('run()', function () {
    it('should throw if first argument is not a function', function () {
      assert.throws(() => {
        Cycle.run('not a function');
      }, /First argument given to Cycle\.run\(\) must be the 'main' function/i);
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
        return Rx.Observable.just('b');
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
        return req.map(x => x.charCodeAt(0)).delay(1);
      }
      let [requests, responses] = Cycle.run(app, {other: driver});
      responses.other.subscribe(x => {
        assert.strictEqual(x, 97);
        requests.dispose();
        responses.dispose();
        done();
      });
    });

    it('should happen on event loop\'s next tick', function (done) {
      function app() {
        return {
          other: Rx.Observable.from([10, 20, 30]),
        };
      }
      let mutable = 'wrong';
      function driver(req) {
        return req.map(x => 'a' + 10)
      }
      let [requests, responses] = Cycle.run(app, {other: driver});
      responses.other.take(1).subscribe(x => {
        assert.strictEqual(x, 'a10');
        assert.strictEqual(mutable, 'correct');
        requests.dispose();
        responses.dispose();
        done();
      });
      mutable = 'correct';
    });

    it('should not work after has been disposed', function (done) {
      let number$ = Rx.Observable.range(1, 3)
        .concatMap(x => Rx.Observable.just(x).delay(50));
      function app() {
        return {other: number$};
      }
      let [requests, responses] = Cycle.run(app, {
        other: number$ => number$.map(number => 'x' + number)
      });
      responses.other.subscribe(function (x) {
        assert.notStrictEqual(x, 'x3');
        if (x === 'x2') {
          requests.dispose();
          responses.dispose();
          setTimeout(() => {
            done();
          }, 100);
        }
      });
    });

    it('should report errors from main() in the console', function (done) {
      let sandbox = sinon.sandbox.create();
      sandbox.stub(console, "error");

      function main(responses) {
        return {
          other: responses.other.take(1).startWith('a').map(() => {
            throw new Error('malfunction');
          })
        };
      }
      function driver() {
        return Rx.Observable.just('b');
      }

      Cycle.run(main, {other: driver});
      setTimeout(() => {
        sinon.assert.calledOnce(console.error);
        sinon.assert.calledWithExactly(console.error, sinon.match("malfunction"));

        sandbox.restore();
        done();
      }, 10);
    });
  });

  describe('isolate()', function () {
    it('should throw if first argument is not a function', function () {
      assert.throws(() => {
        Cycle.isolate('not a function');
      }, /First argument given to Cycle\.isolate\(\) must be a 'dialogue' function/i);
    });

    it('should throw if second argument is not a string', function () {
      function MyDialogue() {}
      assert.throws(() => {
        Cycle.isolate(MyDialogue, null);
      }, /Second argument given to Cycle\.isolate\(\) must be a string for 'scope'/i);
    });

    it('should return a function', function () {
      function MyDialogue() {}
      const scopedMyDialogue = Cycle.isolate(MyDialogue, `myScope`);
      assert.strictEqual(typeof scopedMyDialogue, `function`);
    });

    it('should make a new scope if second argument is undefined', function () {
      function MyDialogue() {}
      const scopedMyDialogue = Cycle.isolate(MyDialogue);
      assert.strictEqual(typeof scopedMyDialogue, `function`);
    });

    describe('scopedDialogue', function () {
      it('should return scoped sinks', function () {
        function driver() {
          return {};
        }

        function MyDialogue(sources) {
          return {
            other: Rx.Observable.just('a')
          };
        }
        const scopedMyDialogue = Cycle.isolate(MyDialogue);
        const scopedSinks = scopedMyDialogue({other: driver()});

        assert.strictEqual(typeof scopedSinks, `object`);
        scopedSinks.other.subscribe(x => {
          assert.strictEqual(x, 'a');
        })
      })

      it('should isolate sources', function () {
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

        function MyDialogue(sources) {
          return {
            other: sources.other.someFunc('a')
          };
        }
        // First test no isolation...
        const myDialogue = MyDialogue({other: driver()})
        assert.strictEqual(myDialogue.other.scope.length, 1);
        assert.strictEqual(myDialogue.other.scope[0], `a`);
        // ...then test isolated
        const scopedMyDialogue = Cycle.isolate(MyDialogue, `myScope`);
        const scopedSinks = scopedMyDialogue({other: driver()});
        assert.strictEqual(scopedSinks.other.scope.length, 2);
        assert.strictEqual(scopedSinks.other.scope[0], `myScope`);
        assert.strictEqual(scopedSinks.other.scope[1], `a`);
      });

      it('should isolate sinks', function () {
        function driver() {
          const isolateSink = function (sink, scope) {
            return sink.map(v => `${v} ${scope}`);
          };
          return {
            isolateSink
          };
        }

        function MyDialogue(sources) {
          return {
            other: ['a']
          };
        }
        // First test no isolation...
        const myDialogue = MyDialogue({other: driver()})
        assert.strictEqual(myDialogue.other.length, 1);
        assert.strictEqual(myDialogue.other[0], `a`);
        // ...then test isolated
        const scopedMyDialogue = Cycle.isolate(MyDialogue, `myScope`);
        const scopedSinks = scopedMyDialogue({other: driver()});
        assert.strictEqual(scopedSinks.other.length, 1);
        assert.strictEqual(scopedSinks.other[0], `a myScope`);
      });
    });
  });
});
