import * as assert from 'assert';
import { isolate } from '@cycle/utils';
import { run } from '@cycle/run';
import {
  never,
  pipe,
  subscribe,
  of,
  fromArray,
  merge,
  throwError,
  Producer,
} from '@cycle/callbags';
import { withState, StateApi, Reducer, Lens } from '../src/index';

describe('withState', () => {
  it('returns a wrapped main function', () => {
    function main() {
      return { state: never() };
    }

    const wrapped = withState()(main);
    assert.strictEqual(typeof wrapped, 'function');
  });

  it('inner function receives StateApi under sources.state', () => {
    let called = false;
    function main(sources: { state: StateApi<any> }) {
      assert.strictEqual(!!sources.state, true);
      assert.strictEqual(typeof sources.state, 'object');
      assert.strictEqual(typeof sources.state.stream, 'function');
      assert.strictEqual(typeof sources.state.isolateSource, 'function');
      assert.strictEqual(typeof sources.state.isolateSink, 'function');
      called = true;
      return { state: never() };
    }

    const wrapped = withState()(main);
    wrapped({});
    assert.strictEqual(called, true);
  });

  it('inner function receives StateApi under sources.whatever', () => {
    let called = false;
    function main(sources: { whatever: StateApi<any> }) {
      assert.strictEqual(!!sources.whatever, true);
      assert.strictEqual(typeof sources.whatever, 'object');
      assert.strictEqual(typeof sources.whatever.stream, 'function');
      assert.strictEqual(typeof sources.whatever.isolateSource, 'function');
      assert.strictEqual(typeof sources.whatever.isolateSink, 'function');
      called = true;
      return { whatever: never() };
    }

    const wrapped = withState('whatever')(main);
    wrapped({});
    assert.strictEqual(called, true);
  });

  it('inner function takes StateApi, sends reducers to sink', done => {
    type State = { foo: string };

    const expected = ['bar'];
    function main(sources: { state: StateApi<State> }) {
      assert(sources.state);
      assert(sources.state.stream);
      pipe(
        sources.state.stream,
        subscribe(x => {
          assert.strictEqual(x.foo, expected.shift());
        })
      );

      return {
        state: of((_prevState: State) => ({ foo: 'bar' })),
      };
    }

    const wrapped = withState()(main);
    wrapped({});
    setImmediate(() => {
      assert.strictEqual(expected.length, 0);
      done();
    });
  });

  it('StateApi.stream never emits if no sink reducer was emitted', done => {
    function main(sources: { state: StateApi<any> }) {
      assert(sources.state);
      assert(sources.state.stream);
      pipe(
        sources.state.stream,
        subscribe(
          () => done('should not deliver data'),
          e => done('should not error: ' + e)
        )
      );

      return {
        state: never(),
      };
    }

    const wrapped = withState()(main);
    wrapped({});
    setImmediate(done);
  });

  it('should compile with type annotations', () => {
    interface State {
      foo: string;
    }

    interface Parent {
      bar: number;
      child: { foo: number };
    }

    interface Sources {
      state: StateApi<State>;
    }
    interface Sinks {
      state?: Producer<Reducer<State>>;
    }

    interface ParentSources {
      state: StateApi<Parent>;
    }
    interface ParentSinks {
      state?: Producer<Reducer<Parent>>;
    }

    function Child(sources: Sources): Sinks {
      return {
        state: of<Reducer<State>>(() => ({ foo: 'Hello' })),
      };
    }

    function Parent(sources: ParentSources): ParentSinks {
      const childSinks = isolate(Child, { state: 'child' })(sources);
      return {
        state: childSinks.state as Producer<Reducer<Parent>>,
      };
    }
  });

  it('reducers receive previous state', done => {
    const expected = [7, 10, 15, 25];
    function main(sources: { state: StateApi<any> }) {
      assert(sources.state);
      assert(sources.state.stream);

      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.strictEqual(x.count, expected.shift());
          },
          e => done('should not error: ' + e)
        )
      );

      const reducer$ = fromArray([
        () => ({ count: 7 }),
        (prevState: any) => ({ count: prevState.count + 3 }),
        (prevState: any) => ({ count: prevState.count + 5 }),
        (prevState: any) => ({ count: prevState.count + 10 }),
      ]);

      return {
        state: reducer$,
      };
    }

    const wrapped = withState()(main);
    wrapped({});
    setImmediate(() => {
      assert.strictEqual(expected.length, 0);
      done();
    });
  });

  it('top level default reducer sees undefined prev state', done => {
    type State = { foo: string };
    let calledSource = false;
    let calledSink = false;
    function main(sources: { state: StateApi<State> }) {
      assert(sources.state);
      assert(sources.state.stream);

      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.strictEqual(x.foo, 'bar');
            calledSource = true;
          },
          e => done('should not error: ' + e)
        )
      );

      return {
        state: of((prevState?: State) => {
          assert.strictEqual(typeof prevState, 'undefined');
          calledSink = true;
          if (typeof prevState === 'undefined') {
            return { foo: 'bar' };
          } else {
            return prevState;
          }
        }),
      };
    }

    const wrapped = withState()(main);
    wrapped({});
    setImmediate(() => {
      assert.strictEqual(calledSource, true);
      assert.strictEqual(calledSink, true);
      done();
    });
  });

  it('child component default reducer can get state from parent', done => {
    let calledSource = false;
    let expected = [7];

    function child(sources: { state: StateApi<any> }) {
      assert(sources.state);
      assert(sources.state.stream);

      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.strictEqual(x.count, expected.shift());
            calledSource = true;
          },
          e => done('should not error: ' + e)
        )
      );

      const reducer$ = of((prevState: any) => {
        if (typeof prevState === 'undefined') {
          return { count: 0 };
        } else {
          return prevState;
        }
      });
      return {
        state: reducer$,
      };
    }

    function main(sources: { state: StateApi<any> }) {
      const childSinks = isolate(child, 'child')(sources);
      const childReducer$ = childSinks.state;

      const parentReducer$ = of(() => ({ child: { count: 7 } }));
      const reducer$ = merge(parentReducer$, childReducer$);

      return {
        state: reducer$ as any,
      };
    }

    const wrapped = withState()(main);
    wrapped({});
    setImmediate(() => {
      assert.strictEqual(calledSource, true);
      assert.strictEqual(expected.length, 0);
      done();
    });
  });

  it('child component default reducer can set default state', done => {
    let calledSource = false;
    function child(sources: { state: StateApi<any> }) {
      assert(sources.state);
      assert(sources.state.stream);
      const expected = [0];

      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.strictEqual(x.count, expected.shift());
            calledSource = true;
          },
          e => done('should not error: ' + e)
        )
      );
      const reducer$ = of((prevState: any) => {
        if (typeof prevState === 'undefined') {
          return { count: 0 };
        } else {
          return prevState;
        }
      });
      return {
        state: reducer$,
      };
    }

    function main(sources: { state: StateApi<any> }) {
      const childSinks = isolate(child, 'child')(sources);
      const childReducer$ = childSinks.state;

      const parentReducer$ = of(() => ({}));
      const reducer$ = merge(parentReducer$, childReducer$);

      return {
        state: reducer$,
      };
    }

    const wrapped = withState()(main);
    wrapped({});
    setImmediate(() => {
      assert.strictEqual(calledSource, true);
      done();
    });
  });

  it('child component can be isolated with a lens object as scope', done => {
    let calledChild = 0;
    let calledMain = 0;
    type ChildState = {
      celsius: number;
    };
    function child(sources: { state: StateApi<ChildState> }) {
      assert(sources.state);
      assert(sources.state.stream);
      const expected = [27, 37];

      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.strictEqual(x.celsius, expected.shift());
            calledChild += 1;
          },
          e => done('should not error: ' + e)
        )
      );

      const reducer$ = of((prevState: ChildState) => ({
        celsius: prevState.celsius + 10,
      }));

      return {
        state: reducer$,
      };
    }

    type MainState = {
      deeply: {
        nested: {
          prop: {
            kelvin: number;
          };
        };
      };
    };

    function main(sources: { state: StateApi<MainState> }) {
      const celsiusLens: Lens<MainState, ChildState> = {
        get: state => ({
          celsius: state ? state.deeply.nested.prop.kelvin - 273 : 0,
        }),
        set: (_state, childState) => ({
          deeply: {
            nested: {
              prop: { kelvin: childState ? childState.celsius + 273 : 0 },
            },
          },
        }),
      };

      const childSinks = isolate(child, { state: celsiusLens })(sources);
      const childReducer$ = childSinks.state;

      const expected = [300, 310];
      pipe(
        sources.state.stream,
        subscribe(
          s => {
            assert.strictEqual(s.deeply.nested.prop.kelvin, expected.shift());
            calledMain += 1;
          },
          e => done('should not error: ' + e)
        )
      );

      const parentReducer$ = of(() => ({
        deeply: {
          nested: {
            prop: {
              kelvin: 300,
            },
          },
        },
      }));

      return {
        state: merge(parentReducer$, childReducer$),
      };
    }

    const wrapped = withState()(main);
    wrapped({});
    setImmediate(() => {
      assert.strictEqual(calledChild, 2);
      assert.strictEqual(calledMain, 2);
      done();
    });
  });

  it('child component also gets undefined if parent has not initialized state', done => {
    let called = false;
    function child(sources: { state: StateApi<any> }) {
      const expected = [0];

      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.strictEqual(x.count, expected.shift());
            called = true;
          },
          e => done('should not error: ' + e)
        )
      );

      const reducer$ = of((prevState: any) => {
        if (typeof prevState === 'undefined') {
          return { count: 0 };
        } else {
          return prevState;
        }
      });

      return {
        state: reducer$,
      };
    }

    function main(sources: { state: StateApi<any> }) {
      const childSinks = isolate(child, 'child')(sources);

      return {
        state: childSinks.state,
      };
    }

    const wrapped = withState()(main);
    wrapped({});
    setImmediate(() => {
      assert.strictEqual(called, true);
      done();
    });
  });

  it('should work with a manually isolated child component', done => {
    let calledChild = 0;
    let calledMain = 0;

    function child(sources: { state: StateApi<any> }) {
      assert(sources.state);
      assert(sources.state.stream);
      const expected = [7, 9];

      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.strictEqual(x.count, expected.shift());
            calledChild += 1;
          },
          e => done('should not error: ' + e)
        )
      );

      const reducer$ = of((prevState: any) => ({ count: prevState.count + 2 }));
      return {
        state: reducer$,
      };
    }

    function main(sources: { state: StateApi<any> }) {
      const expected = [7, 9];

      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.strictEqual(x.child.count, expected.shift());
            calledMain += 1;
          },
          e => done('should not error: ' + e)
        )
      );

      const childSinks = child({
        state: sources.state.isolateSource('child'),
      });
      assert(childSinks.state);
      const childReducer$ = sources.state.isolateSink(
        childSinks.state,
        'child'
      );

      const parentReducer$ = of(() => ({ child: { count: 7 } }));

      return {
        state: merge(parentReducer$, childReducer$),
      };
    }

    const wrapped = withState()(main);
    wrapped({});
    setImmediate(() => {
      assert.strictEqual(calledChild, 2);
      assert.strictEqual(calledMain, 2);
      done();
    });
  });

  it('should work with an isolated child component', done => {
    let calledChild = 0;
    let calledMain = 0;

    function child(sources: { state: StateApi<any> }) {
      assert(sources.state);
      assert(sources.state.stream);
      const expected = [7, 9];

      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.strictEqual(x.count, expected.shift());
            calledChild += 1;
          },
          e => done('should not error: ' + e)
        )
      );

      const reducer$ = of((prevState: any) => ({ count: prevState.count + 2 }));

      return {
        state: reducer$,
      };
    }

    function main(sources: { state: StateApi<any> }) {
      assert(sources.state);
      assert(sources.state.stream);
      const expected = [7, 9];

      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.strictEqual(x.child.count, expected.shift());
            calledMain += 1;
          },
          e => done('should not error: ' + e)
        )
      );

      const childSinks = isolate(child, 'child')(sources);
      assert(childSinks.state);
      const childReducer$ = childSinks.state;

      const parentReducer$ = of(() => ({ child: { count: 7 } }));

      return {
        state: merge(parentReducer$, childReducer$),
      };
    }

    const wrapped = withState()(main);
    wrapped({});
    setImmediate(() => {
      assert.strictEqual(calledChild, 2);
      assert.strictEqual(calledMain, 2);
      done();
    });
  });

  it('should work with an isolated child component and falsy values', done => {
    let calledChild = 0;
    let calledMain = 0;

    function child(sources: { state: StateApi<any> }) {
      assert(sources.state);
      assert(sources.state.stream);
      const expected = [1, 0, -1];

      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.strictEqual(x, expected.shift());
            calledChild += 1;
          },
          e => done('should not error: ' + e)
        )
      );
      const reducer$ = fromArray([
        (prevCount: any) => prevCount - 1,
        (prevCount: any) => prevCount - 1,
      ]);

      return {
        state: reducer$,
      };
    }

    function main(sources: { state: StateApi<any> }) {
      assert(sources.state);
      assert(sources.state.stream);
      const expected = [1, 0, -1];

      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.strictEqual(x.count, expected.shift());
            calledMain += 1;
          },
          e => done('should not error: ' + e)
        )
      );

      const childSinks = isolate(child, 'count')(sources);
      assert(childSinks.state);
      const childReducer$ = childSinks.state;

      const parentReducer$ = of(() => ({ count: 1 }));

      return {
        state: merge(parentReducer$, childReducer$),
      };
    }

    const wrapped = withState()(main);
    wrapped({});
    setImmediate(() => {
      assert.strictEqual(calledChild, 3);
      assert.strictEqual(calledMain, 3);
      done();
    });
  });

  it('should work with an isolated child component on an array subtree', done => {
    let calledChild = 0;
    let calledMain = 0;

    function child(sources: { state: StateApi<any> }) {
      assert(sources.state);
      assert(sources.state.stream);
      const expected = [[3], [3, 5]];

      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.deepStrictEqual(x, expected.shift());
            calledChild += 1;
          },
          e => done('should not error: ' + e)
        )
      );
      const reducer$ = of((prevArr: Array<any>) => prevArr.concat(5));
      return {
        state: reducer$,
      };
    }

    function main(sources: { state: StateApi<any> }) {
      assert(sources.state);
      assert(sources.state.stream);
      const expected = [[3], [3, 5]];

      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.deepStrictEqual(x.list, expected.shift());
            calledMain += 1;
          },
          e => done('should not error: ' + e)
        )
      );

      const childSinks = isolate(child, 'list')(sources);
      assert(childSinks.state);
      const childReducer$ = childSinks.state;

      const parentReducer$ = of(() => ({ list: [3] }));

      return {
        state: merge(parentReducer$, childReducer$),
      };
    }

    const wrapped = withState()(main);
    wrapped({});
    setImmediate(() => {
      assert.strictEqual(calledChild, 2);
      assert.strictEqual(calledMain, 2);
      done();
    });
  });

  it('should work with an isolated child component on an array entry', done => {
    let calledSecond = 0;
    let calledMain = 0;

    function secondEntry(sources: { state: StateApi<any> }) {
      assert(sources.state);
      assert(sources.state.stream);
      const expected = [5, 15, 6];

      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.deepStrictEqual(x, expected.shift());
            calledSecond += 1;
          },
          e => done('should not error: ' + e)
        )
      );
      const reducer$ = fromArray([
        (prevNum: number): number | undefined => prevNum + 10,
        (): number | undefined => void 0,
      ]);
      return {
        state: reducer$,
      };
    }

    function main(sources: { state: StateApi<any> }) {
      assert(sources.state);
      assert(sources.state.stream);
      const expected = [
        [3, 5, 6],
        [3, 15, 6],
        [3, 6],
      ];

      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.deepStrictEqual(x, expected.shift());
            calledMain += 1;
          },
          e => done('should not error: ' + e)
        )
      );

      const childSinks = isolate(secondEntry, 1)(sources);
      assert(childSinks.state);
      const childReducer$ = childSinks.state;

      const parentReducer$ = of(() => [3, 5, 6]);

      return {
        state: merge(parentReducer$, childReducer$),
      };
    }

    const wrapped = withState()(main);
    wrapped({});
    setImmediate(() => {
      assert.strictEqual(calledSecond, 3);
      assert.strictEqual(calledMain, 3);
      done();
    });
  });

  it('should not complete reducer stream neither source state$', done => {
    let called = false;

    function main(sources: { state: StateApi<any> }) {
      assert(sources.state);
      assert(sources.state.stream);
      const expected = [[3, 5, 6]];

      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.deepStrictEqual(x, expected.shift());
            called = true;
          },
          e => done('should not error or complete: ' + e)
        )
      );

      const reducer$ = of(() => [3, 5, 6]);

      return {
        state: reducer$,
      };
    }

    const wrapped = withState()(main);
    wrapped({});
    setImmediate(() => {
      assert.strictEqual(called, true);
      done();
    });
  });

  it('should pass errors back via stateApi.stream', done => {
    function main(sources: { state: StateApi<any> }) {
      assert(sources.state);
      assert(sources.state.stream);
      pipe(
        sources.state.stream,
        subscribe(
          () => done('should not deliver data'),
          e => {
            if (e.message === 'This is an expected error') {
              done();
            } else done('received the wrong error');
          }
        )
      );

      return {
        state: throwError(new Error('This is an expected error')),
      };
    }

    const wrapped = withState()(main);
    wrapped({});
  });

  it('should work if the application does not return a reducer stream', () => {
    function main(sources: { state: StateApi<any> }) {
      assert(sources.state);
      assert(sources.state.stream);

      return {};
    }

    const wrapped = withState()(main);
    wrapped({});
  });

  it('should work if withState is applied by @cycle/run', done => {
    let called = false;

    function main(sources: { state: StateApi<any> }) {
      assert(sources.state);
      assert(sources.state.stream);
      const expected = [[3, 5, 6]];

      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.deepStrictEqual(x, expected.shift());
            called = true;
          },
          e => done('should not error or complete: ' + e)
        )
      );

      const reducer$ = of(() => [3, 5, 6]);

      return {
        state: reducer$,
      };
    }

    run(main, { DOM: {} as any }, [withState()]);

    setImmediate(() => {
      assert.strictEqual(called, true);
      done();
    });
  });
});
