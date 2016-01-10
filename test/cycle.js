/* eslint-disable */
'use strict';
/* global describe, it */
let assert = require('assert');
let Cycle = require('../src/cycle');
let Rx = require('rx');
let most = require('most')
let Bacon = require('baconjs')
let Kefir = require('kefir')
let sinon = require('sinon');

describe('Cycle', function () {
  describe('API', function () {
    it('should have `run`', function () {
      assert.strictEqual(typeof Cycle.run, 'function');
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

    it('should return sinks object and sources object', function () {
      function app(ext) {
        return {
          other: ext.other.take(1).startWith('a')
        };
      }
      function driver(_, convert) {
        return convert(Rx.Observable.just('b'));
      }
      let {sinks, sources, dispose} = Cycle.run(app, {other: driver});
      assert.strictEqual(typeof sinks, 'object');
      assert.strictEqual(typeof sinks.other.subscribe, 'function');
      assert.strictEqual(typeof sources, 'object');
      assert.notStrictEqual(typeof sources.other, 'undefined');
      assert.notStrictEqual(sources.other, null);
      assert.strictEqual(typeof sources.other.subscribe, 'function');
    });

    it('should return a disposable drivers output', function (done) {
      function app(sources) {
        return {
          other: sources.other.take(6).map(x => String(x)).startWith('a')
        };
      }
      function driver(sink, convert) {
        return convert(sink.map(x => x.charCodeAt(0)).delay(1));
      }
      let {sinks, sources, dispose} = Cycle.run(app, {other: driver});
      sources.other.subscribe(x => {
        assert.strictEqual(x, 97);
        dispose();
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
      function driver(sink, convert) {
        return convert(sink.map(x => 'a' + 10))
      }
      let {sinks, sources, dispose} = Cycle.run(app, {other: driver});
      sources.other.take(1).subscribe(x => {
        assert.strictEqual(x, 'a10');
        assert.strictEqual(mutable, 'correct');
        dispose();
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

      function driver(number$, convert) {
        return convert(number$.map(number => 'x' + number))
      }

      let {sinks, sources, dispose} = Cycle.run(app, {other: driver});
      sources.other.subscribe(function (x) {
        assert.notStrictEqual(x, 'x3');
        if (x === 'x2') {
          dispose();
          setTimeout(() => {
            done();
          }, 100);
        }
      });
    });

    it('should report errors from main() in the console', function (done) {
      let sandbox = sinon.sandbox.create();
      sandbox.stub(console, "error");

      function main(sources) {
        return {
          other: sources.other.take(1).startWith('a').map(() => {
            throw new Error('malfunction');
          })
        };
      }
      function driver(_, convert) {
        return convert(Rx.Observable.just('b'));
      }

      Cycle.run(main, {other: driver});
      setTimeout(() => {
        sinon.assert.calledOnce(console.error);
        sinon.assert.calledWithExactly(console.error, sinon.match("malfunction"));

        sandbox.restore();
        done();
      }, 10);
    });

    it('should return a disposable drivers output written in most', function (done) {
      function app(sources) {
        return {
          other: sources.other.take(6).map(x => String(x)).startWith('a')
        };
      }
      function driver(sink, convert) {
        const source = sink.map(x => x.charCodeAt(0)).delay(1);
        return convert(source)
      }
      driver.type = 'most'
      let {sinks, sources, dispose} = Cycle.run(app, {other: driver});
      sources.other.subscribe(x => {
        assert.strictEqual(x, 97);
        dispose();
        done();
      });
    });

    it('should allow writing your application in most', function(done) {
      function app(sources) {
        return {
          other: sources.other.skipRepeats()
        };
      }

      function driver(sink, convert) {
        const source = most.from([1, 2, 2, 2, 3]);
        return convert(source);
      }

      driver.type = 'most'

      const {sinks, sources, dispose} = Cycle.run(app, {other: driver}, {streamLibrary: 'most'});

      sinks.other.skip(2).take(1).observe(x => {
        assert.strictEqual(x, 3);
        dispose();
        done();
      });
    });

    it('should return a disposable drivers output written in bacon', function (done) {
      function app(sources) {
        return {
          other: sources.other.take(6).map(x => String(x)).startWith('a')
        };
      }
      function driver(sink, convert) {
        const source = sink.map(x => x.charCodeAt(0)).delay(1);
        return convert(source)
      }
      driver.type = 'bacon'
      let {sinks, sources, dispose} = Cycle.run(app, {other: driver});
      sources.other.subscribe(x => {
        assert.strictEqual(x, 97);
        dispose();
        done();
      });
    });

    it('should allow writing your application in bacon', function(done) {
      function app(sources) {
        return {
          other: sources.other.skipDuplicates()
        };
      }

      function driver(sink, convert) {
        const source = most.from([1, 2, 2, 2, 3]);
        return convert(source);
      }

      driver.type = 'most'

      const {sinks, sources, dispose} = Cycle.run(app, {other: driver}, {streamLibrary: 'bacon'});

      sinks.other.skip(2).take(1).onValue(x => {
        assert.strictEqual(x, 3);
        dispose();
        done();
      });
    });

    it('should return a disposable drivers output written in kefir', function (done) {
      function app(sources) {
        return {
          other: sources.other.take(6).map(x => String(x)).startWith('a')
        };
      }
      function driver(sink, convert) {
        const source = sink.map(x => x.charCodeAt(0)).delay(1);
        return convert(source)
      }
      driver.type = 'kefir'
      let {sinks, sources, dispose} = Cycle.run(app, {other: driver});
      sources.other.subscribe(x => {
        assert.strictEqual(x, 97);
        dispose();
        done();
      });
    });

    it('should allow writing your application in kefir', function(done) {
      function app(sources) {
        return {
          other: sources.other.skipDuplicates()
        };
      }

      function driver(sink, convert) {
        const source = most.from([1, 2, 2, 2, 3]);
        return convert(source);
      }

      driver.type = 'most'

      const {sinks, sources, dispose} = Cycle.run(app, {other: driver}, {streamLibrary: 'kefir'});

      sinks.other.skip(2).take(1).onValue(x => {
        assert.strictEqual(x, 3);
        dispose();
        done();
      });
    });

  });
});
