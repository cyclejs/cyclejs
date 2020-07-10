// tslint:disable-next-line
import 'mocha';
import * as assert from 'assert';
import {setup} from '../src/index';
import * as most from 'most';
import {Stream} from 'most';
import xs, {Stream as xsStream} from 'xstream';

describe('setup', function() {
  it('should be a function', function() {
    assert.strictEqual(typeof setup, 'function');
  });

  it('should throw if first argument is not a function', function() {
    assert.throws(() => {
      (setup as any)('not a function');
    }, /First argument given to Cycle must be the 'main' function/i);
  });

  it('should throw if second argument is not an object', function() {
    assert.throws(() => {
      (setup as any)(() => {}, 'not an object');
    }, /Second argument given to Cycle must be an object with driver functions/i);
  });

  it('should throw if second argument is an empty object', function() {
    assert.throws(() => {
      setup(() => ({}), {});
    }, /Second argument given to Cycle must be an object with at least one/i);
  });

  it('should allow to not use all sources in main', function() {
    function app(so: {first: Stream<string>}) {
      return {
        first: xs.of('test'),
        second: xs.of('string'),
      };
    }
    function app2() {
      return {second: xs.of('test')};
    }
    function driver(sink: xsStream<string>) {
      return xs.of('answer');
    }
    const {sinks, sources} = setup(app, {first: driver, second: driver});
    const {sinks: sinks2, sources: sources2} = setup(app2, {
      first: driver,
      second: driver,
    });

    assert.strictEqual(typeof sinks, 'object');
    assert.strictEqual(typeof sinks.second.addListener, 'function');
    assert.strictEqual(typeof sinks2, 'object');
    assert.strictEqual(typeof sinks2.second.addListener, 'function');
  });

  it('should return sinks object and sources object', function() {
    type MySources = {
      other: Stream<string>;
    };

    type MySinks = {
      other: Stream<string>;
    };

    function app(_sources: MySources): MySinks {
      return {
        other: _sources.other.take(1).startWith('a'),
      };
    }
    function driver() {
      return most.of('b');
    }
    const {sinks, sources} = setup(app, {other: driver});
    assert.strictEqual(typeof sinks, 'object');
    assert.strictEqual(typeof sinks.other.observe, 'function');
    assert.strictEqual(typeof sources, 'object');
    assert.notStrictEqual(typeof sources.other, 'undefined');
    assert.notStrictEqual(sources.other, null);
    assert.strictEqual(typeof sources.other.observe, 'function');
  });

  it('should return a run() which in turn returns a dispose()', function(done) {
    type TestSources = {
      other: Stream<number>;
    };

    type TestSinks = {
      other: Stream<string>;
    };

    function app(_sources: TestSources): TestSinks {
      return {
        other: most.concat(
          _sources.other
            .take(6)
            .map(String)
            .startWith('a'),
          most.never()
        ),
      };
    }
    function driver(xsSink: xsStream<string>) {
      return most
        .from(xsSink)
        .map(x => x.charCodeAt(0))
        .delay(1);
    }
    const {sources, run} = setup(app, {other: driver});
    let dispose: any;
    sources.other
      .observe(x => {
        assert.strictEqual(x, 97);
        dispose();
        done();
      })
      .catch(done);
    dispose = run();
  });

  it('should not type check drivers that use xstream', function() {
    type MySources = {
      other: Stream<string>;
    };

    type MySinks = {
      other: Stream<string>;
    };

    function app(_sources: MySources): MySinks {
      return {
        other: _sources.other.take(1).startWith('a'),
      };
    }
    function xsdriver(sink: xs<string>): xs<string> {
      return xs.of('b');
    }

    const {sinks, sources} = setup(app, {other: xsdriver});
    assert.strictEqual(typeof sinks, 'object');
    assert.strictEqual(typeof sinks.other.subscribe, 'function');
    assert.strictEqual(typeof sources, 'object');
    assert.notStrictEqual(typeof sources.other, 'undefined');
    assert.notStrictEqual(sources.other, null);
    assert.strictEqual(typeof sources.other.subscribe, 'function');
  });

  it('should not work after has been disposed', function(done) {
    const number$ = most
      .periodic(50, 1)
      .scan((x, y) => x + y, 0)
      .map(i => i + 1);
    function app(_sources: any) {
      return {other: number$};
    }
    const {sources, run} = setup(app, {
      other: (num$: xsStream<number>) => most.from(num$).map(num => 'x' + num),
    });
    let dispose: any;
    sources.other
      .observe((x: any) => {
        assert.notStrictEqual(x, 'x3');
        if (x === 'x2') {
          dispose();
          setTimeout(() => {
            done();
          }, 100);
        }
      })
      .catch(done);
    dispose = run();
  });
});
