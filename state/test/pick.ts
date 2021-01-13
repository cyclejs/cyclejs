import * as assert from 'assert';
import {
  Producer,
  of,
  fromArray,
  pipe,
  subscribe,
  throwError,
  makeSubject,
} from '@cycle/callbags';
import { Sinks } from '@cycle/run';
import { unsubscribeEarly, delay } from './helpers';

import { pickMerge, pickCombine } from '../src/pick';

function mkSinks(data: Record<string, any>): Sinks {
  return Object.keys(data).reduce(
    (acc, k) => ({
      ...acc,
      [k]: of(data[k]),
    }),
    {}
  );
}

describe('pick', () => {
  it('should allow to unsubscribe', done => {
    pipe(
      of([mkSinks({ state: 1 })]),
      delay(10),
      pickMerge('state'),
      unsubscribeEarly(t => t === 0),
      subscribe(() => assert.fail('should not deliver data'), done)
    );
  });

  it('should not resubscribe to sinks that get emitted again', () => {
    pipe(
      of([{ state: throwError(new Error('this is an expected error')) }]),
      pickMerge('state'),
      subscribe(
        () => assert.fail('should not deliver data'),
        e => {
          assert.strictEqual(e.message, 'this is an expected error');
        }
      )
    );
  });

  it('should complete if the sink array stream completes and the picked channels complete', done => {
    const subject = makeSubject();

    const expected = [1, 2, 3, 4];

    pipe(
      of([{ state: subject }]),
      pickMerge('state'),
      subscribe(
        x => {
          assert.strictEqual(x, expected.shift());
        },
        e => {
          if (e) assert.fail('should not error');
          assert.strictEqual(expected.length, 0);
          done();
        }
      )
    );

    for (const x of expected.slice()) {
      subject(1, x);
    }
    subject(2);
  });

  it('should allow the sink array stream to error', done => {
    pipe(
      throwError(new Error('this is an expected error')),
      pickMerge('state'),
      subscribe(
        () => assert.fail('should not deliver data'),
        e => {
          assert.strictEqual(e.message, 'this is an expected error');
          done();
        }
      )
    );
  });

  it('should not error if an unused channel is picked', done => {
    pipe(
      of([{}, {}]),
      pickMerge('state'),
      subscribe(() => assert.fail('should not deliver data'), done)
    );
  });

  describe('pickMerge', () => {
    it('should merge sink channels when emitted once', () => {
      const expected = [1, 2, 3, 4];

      pipe(
        of(expected.map(x => mkSinks({ state: x }))),
        pickMerge('state'),
        subscribe(x => {
          assert.strictEqual(x, expected.shift());
        })
      );

      assert.strictEqual(expected.length, 0);
    });

    it('should not resubscribe to sinks that get emitted again', () => {
      const expected = [1, 2, 3, 4];

      const sinks = expected.map(x => mkSinks({ state: x }));
      pipe(
        fromArray([sinks, sinks, sinks]),
        pickMerge('state'),
        subscribe(x => {
          assert.strictEqual(x, expected.shift());
        })
      );

      assert.strictEqual(expected.length, 0);
    });

    it('should not resubscribe to sinks that get emitted again, but only to new sinks', () => {
      const expected = [1, 2, 3, 4];

      const sinks = expected.map(x => mkSinks({ state: x }));
      pipe(
        fromArray([
          sinks.slice(0, 1),
          sinks.slice(0, 2),
          sinks.slice(0, 3),
          sinks,
        ]),
        pickMerge('state'),
        subscribe(x => {
          assert.strictEqual(x, expected.shift());
        })
      );

      assert.strictEqual(expected.length, 0);
    });

    it('should not rely on ordering of sinks between emissions for resubscribing', () => {
      const expected = [1, 2, 3, 4];

      const sinks = expected.map(x => mkSinks({ state: x }));
      pipe(
        fromArray([
          sinks,
          [sinks[1], sinks[0], sinks[2], sinks[3]],
          [sinks[2], sinks[1], sinks[3], sinks[0]],
          [sinks[3], sinks[2], sinks[1], sinks[0]],
        ]),
        pickMerge('state'),
        subscribe(x => {
          assert.strictEqual(x, expected.shift());
        })
      );
    });

    it('should unsubscribe and resubscribe if sinks were dropped', () => {
      const data = [1, 2, 3, 4];
      const expected = data.concat(data);

      const sinks = data.map(x => mkSinks({ state: x }));
      pipe(
        fromArray([sinks, [], sinks]),
        pickMerge('state'),
        subscribe(x => {
          assert.strictEqual(x, expected.shift());
        })
      );

      assert.strictEqual(expected.length, 0);
    });
  });

  describe('pickCombine', () => {
    it('should combine sink channels when emitted once', () => {
      const expected = [1, 2, 3, 4];

      let emitted = false;
      pipe(
        of(expected.map(x => mkSinks({ state: x }))),
        pickCombine('state'),
        subscribe(x => {
          assert.deepStrictEqual(x, expected);
          emitted = true;
        })
      );

      assert.strictEqual(emitted, true);
    });

    it('should not resubscribe to sinks that get emitted again', () => {
      const expected = [1, 2, 3, 4];

      const sinks = expected.map(x => mkSinks({ state: x }));

      let emitted = false;
      pipe(
        fromArray([sinks, sinks, sinks]),
        pickCombine('state'),
        subscribe(x => {
          assert.deepStrictEqual(x, expected);
          emitted = true;
        })
      );

      assert.strictEqual(emitted, true);
    });

    it('should not resubscribe to sinks that get emitted again, but only to new sinks', () => {
      const subscribed = [0, 0, 0, 0];

      function testOf<T>(x: T, idx: number): Producer<T> {
        return (_, sink) => {
          subscribed[idx]++;
          sink(0, () => {});
          sink(1, x);
          sink(2);
        };
      }

      const data = [1, 2, 3, 4];
      const sinks = data.map((x, i) => ({ state: testOf(x, i) }));

      const expected = [[1], [1, 2], [1, 2, 3], [1, 2, 3, 4]];
      pipe(
        fromArray([
          sinks.slice(0, 1),
          sinks.slice(0, 2),
          sinks.slice(0, 3),
          sinks,
        ]),
        pickCombine('state'),
        subscribe(x => {
          assert.deepStrictEqual(x, expected.shift());
        })
      );

      assert.strictEqual(expected.length, 0);
      for (const x of subscribed) {
        assert.strictEqual(x, 1);
      }
    });

    it('should not rely on ordering of sinks between emissions for resubscribing', () => {
      const subscribed = [0, 0, 0, 0];

      function testOf<T>(x: T, idx: number): Producer<T> {
        return (_, sink) => {
          subscribed[idx]++;
          sink(0, () => {});
          sink(1, x);
          sink(2);
        };
      }

      const data = [1, 2, 3, 4];
      const sinks = data.map((x, i) => ({ state: testOf(x, i) }));

      const expected = [
        [1, 2, 3, 4],
        [2, 1, 4, 3],
        [4, 1, 3, 2],
        [4, 3, 2, 1],
      ];
      pipe(
        fromArray([
          sinks,
          [sinks[1], sinks[0], sinks[3], sinks[2]],
          [sinks[3], sinks[0], sinks[2], sinks[1]],
          [sinks[3], sinks[2], sinks[1], sinks[0]],
        ]),
        pickCombine('state'),
        subscribe(x => {
          assert.deepStrictEqual(x, expected.shift());
        })
      );

      assert.strictEqual(expected.length, 0);
      for (const x of subscribed) {
        assert.strictEqual(x, 1);
      }
    });

    it('should unsubscribe and resubscribe if sinks were dropped', () => {
      const data = [1, 2, 3, 4];
      const expected = [data, data];

      const sinks = data.map(x => mkSinks({ state: x }));
      pipe(
        fromArray([sinks, [], sinks]),
        pickCombine('state'),
        subscribe(x => {
          assert.deepStrictEqual(x, expected.shift());
        })
      );

      assert.strictEqual(expected.length, 0);
    });
  });
});
