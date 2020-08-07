import * as assert from 'assert';
import { setupReusable, Driver, ReadonlyDriver } from '../src/index';
import {
  Producer,
  of,
  pipe,
  take,
  startWith,
  map,
  subscribe,
  combine,
  throwError,
  flatten,
} from '@cycle/callbags';

describe('setupReusable', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof setupReusable, 'function');
  });

  it('should throw if argument is not object', () => {
    assert.throws(() => {
      (setupReusable as any)('not a function');
    }, /Second argument given to Cycle must be an object with plugins/i);
  });

  it('should throw if argument is an empty object', () => {
    assert.throws(() => {
      (setupReusable as any)({});
    }, /Second argument given to Cycle must be an object with at least one plugin/i);
  });

  it('should return engine with connect and dispose', () => {
    class TestDriver implements ReadonlyDriver<string> {
      public provideSource() {
        return of('b');
      }
    }
    const { connect, dispose } = setupReusable({
      other: [new TestDriver(), null],
    });
    assert.strictEqual(typeof connect, 'function');
    assert.strictEqual(typeof dispose, 'function');
  });

  it('should return an engine, which we can run and dispose', () => {
    let numCalled = 0;

    type NiceSources = {
      other: Producer<string>;
    };
    type NiceSinks = {
      other: Producer<string>;
    };

    function app(sources: NiceSources): NiceSinks {
      return {
        other: pipe(sources.other, take(1), startWith('a')),
      };
    }

    class TestDriver implements Driver<string, void> {
      public provideSource() {
        return pipe(
          of('b'),
          map(x => {
            numCalled++;
            return x;
          })
        );
      }
    }

    const engine = setupReusable({ other: [new TestDriver(), null] });
    const dispose = engine.connect(app);
    assert.strictEqual(typeof engine.dispose, 'function');
    assert.strictEqual(typeof dispose, 'function');
    assert.strictEqual(numCalled, 1);
    engine.dispose();
  });

  it('should allow reusing drivers for many apps', done => {
    let called1: string[] = [];
    let called2: string[] = [];

    type NiceSources = {
      other: Producer<string>;
    };
    type NiceSinks = {
      other: Producer<string>;
    };

    function app1(sources: NiceSources): NiceSinks {
      return {
        other: pipe(
          sources.other,
          map(() => {
            called1.push('a');
            return 'a';
          })
        ),
      };
    }

    function app2(sources: NiceSources): NiceSinks {
      return {
        other: pipe(
          sources.other,
          map(() => {
            called2.push('x');
            return 'x';
          })
        ),
      };
    }

    let sinkCompleted = 0;
    class TestDriver implements Driver<string, string> {
      public provideSource() {
        return of('b');
      }

      public consumeSink(sink: Producer<string>) {
        return pipe(
          sink,
          subscribe(
            () => {},
            () => {
              sinkCompleted++;
              done(
                new Error(
                  'complete should not be called before engine is before'
                )
              );
            }
          )
        );
      }
    }

    const engine = setupReusable({ other: [new TestDriver(), null] });

    const dispose1 = engine.connect(app1);
    assert.deepStrictEqual(called1, ['a']);
    dispose1();

    const dispose2 = engine.connect(app2);
    assert.deepStrictEqual(called2, ['x']);
    dispose2();
    assert.strictEqual(sinkCompleted, 0);
    done();
  });

  it('should allow disposing the engine, stopping reusability', done => {
    let called: string[] = [];

    type NiceSources = {
      other: Producer<string>;
    };
    type NiceSinks = {
      other: Producer<string>;
    };

    function app(sources: NiceSources): NiceSinks {
      return {
        other: pipe(
          sources.other,
          map(() => {
            called.push('a');
            return 'a';
          })
        ),
      };
    }

    let sinkCompleted = 0;
    class TestDriver implements Driver<string, string> {
      provideSource() {
        return of('b');
      }

      consumeSink(sink: Producer<string>) {
        return pipe(
          sink,
          subscribe(() => {})
        );
      }

      cleanup() {
        sinkCompleted++;
      }
    }

    const engine = setupReusable({ other: [new TestDriver(), null] });

    engine.connect(app);

    assert.deepStrictEqual(called, ['a']);
    engine.dispose();
    assert.strictEqual(sinkCompleted, 1);
    done();
  });

  it('should unsubscribe masterSinks on disconnect', done => {
    let called: string[] = [];

    type NiceSources = {
      other: Producer<string>;
    };
    type NiceSinks = {
      other: Producer<string>;
    };

    let ended = false;

    const testFromArray = (arr: any[]) => {
      return (_: number, sink: any) => {
        const id = setInterval(() => {
          if (ended) clearInterval(id);
          else sink(1, arr.unshift());
          if (arr.length === 0) {
            clearInterval(id);
          }
        }, 20);

        sink(0, () => {
          ended = true;
          clearInterval(id);
        });
      };
    };

    function app(sources: NiceSources): NiceSinks {
      return {
        other: pipe(
          combine(sources.other, testFromArray([1, 2, 3, 4, 5])),
          map(() => {
            called.push('a');
            return 'a';
          })
        ),
      };
    }

    let sinkCompleted = 0;
    class TestDriver implements Driver<string, string> {
      provideSource() {
        return of('b');
      }

      consumeSink(sink: Producer<string>) {
        return pipe(
          sink,
          subscribe(() => {
            if (called.length <= 1) {
              assert.strictEqual(ended, false);
            } else if (called.length > 1) {
              done(new Error('should not deliver data after disposal'));
            }
          })
        );
      }

      cleanup() {
        sinkCompleted++;
      }
    }

    const engine = setupReusable({ other: [new TestDriver(), null] });

    const disconnect = engine.connect(app);
    setTimeout(() => {
      disconnect();
      assert.strictEqual(ended, true);
      assert.deepStrictEqual(called, ['a']);
      assert.strictEqual(sinkCompleted, 0);
      engine.dispose();
      assert.strictEqual(sinkCompleted, 1);
      done();
    }, 30);
  });

  it('should report errors from main() to a custom error handler', function (done) {
    function main(sources: any): any {
      return {
        other: pipe(
          sources.other,
          take(1),
          map(() => throwError(new Error('malfunction'))),
          flatten
        ),
      };
    }
    class TestDriver implements Driver<string, any> {
      provideSource() {
        return of('b');
      }

      consumeSink(sink: Producer<any>) {
        return pipe(
          sink,
          subscribe(() => {})
        );
      }
    }

    let numCalled = 0;
    function errorHandler(err: any) {
      numCalled++;
      assert.strictEqual(err.message, 'malfunction');
    }

    let caught = false;
    const engine = setupReusable(
      { other: [new TestDriver(), null] },
      errorHandler
    );
    try {
      engine.connect(main);
    } catch (e) {
      caught = true;
    }
    setTimeout(() => {
      assert.strictEqual(numCalled, 1);

      // Should be false because the error was already reported in the console.
      // Otherwise we would have double reporting of the error.
      assert.strictEqual(caught, false);

      done();
    }, 80);
  });
});
