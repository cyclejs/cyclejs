/*

// tslint:disable-next-line
import 'mocha';
import * as assert from 'assert';
import xs, {Stream} from 'xstream';
import delay from 'xstream/extra/delay';
import isolate from '@cycle/isolate';
import {withState, StateSource, Reducer, makeCollection} from '../src/index';

describe('makeCollection', function() {
  it('should return an isolatable List component', done => {
    type ItemState = {
      key: string;
      val: number | null;
    };
    const expected = [
      [{key: 'a', val: 3}],
      [{key: 'a', val: 3}, {key: 'b', val: null}],
      [{key: 'a', val: 3}, {key: 'b', val: 10}],
      [{key: 'a', val: 3}, {key: 'b', val: 10}, {key: 'c', val: 27}],
      [{key: 'a', val: 3}, {key: 'b', val: 10}],
    ];

    function Child(sources: {state: StateSource<ItemState>}) {
      const defaultReducer$ = xs.of((prev: any) => {
        if (typeof prev.val === 'number') {
          return prev;
        } else {
          return {key: prev.key, val: 10};
        }
      });

      const deleteReducer$ = xs
        .of((prev: any) => (prev.key === 'c' ? void 0 : prev))
        .compose(delay(50));

      return {
        state: xs.merge(defaultReducer$, deleteReducer$) as Stream<
          Reducer<any>
        >,
      };
    }

    const List = makeCollection<ItemState>({
      item: Child,
      itemKey: s => s.key,
      itemScope: key => key,
      collectSinks: instances => ({
        state: instances.pickMerge('state'),
      }),
    });

    type MainState = {
      list: Array<ItemState>;
    };

    function Main(sources: {state: StateSource<MainState>}) {
      sources.state.stream.addListener({
        next(x) {
          assert.deepEqual(x.list, expected.shift());
        },
        error(e) {
          done(e.message);
        },
        complete() {
          done('complete should not be called');
        },
      });

      const childSinks = isolate(List, 'list')(sources);
      const childReducer$ = childSinks.state;

      const initReducer$ = xs.of(function initReducer(prevState: any): any {
        return {list: [{key: 'a', val: 3}]};
      });

      const addReducer$ = xs.merge(
        xs
          .of(function addB(prev: MainState): MainState {
            return {list: prev.list.concat({key: 'b', val: null})};
          })
          .compose(delay(100)),
        xs
          .of(function addC(prev: MainState): MainState {
            return {list: prev.list.concat({key: 'c', val: 27})};
          })
          .compose(delay(200))
      );

      const parentReducer$ = xs.merge(initReducer$, addReducer$);
      const reducer$ = xs.merge(parentReducer$, childReducer$);

      return {
        state: reducer$ as Stream<Reducer<any>>,
      };
    }

    const wrapped = withState(Main);
    wrapped({});
    setTimeout(() => {
      assert.strictEqual(expected.length, 0);
      done();
    }, 300);
  });

  it('should work with a custom itemKey', done => {
    const expected = [
      [{id: 'a', val: 3}],
      [{id: 'a', val: 3}, {id: 'b', val: null}],
      [{id: 'a', val: 3}, {id: 'b', val: 10}],
      [{id: 'a', val: 3}, {id: 'b', val: 10}, {id: 'c', val: 27}],
      [{id: 'a', val: 3}, {id: 'b', val: 10}],
    ];

    type ItemState = {
      id: string;
      val: number | undefined;
    };

    function Child(sources: {state: StateSource<ItemState>}) {
      const defaultReducer$ = xs.of((prev: ItemState) => {
        if (typeof prev.val === 'number') {
          return prev;
        } else {
          return {id: prev.id, val: 10};
        }
      });

      const deleteReducer$ = xs
        .of((prev: ItemState) => (prev.id === 'c' ? void 0 : prev))
        .compose(delay(50));

      return {
        state: xs.merge(defaultReducer$, deleteReducer$),
      };
    }

    const List = makeCollection<ItemState>({
      item: Child,
      itemKey: s => s.id,
      collectSinks: instances => ({
        state: instances.pickMerge('state'),
      }),
    });

    function Main(sources: {state: StateSource<any>}) {
      sources.state.stream.addListener({
        next(x) {
          assert.deepEqual(x.list, expected.shift());
        },
        error(e) {
          done(e.message);
        },
        complete() {
          done('complete should not be called');
        },
      });

      const childSinks = isolate(List, 'list')(sources);
      const childReducer$ = childSinks.state;

      const initReducer$ = xs.of(function initReducer(prevState: any): any {
        return {list: [{id: 'a', val: 3}]};
      });

      const addReducer$ = xs.merge(
        xs
          .of(function addB(prev: any) {
            return {list: prev.list.concat({id: 'b', val: null})};
          })
          .compose(delay(100)),
        xs
          .of(function addC(prev: any) {
            return {list: prev.list.concat({id: 'c', val: 27})};
          })
          .compose(delay(200))
      );

      const parentReducer$ = xs.merge(initReducer$, addReducer$);
      const reducer$ = xs.merge(parentReducer$, childReducer$) as Stream<
        Reducer<any>
      >;

      return {
        state: reducer$,
      };
    }

    const wrapped = withState(Main);
    wrapped({});
    setTimeout(() => {
      assert.strictEqual(expected.length, 0);
      done();
    }, 300);
  });

  it('should correctly accumulate over time even without itemKey', done => {
    const expected = [
      [{val: 3}],
      [{val: 4}],
      [{val: 5}],
      [{val: 6}],
      [{val: 6}, {val: null}],
      [{val: 6}, {val: 10}],
      [{val: 6}, {val: 11}],
      [{val: 6}, {val: 12}],
      [{val: 6}, {val: 13}],
    ];

    function Child(sources: {state: StateSource<any>}) {
      const defaultReducer$ = xs.of((prev: any) => {
        if (typeof prev.val === 'number') {
          return prev;
        } else {
          return {val: 10};
        }
      });

      const incrementReducer$ = xs
        .of(
          (prev: any) => ({val: prev.val + 1}),
          (prev: any) => ({val: prev.val + 1}),
          (prev: any) => ({val: prev.val + 1})
        )
        .compose(delay(50));

      return {
        state: xs.merge(defaultReducer$, incrementReducer$),
      };
    }

    const List = makeCollection({
      item: Child,
      collectSinks: instances => ({
        state: instances.pickMerge('state'),
      }),
    });

    function Main(sources: {state: StateSource<any>}) {
      sources.state.stream.addListener({
        next(x) {
          assert.deepEqual(x.list, expected.shift());
        },
        error(e) {
          done(e.message);
        },
        complete() {
          done('complete should not be called');
        },
      });

      const childSinks = isolate(List, 'list')(sources);
      const childReducer$ = childSinks.state;

      const initReducer$ = xs.of(function initReducer(prevState: any): any {
        return {list: [{val: 3}]};
      });

      const addReducer$ = xs
        .of(function addSecond(prev: any) {
          return {list: prev.list.concat({val: null})};
        })
        .compose(delay(100));

      const parentReducer$ = xs.merge(initReducer$, addReducer$);
      const reducer$ = xs.merge(parentReducer$, childReducer$) as Stream<
        Reducer<any>
      >;

      return {
        state: reducer$,
      };
    }

    const wrapped = withState(Main);
    wrapped({});
    setTimeout(() => {
      assert.strictEqual(expected.length, 0);
      done();
    }, 200);
  });

  it('should work also on an object, not just on arrays', done => {
    const expected = [{key: 'a', val: null}, {key: 'a', val: 10}];
    function Child(sources: {state: StateSource<any>}) {
      const defaultReducer$ = xs.of((prev: any) => {
        if (typeof prev.val === 'number') {
          return prev;
        } else {
          return {key: prev.key, val: 10};
        }
      });

      return {
        state: defaultReducer$,
      };
    }

    const Wrapper = makeCollection({
      item: Child,
      collectSinks: instances => ({
        state: instances.pickMerge('state'),
      }),
    });

    function Main(sources: {state: StateSource<any>}) {
      sources.state.stream.addListener({
        next(x) {
          assert.deepEqual(x.wrap, expected.shift());
        },
        error(e) {
          done(e.message);
        },
        complete() {
          done('complete should not be called');
        },
      });

      const wrapperSinks = isolate(Wrapper, 'wrap')(sources);
      const wrapperReducer$ = wrapperSinks.state;

      const initReducer$ = xs.of(function initReducer(prevState: any): any {
        return {wrap: {key: 'a', val: null}};
      });

      const reducer$ = xs.merge(initReducer$, wrapperReducer$) as Stream<
        Reducer<any>
      >;

      return {
        state: reducer$,
      };
    }

    const wrapped = withState(Main);
    wrapped({});
    setTimeout(() => {
      assert.strictEqual(expected.length, 0);
      done();
    }, 60);
  });

  it('should not throw if pickMerge() is called with name that item does not use', done => {
    function Child(sources: {state: StateSource<any>}) {
      return {
        state: xs.of({}),
      };
    }

    const List = makeCollection<{key: string}>({
      item: Child,
      itemKey: s => s.key,
      itemScope: key => key,
      collectSinks: instances => ({
        HTTP: instances.pickMerge('HTTP'),
      }),
    });

    function Main(sources: {state: StateSource<any>}) {
      const childSinks = isolate(List, 'list')(sources);

      const initReducer$ = xs.of(function initReducer(prevState: any): any {
        return {list: [{key: 'a', val: 3}]};
      });

      childSinks.HTTP.subscribe({});

      return {
        state: initReducer$,
      };
    }

    const wrapped = withState(Main);
    wrapped({});
    done();
  });
}); */
