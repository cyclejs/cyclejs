// tslint:disable-next-line
import 'mocha';
import * as assert from 'assert';
import {setup} from '../src/index';
import {
  continueWith,
  delay,
  map,
  never,
  now,
  periodic,
  runEffects,
  scan,
  startWith,
  take,
  tap,
} from '@most/core';
import {newDefaultScheduler} from '@most/scheduler';
import {Stream} from '@most/types';
import xs, {Stream as xsStream} from 'xstream';

const testScheduler = newDefaultScheduler();

function observe<T>(stream: Stream<T>, listener: (value: T) => void) {
  return runEffects(tap(listener, stream), testScheduler);
}

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
        other: startWith('a', take(1, _sources.other)),
      };
    }
    function driver() {
      return now('b');
    }
    const {sinks, sources} = setup(app, {other: driver});
    assert.strictEqual(typeof sinks, 'object');
    assert.strictEqual(typeof sinks.other.run, 'function');
    assert.strictEqual(typeof sources, 'object');
    assert.notStrictEqual(typeof sources.other, 'undefined');
    assert.notStrictEqual(sources.other, null);
    assert.strictEqual(typeof sources.other.run, 'function');
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
        other: continueWith(
          never,
          startWith('a', map(String, take(6, _sources.other)))
        ),
      };
    }
    function driver(xsSink: xsStream<string>) {
      return delay(
        1,
        map(x => x.charCodeAt(0), sourcesForDriver(xsSink))
      );
    }
    const {sources, run} = setup(app, {other: driver});
    let dispose: any;
    observe(take(1, sources.other), x => {
      assert.strictEqual(x, 97);
      dispose();
      done();
    }).catch(done);
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
        other: startWith('a', take(1, _sources.other)),
      };
    }
    function xsdriver(sink: xs<string>): xs<string> {
      return xs.of('b');
    }

    const {sinks, sources} = setup(app, {other: xsdriver});
    assert.strictEqual(typeof sinks, 'object');
    assert.strictEqual(typeof sinks.other.run, 'function');
    assert.strictEqual(typeof sources, 'object');
    assert.notStrictEqual(typeof sources.other, 'undefined');
    assert.notStrictEqual(sources.other, null);
    assert.strictEqual(typeof sources.other.run, 'function');
  });

  it('should not work after has been disposed', function(done) {
    const number$ = map(
      i => i + 1,
      scan(x => x + 1, 0, periodic(50))
    );
    function app(_sources: any) {
      return {other: number$};
    }
    const {sources, run} = setup(app, {
      other: (_num$: xsStream<number>) =>
        map(num => 'x' + num, sourcesForDriver(_num$)),
    });
    let dispose: any;
    observe(sources.other, (x: any) => {
      assert.notStrictEqual(x, 'x3');
      if (x === 'x2') {
        dispose();
        setTimeout(() => {
          done();
        }, 100);
      }
    }).catch(done);
    dispose = run();
  });
});

function sourcesForDriver<T>(stream: xsStream<T>): Stream<T> {
  return {
    run(sink, scheduler) {
      const listener = {
        next(value: T) {
          sink.event(scheduler.currentTime(), value);
        },
        error(error: any) {
          sink.error(scheduler.currentTime(), error);
        },
        complete() {
          sink.end(scheduler.currentTime());
        },
      };
      stream.addListener(listener);
      return {dispose: () => stream.removeListener(listener)};
    },
  };
}
