// tslint:disable-next-line
import 'mocha';
import * as assert from 'assert';
import * as sinon from 'sinon';
import {setupReusable} from '../src/index';
import xs, {Stream} from 'xstream';

describe('setupReusable', function() {
  it('should be a function', function() {
    assert.strictEqual(typeof setupReusable, 'function');
  });

  it('should throw if argument is not object', function() {
    assert.throws(() => {
      (setupReusable as any)('not a function');
    }, /Argument given to setupReusable must be an object with driver/i);
  });

  it('should throw if argument is an empty object', function() {
    assert.throws(() => {
      (setupReusable as any)({});
    }, /Argument given to setupReusable must be an object with at least one/i);
  });

  it('should return engine with sources and run', function() {
    function app(ext: any): any {
      return {
        other: ext.other.take(1).startWith('a'),
      };
    }
    function driver() {
      return xs.of('b');
    }
    const {sources, run} = setupReusable({other: driver});
    assert.strictEqual(typeof sources, 'object');
    assert.notStrictEqual(typeof sources.other, 'undefined');
    assert.notStrictEqual(sources.other, null);
    assert.strictEqual(typeof sources.other.addListener, 'function');
    assert.strictEqual(typeof run, 'function');
  });

  it('should return an engine, which we can run and dispose', function() {
    const sandbox = sinon.createSandbox();
    const spy = sandbox.spy();

    type NiceSources = {
      other: Stream<string>;
    };
    type NiceSinks = {
      other: Stream<string>;
    };

    function app(sources: NiceSources): NiceSinks {
      return {
        other: sources.other.take(1).startWith('a'),
      };
    }

    function driver(sink: Stream<string>) {
      return xs.of('b').debug(spy);
    }

    const engine = setupReusable({other: driver});
    const sinks = app(engine.sources);
    const dispose = engine.run(sinks);
    assert.strictEqual(typeof dispose, 'function');
    sinon.assert.calledOnce(spy);
    dispose();
  });

  it('should allow reusing drivers for many apps', function(done) {
    const sandbox = sinon.createSandbox();
    const spy1 = sandbox.spy();
    const spy2 = sandbox.spy();

    type NiceSources = {
      other: Stream<string>;
    };
    type NiceSinks = {
      other: Stream<string>;
    };

    function app1(sources: NiceSources): NiceSinks {
      return {
        other: sources.other.mapTo('a').debug(spy1),
      };
    }

    function app2(sources: NiceSources): NiceSinks {
      return {
        other: sources.other.mapTo('x').debug(spy2),
      };
    }

    let sinkCompleted = 0;
    function driver(sink: Stream<string>) {
      sink.addListener({
        complete: () => {
          sinkCompleted++;
          done(
            new Error('complete should not be called before engine is before')
          );
        },
      });
      return xs.of('b');
    }

    const engine = setupReusable({other: driver});

    const dispose1 = engine.run(app1(engine.sources));
    sinon.assert.calledOnce(spy1);
    sinon.assert.calledWithExactly(spy1, 'a');
    sandbox.restore();
    dispose1();

    const dispose2 = engine.run(app2(engine.sources));
    sinon.assert.calledOnce(spy2);
    sinon.assert.calledWithExactly(spy2, 'x');
    dispose2();
    assert.strictEqual(sinkCompleted, 0);
    done();
  });

  it('should allow disposing the engine, stopping reusability', function(done) {
    const sandbox = sinon.createSandbox();
    const spy = sandbox.spy();

    type NiceSources = {
      other: Stream<string>;
    };
    type NiceSinks = {
      other: Stream<string>;
    };

    function app(sources: NiceSources): NiceSinks {
      return {
        other: sources.other.mapTo('a').debug(spy),
      };
    }

    let sinkCompleted = 0;
    function driver(sink: Stream<string>) {
      sink.addListener({
        complete: () => {
          sinkCompleted++;
        },
      });
      return xs.of('b');
    }

    const engine = setupReusable({other: driver});

    engine.run(app(engine.sources));
    sinon.assert.calledOnce(spy);
    sinon.assert.calledWithExactly(spy, 'a');
    sandbox.restore();
    engine.dispose();
    assert.strictEqual(sinkCompleted, 1);
    done();
  });

  it('should report errors from main() in the console', function(done) {
    const sandbox = sinon.createSandbox();
    sandbox.stub(console, 'error');

    function main(sources: any): any {
      return {
        other: sources.other
          .take(1)
          .startWith('a')
          .map(() => {
            throw new Error('malfunction');
          }),
      };
    }
    function driver(sink: Stream<any>) {
      sink.addListener({
        next: () => {},
        error: (err: any) => {},
      });
      return xs.of('b');
    }

    let caught = false;
    const engine = setupReusable({other: driver});
    try {
      const sinks = main(engine.sources);
      engine.run(sinks);
    } catch (e) {
      caught = true;
    }
    setTimeout(() => {
      sinon.assert.calledOnce(console.error as any);
      sinon.assert.calledWithExactly(
        console.error as any,
        sinon.match((err: any) => err.message === 'malfunction')
      );

      // Should be false because the error was already reported in the console.
      // Otherwise we would have double reporting of the error.
      assert.strictEqual(caught, false);

      sandbox.restore();
      done();
    }, 80);
  });
});
