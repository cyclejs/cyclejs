import { Main, Sinks } from '@cycle/run';
import { Producer, pipe, scan, skip, map } from '@cycle/callbags';
import { isolate } from '@cycle/utils';
import { Lens } from './api';

export interface CollectionOptions<S> {
  /**
   * The Cycle.js component for each item in this collection. Should be just a
   * function from sources to sinks.
   */
  item: Main;

  /**
   * A function that describes how to collect all the sinks from all item
   * instances. The instances argument is an object with two methods: pickMerge
   * and pickCombine. These behave like callbag "merge" and "combine" operators,
   * but are applied to the dynamic collection of all item instances.
   *
   * This function should return an object of sinks. This is what the collection
   * component will output as its sinks.
   */
  collectSinks: Record<string, (instances: Producer<Sinks[]>) => Producer<any>>;

  /**
   * Specify, from the state object for each item in the collection, a key for
   * that item. This avoids bugs when the collection grows or shrinks, as well
   * as helps determine the isolation scope for each item, when specifying the
   * `itemScope` option. This function also takes the index number (from the
   * corresponding entry in the state array) as the second argument.
   *
   * Example:
   *
   * ```js
   * itemKey: (itemState, index) => itemState.key
   * ```
   */
  itemKey?: (state: S, index: number) => Key;

  /**
   * Specify each item's isolation scope, given the item's key.
   *
   * Pass a function which describes how to create the isolation scopes for each
   * item component, given that item component's unique key. The unique key for
   * each item was defined by the `itemKey` option.
   */
  itemScope?: (key: Key) => Key | Record<string, any>;

  /**
   * Choose the channel name where the StateSource exists. Typically this is
   * 'state', but you can customize it if your app is using another name. It is
   * used for referencing the correct source used for describing
   * growing/shrinking of the collection of items.
   */
  channel?: string;
}

export type Key = string | number | symbol;

type Instances = {
  dict: Map<Key, any>;
  keyToIndex: Map<Key, number>;
  arr: Array<any>;
};

function mkInstanceLens(
  keyToIndex: Map<Key, number>,
  key: Key
): Lens<Array<any> | undefined, any> {
  return {
    get: arr => {
      if (Array.isArray(arr)) {
        return arr[keyToIndex.get(key)!];
      } else return void 0;
    },
    set: (arr, item) => {
      if (typeof arr === 'undefined') {
        return [item];
      } else if (arr?.[keyToIndex.get(key)!] === item) {
        return arr;
      } else if (typeof item === 'undefined') {
        return arr.filter((_, i) => i !== keyToIndex.get(key));
      } else {
        return arr.map((s, i) => (i === keyToIndex.get(key) ? item : s));
      }
    },
  };
}

const identityLens: Lens<any, any> = {
  get: (outer: any) => outer,
  set: (_, inner: any) => inner,
};

export function makeCollection<S>(options: CollectionOptions<S>): Main {
  return function collection(sources: any) {
    const channel = options.channel ?? 'state';
    const itemScope = options.itemScope ?? (() => ({ '*': null }));
    const itemKey = options.itemKey;
    const nextKeys = new Set<Key>();

    const instances$ = pipe(
      sources[channel].stream,
      scan(
        (acc: Instances, nextState: Array<S> | any) => {
          if (Array.isArray(nextState)) {
            const nextInstances: any[] = Array(nextState.length);
            for (let i = 0; i < nextState.length; i++) {
              const key = itemKey ? itemKey(nextState[i], i) : i;
              nextKeys.add(key);

              let sinks: any;
              if (acc.keyToIndex.get(key) === i) {
                sinks = acc.dict.get(key);
              } else {
                acc.keyToIndex.set(key, i);

                if (!acc.dict.has(key)) {
                  const stateScope = itemKey
                    ? mkInstanceLens(acc.keyToIndex, key)
                    : i;

                  const otherScopes = itemScope(key);

                  const scopes =
                    typeof otherScopes === 'object'
                      ? { ...otherScopes, [channel]: stateScope }
                      : { '*': otherScopes, [channel]: stateScope };

                  sinks = isolate(options.item, scopes)(sources);
                  acc.dict.set(key, sinks);
                }
              }
              nextInstances[i] = sinks;
            }

            acc.dict.forEach((_, key) => {
              if (!nextKeys.has(key)) {
                acc.dict.delete(key);
                acc.keyToIndex.delete(key);
              }
            });

            nextKeys.clear();
            return { ...acc, arr: nextInstances };
          } else {
            acc.dict.clear();
            const key = itemKey ? itemKey(nextState, 0) : 'this';
            const stateScope = identityLens;
            const otherScopes = itemScope(key);
            const scopes =
              typeof otherScopes === 'object'
                ? { ...otherScopes, [channel]: stateScope }
                : { '*': otherScopes, [channel]: stateScope };
            const sinks = isolate(options.item, scopes)(sources);
            acc.dict.set(key, sinks);
            return { ...acc, arr: [sinks] };
          }
        },
        {
          dict: new Map<Key, any>(),
          arr: [],
          keyToIndex: new Map<Key, number>(),
        }
      ),
      skip(1),
      map(acc => acc.arr)
    );

    let result: any = {};
    for (const key of Object.keys(options.collectSinks)) {
      result[key] = options.collectSinks[key](instances$);
    }

    return result;
  };
}
