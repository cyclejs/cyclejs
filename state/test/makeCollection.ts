import * as assert from 'assert';
import {
  of,
  fromArray,
  pipe,
  merge,
  subscribe,
  Operator,
} from '@cycle/callbags';
import { StateApi, makeCollection, pickMerge, withState } from '../src/index';
import { isolate } from '@cycle/utils';

function delay<T>(ms: number): Operator<T, T> {
  return source => (_, sink) => {
    source(0, (t, d) => {
      setTimeout(() => {
        sink(t, d);
      }, ms);
    });
  };
}

describe('makeCollection', () => {
  it('should return an isolatable List component', done => {
    type ItemState = {
      key: string;
      val: number | null;
    };
    const expected = [
      [{ key: 'a', val: 3 }],
      [
        { key: 'a', val: 3 },
        { key: 'b', val: null },
      ],
      [
        { key: 'a', val: 3 },
        { key: 'b', val: 10 },
      ],
      [
        { key: 'a', val: 3 },
        { key: 'b', val: 10 },
        { key: 'c', val: 27 },
      ],
      [
        { key: 'a', val: 3 },
        { key: 'b', val: 10 },
      ],
    ];

    function Child(_sources: { state: StateApi<ItemState> }) {
      const defaultReducer$ = of((prev: any) => {
        if (typeof prev.val === 'number') {
          return prev;
        } else {
          return { key: prev.key, val: 10 };
        }
      });

      const deleteReducer$ = pipe(
        of((prev: any) => {
          return prev.key === 'c' ? void 0 : prev;
        }),
        delay(50)
      );

      return {
        state: merge(defaultReducer$, deleteReducer$),
      };
    }

    const List = makeCollection<ItemState>({
      item: Child,
      itemKey: s => s.key,
      itemScope: key => key,
      collectSinks: {
        state: pickMerge('state'),
      },
    });

    type MainState = {
      list: Array<ItemState>;
    };

    function Main(sources: { state: StateApi<MainState> }) {
      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.deepStrictEqual(x.list, expected.shift());
          },
          e => done('should not error: ' + e)
        )
      );

      const child = isolate(List, 'list');
      const childSinks = child(sources);
      const childReducer$ = childSinks.state;

      const initReducer$ = of(() => {
        return { list: [{ key: 'a', val: 3 }] };
      });

      const addReducer$ = merge(
        pipe(
          of(function addB(prev: MainState): MainState {
            return { list: prev.list.concat({ key: 'b', val: null }) };
          }),
          delay(100)
        ),
        pipe(
          of(function addC(prev: MainState): MainState {
            return { list: prev.list.concat({ key: 'c', val: 27 }) };
          }),
          delay(200)
        )
      );

      const parentReducer$ = merge(initReducer$, addReducer$);
      const reducer$ = merge(parentReducer$, childReducer$);

      return {
        state: reducer$,
      };
    }

    const wrapped = withState()(Main);
    wrapped({});
    setTimeout(() => {
      assert.strictEqual(expected.length, 0);
      done();
    }, 300);
  });

  it('should work with a custom itemKey', done => {
    const expected = [
      [{ id: 'a', val: 3 }],
      [
        { id: 'a', val: 3 },
        { id: 'b', val: null },
      ],
      [
        { id: 'a', val: 3 },
        { id: 'b', val: 10 },
      ],
      [
        { id: 'a', val: 3 },
        { id: 'b', val: 10 },
        { id: 'c', val: 27 },
      ],
      [
        { id: 'a', val: 3 },
        { id: 'b', val: 10 },
      ],
    ];

    type ItemState = {
      id: string;
      val: number | undefined;
    };

    function Child(_sources: { state: StateApi<ItemState> }) {
      const defaultReducer$ = of((prev: ItemState) => {
        if (typeof prev.val === 'number') {
          return prev;
        } else {
          return { id: prev.id, val: 10 };
        }
      });

      const deleteReducer$ = pipe(
        of((prev: ItemState) => (prev.id === 'c' ? void 0 : prev)),
        delay(50)
      );

      return {
        state: merge(defaultReducer$, deleteReducer$),
      };
    }

    const List = makeCollection<ItemState>({
      item: Child,
      itemKey: s => s.id,
      collectSinks: {
        state: pickMerge('state'),
      },
    });

    function Main(sources: { state: StateApi<any> }) {
      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.deepStrictEqual(x.list, expected.shift());
          },
          e => done('should not complete: ' + e)
        )
      );

      const childSinks = isolate(List, 'list')(sources);
      const childReducer$ = childSinks.state;

      const initReducer$ = of(() => ({ list: [{ id: 'a', val: 3 }] }));

      const addReducer$ = merge(
        pipe(
          of(function addB(prev: any) {
            return { list: prev.list.concat({ id: 'b', val: null }) };
          }),
          delay(100)
        ),
        pipe(
          of(function addC(prev: any) {
            return { list: prev.list.concat({ id: 'c', val: 27 }) };
          }),
          delay(200)
        )
      );

      const parentReducer$ = merge(initReducer$, addReducer$);
      const reducer$ = merge(parentReducer$, childReducer$);

      return {
        state: reducer$,
      };
    }

    const wrapped = withState()(Main);
    wrapped({});
    setTimeout(() => {
      assert.strictEqual(expected.length, 0);
      done();
    }, 300);
  });

  it('should correctly accumulate over time even without itemKey', done => {
    const expected = [
      [{ val: 3 }],
      [{ val: 4 }],
      [{ val: 5 }],
      [{ val: 6 }],
      [{ val: 6 }, { val: null }],
      [{ val: 6 }, { val: 10 }],
      [{ val: 6 }, { val: 11 }],
      [{ val: 6 }, { val: 12 }],
      [{ val: 6 }, { val: 13 }],
    ];

    function Child(_sources: { state: StateApi<any> }) {
      const defaultReducer$ = of((prev: any) => {
        if (typeof prev.val === 'number') {
          return prev;
        } else {
          return { val: 10 };
        }
      });

      const incrementReducer$ = pipe(
        fromArray([
          (prev: any) => ({ val: prev.val + 1 }),
          (prev: any) => ({ val: prev.val + 1 }),
          (prev: any) => ({ val: prev.val + 1 }),
        ]),
        delay(50)
      );

      return {
        state: merge(defaultReducer$, incrementReducer$),
      };
    }

    const List = makeCollection({
      item: Child,
      collectSinks: {
        state: pickMerge('state'),
      },
    });

    function Main(sources: { state: StateApi<any> }) {
      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.deepStrictEqual(x.list, expected.shift());
          },
          e => done('should not complete: ' + e)
        )
      );

      const childSinks = isolate(List, 'list')(sources);
      const childReducer$ = childSinks.state;

      const initReducer$ = of(() => ({ list: [{ val: 3 }] }));

      const addReducer$ = pipe(
        of(function addSecond(prev: any) {
          return { list: prev.list.concat({ val: null }) };
        }),
        delay(100)
      );

      const parentReducer$ = merge(initReducer$, addReducer$);
      const reducer$ = merge(parentReducer$, childReducer$);

      return {
        state: reducer$,
      };
    }

    const wrapped = withState()(Main);
    wrapped({});
    setTimeout(() => {
      assert.strictEqual(expected.length, 0);
      done();
    }, 200);
  });

  it('should work with a singleton lens', done => {
    const expected = [
      { key: 'a', val: null },
      { key: 'a', val: 10 },
    ];

    function Child(_sources: { state: StateApi<any> }) {
      const defaultReducer$ = of((prev: any) => {
        if (typeof prev.val === 'number') {
          return prev;
        } else {
          return { key: prev.key, val: 10 };
        }
      });

      return {
        state: defaultReducer$,
      };
    }

    const Wrapper = makeCollection({
      item: Child,
      collectSinks: {
        state: pickMerge('state'),
      },
    });

    function Main(sources: { state: StateApi<any> }) {
      pipe(
        sources.state.stream,
        subscribe(
          x => {
            assert.deepStrictEqual(x.wrap, expected.shift());
          },
          e => done('should not terminate: ' + e)
        )
      );

      const wrapLens = {
        get: (x: any) => [x.wrap],
        set: (x: any, y: any) => ({ ...x, wrap: y[0] }),
      };

      const wrapperSinks = isolate(Wrapper, { state: wrapLens, '*': null })(
        sources
      );
      const wrapperReducer$ = wrapperSinks.state;

      const initReducer$ = of(() => ({ wrap: { key: 'a', val: null } }));

      const reducer$ = merge(initReducer$, wrapperReducer$);

      return {
        state: reducer$,
      };
    }

    const wrapped = withState()(Main);
    wrapped({});
    setTimeout(() => {
      assert.strictEqual(expected.length, 0);
      done();
    }, 60);
  });

  it('should error if passed an object and not an array', done => {
    function Child(_sources: { state: StateApi<any> }) {
      const defaultReducer$ = of((prev: any) => {
        if (typeof prev.val === 'number') {
          return prev;
        } else {
          return { key: prev.key, val: 10 };
        }
      });

      return {
        state: defaultReducer$,
      };
    }

    const Wrapper = makeCollection({
      item: Child,
      collectSinks: {
        state: pickMerge('state'),
      },
    });

    function Main(sources: { state: StateApi<any> }) {
      pipe(
        sources.state.stream,
        subscribe(
          x => assert.deepStrictEqual(x, { wrap: { key: 'a', val: null } }),
          e => done('should not terminate: ' + e)
        )
      );

      const wrapperSinks = isolate(Wrapper, 'wrap')(sources);
      const wrapperReducer$ = wrapperSinks.state;

      const initReducer$ = of(() => ({ wrap: { key: 'a', val: null } }));

      const reducer$ = merge(initReducer$, wrapperReducer$);

      return {
        state: reducer$,
      };
    }

    const errorHandler = (err: any) => {
      assert.strictEqual(
        err.message,
        'Expected a stream of arrays or undefined'
      );
      done();
    };

    const wrapped = withState('state')(Main, errorHandler);
    wrapped({});
  });

  it('should not throw if pickMerge() is called with name that item does not use', done => {
    function Child(_sources: { state: StateApi<any> }) {
      return {
        state: of(() => {}),
      };
    }

    const List = makeCollection<{ key: string }>({
      item: Child,
      itemKey: s => s.key,
      itemScope: key => key,
      collectSinks: {
        HTTP: pickMerge('HTTP'),
      },
    });

    function Main(sources: { state: StateApi<any> }) {
      const childSinks = isolate(List, 'list')(sources);
      assert.strictEqual(typeof childSinks.HTTP, 'function');

      const initReducer$ = of(() => ({ list: [{ key: 'a', val: 3 }] }));

      pipe(
        childSinks.HTTP,
        subscribe(() => assert.fail('should not deliver data'))
      );

      return {
        state: initReducer$,
      };
    }

    const wrapped = withState()(Main);
    wrapped({});

    setTimeout(done, 10);
  });
});
