// tslint:disable-next-line
import 'mocha';
import * as assert from 'assert';
import {setup, Driver} from '../src/index';
import xs, {Stream} from 'xstream';
import concat from 'xstream/extra/concat';
import delay from 'xstream/extra/delay';

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
      (setup as any)(() => {}, {});
    }, /Second argument given to Cycle must be an object with at least one/i);
  });

  it('should allow to have a driver that takes a union as input', function() {
    function app(so: {drv: Stream<string>}) {
      return {
        drv: xs.of('foo'),
      };
    }

    const {sinks, sources} = setup(app, {
      drv: (s: Stream<string | number>) => xs.of('foo'),
    });
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
    function driver(sink: Stream<string>) {
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
    function app(ext: {other: Stream<string>}) {
      return {
        other: ext.other.take(1).startWith('a'),
      };
    }
    function driver() {
      return xs.of('b');
    }
    const {sinks, sources} = setup(app, {other: driver});
    assert.strictEqual(typeof sinks, 'object');
    assert.strictEqual(typeof sinks.other.addListener, 'function');
    assert.strictEqual(typeof sources, 'object');
    assert.notStrictEqual(typeof sources.other, 'undefined');
    assert.notStrictEqual(sources.other, null);
    assert.strictEqual(typeof sources.other.addListener, 'function');
  });

  it('should type-check keyof sources and sinks in main and drivers', function() {
    type Sources = {
      str: Stream<string>;
      obj: Stream<object>;
    };

    function app(sources: Sources) {
      return {
        str: sources.str.take(1).startWith('a'), // good
        // str: sources.obj.mapTo('good'), // good
        // strTYPO: sources.str.take(1).startWith('a'), // bad
        // str: xs.of(123), // bad
        num: xs.of(100), // good
        // numTYPO: xs.of(100), // bad
        // num: xs.of('BAD TYPE'), // bad
      };
    }

    const stringDriver: Driver<Stream<string>, Stream<string>> = (
      sink: Stream<string>
    ) => xs.of('b');

    const numberWriteOnlyDriver: Driver<Stream<number>, void> = (
      sink: Stream<number>
    ) => {};

    const objectReadOnlyDriver: Driver<void, Stream<object>> = () => xs.of({});

    setup(app, {
      str: stringDriver,
      num: numberWriteOnlyDriver,
      obj: objectReadOnlyDriver,
    });
  });

  it('should type-check keyof sources and sinks, supporting interfaces', function() {
    interface Sources {
      str: Stream<string>;
      obj: Stream<object>;
    }

    interface Sinks {
      str: Stream<string>;
      num: Stream<number>;
    }

    function app(sources: Sources): Sinks {
      return {
        str: sources.str.take(1).startWith('a'), // good
        // str: sources.obj.mapTo('good'), // good
        // strTYPO: sources.str.take(1).startWith('a'), // bad
        // str: xs.of(123), // bad
        num: xs.of(100), // good
        // numTYPO: xs.of(100), // bad
        // num: xs.of('BAD TYPE'), // bad
      };
    }

    const stringDriver: Driver<Stream<string>, Stream<string>> = (
      sink: Stream<string>
    ) => xs.of('b');

    const numberWriteOnlyDriver: Driver<Stream<number>, void> = (
      sink: Stream<number>
    ) => {};

    const objectReadOnlyDriver: Driver<void, Stream<object>> = () => xs.of({});

    setup(app, {
      str: stringDriver,
      num: numberWriteOnlyDriver,
      obj: objectReadOnlyDriver,
    });
  });

  it('should type-check and allow more drivers than sinks', function() {
    type Sources = {
      str: Stream<string>;
      num: Stream<number>;
      obj: Stream<object>;
    };

    function app(sources: Sources) {
      return {};
    }

    function stringDriver(sink: Stream<string>) {
      return xs.of('b');
    }

    const numberDriver = (sink: Stream<number>) => xs.of(100);

    const objectReadOnlyDriver = () => xs.of({});

    setup(app, {
      str: stringDriver,
      num: numberDriver,
      obj: objectReadOnlyDriver,
    });
  });

  it('should return a run() which in turn returns a dispose()', function(done) {
    type TestSources = {
      other: Stream<number>;
    };

    function app(_sources: TestSources) {
      return {
        other: concat(
          _sources.other
            .take(6)
            .map(String)
            .startWith('a'),
          xs.never()
        ),
      };
    }

    function driver(sink: Stream<string>) {
      return sink.map(x => x.charCodeAt(0)).compose(delay(1));
    }

    const {sources, run} = setup(app, {other: driver});

    let dispose: any;
    sources.other.addListener({
      next: x => {
        assert.strictEqual(x, 97);
        dispose(); // will trigger this listener's complete
      },
      error: done,
      complete: done,
    });
    dispose = run();
  });

  it('should not work after has been disposed', function(done) {
    type MySources = {
      other: Stream<string>;
    };

    function app(_sources: MySources) {
      return {other: xs.periodic(100).map(i => i + 1)};
    }
    function driver(num$: Stream<number>): Stream<string> {
      return num$.map(num => 'x' + num);
    }

    const {sources, run} = setup(app, {
      other: driver,
    });

    let dispose: any;
    sources.other.addListener({
      next: x => {
        assert.notStrictEqual(x, 'x3');
        if (x === 'x2') {
          dispose(); // will trigger this listener's complete
        }
      },
      error: done,
      complete: done,
    });
    dispose = run();
  });
});
