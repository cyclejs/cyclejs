import * as assert from 'assert';
import {
  Producer,
  Subject,
  pipe,
  map,
  filter,
  uponStart,
  makeSubject,
  subscribe,
} from '@cycle/callbags';

import {
  run,
  applyApis,
  IdGenerator,
  Subscription,
  Driver,
  Plugin,
  Api,
  ID,
} from '../src/index';

type RandomSource = { id: ID; value: number };

class RandomApi implements Api<RandomSource, ID> {
  constructor(
    public readonly source: Producer<RandomSource>,
    private sinkSubject: Subject<ID>,
    private gen: IdGenerator
  ) {}

  public get(): Producer<number> {
    const id = this.gen();

    return pipe(
      this.source,
      filter(x => x.id === id),
      map(x => x.value),
      uponStart(() => {
        this.sinkSubject(1, id);
      })
    );
  }
}

function randomApiFactory(
  source: Producer<RandomSource>,
  subject: Subject<ID>,
  gen: IdGenerator
) {
  return new RandomApi(source, subject, gen);
}

function makeRandomPlugin(n: number): Plugin<RandomSource, ID> {
  class RandomDriver implements Driver<RandomSource, ID> {
    private subject = makeSubject<RandomSource>();

    provideSource() {
      return this.subject;
    }

    consumeSink(sink: Producer<ID>): Subscription {
      return pipe(
        sink,
        subscribe(id => {
          this.subject(1, { id, value: n });
        })
      );
    }
  }
  return [new RandomDriver(), randomApiFactory];
}

describe('api', () => {
  it('should automaticly apply apis when using run', () => {
    const n = 5;
    let called = false;

    function main(sources: any) {
      pipe(
        sources.random.get(),
        subscribe(x => {
          assert.strictEqual(called, false);
          assert.strictEqual(x, n);
          called = true;
        })
      );
      return {};
    }

    run(main, { random: makeRandomPlugin(n) }, []);
    assert.strictEqual(called, true);
  });

  it('should allow to manually apply apis', () => {
    const n = 99;
    let called = false;

    function child(sources: { random: RandomApi }): { log: Producer<number> } {
      return {
        log: sources.random.get(),
      };
    }

    function parent(sources: { random: RandomApi }) {
      const sinks1: any = child(sources);
      assert.strictEqual(sinks1.random, undefined);

      const sinks2 = applyApis(child, { random: randomApiFactory })(sources);
      assert.strictEqual(typeof sinks2.random, 'function');

      pipe(
        sinks2.log,
        subscribe(x => {
          assert.strictEqual(called, false);
          assert.strictEqual(x, n);
          called = true;
        })
      );

      return {
        random: sinks2.random,
      };
    }

    run(parent, { random: makeRandomPlugin(n) }, []);
    assert.strictEqual(called, true);
  });
});
