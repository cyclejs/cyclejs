import * as assert from 'assert';
import { setup, Driver } from '../src/index';
import {
  Producer,
  of,
  pipe,
  subscribe,
  merge,
  take,
  map,
  startWith,
  never,
  makeSubject,
} from '@cycle/callbags';

describe('setup', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof setup, 'function');
  });

  it('should throw if second argument is not an object', () => {
    assert.throws(() => {
      (setup as any)(() => {}, 'not an object');
    }, /Second argument given to setup must be an object with plugins/i);
  });

  it('should throw if first argument is an empty object', () => {
    assert.throws(() => {
      (setup as any)(() => {}, {});
    }, /Second argument given to setup must be an object with at least one plugin/i);
  });

  it('should allow to have a driver that takes a union as input', () => {
    function app(_so: { drv: Producer<string> }) {
      return {
        drv: of('foo'),
      };
    }

    class TestDriver implements Driver<string | number, string> {
      provideSource() {
        return of('bar');
      }

      consumeSink(sink: Producer<string | number>) {
        return pipe(
          sink,
          subscribe(d => assert.strictEqual(d, 'foo'))
        );
      }
    }

    const { run } = setup(app, {
      drv: new TestDriver(),
    });

    run();
  });

  it('should allow to not use all sources in main', () => {
    function app(so: { first: Producer<string> }) {
      return {
        first: of('test'),
        second: so.first,
      };
    }
    function app2() {
      return { second: of('test') };
    }

    class TestDriver implements Driver<string, string> {
      constructor(private test: string) {}

      provideSource() {
        return of('answer');
      }

      consumeSink(sink: Producer<string>) {
        return pipe(
          sink,
          subscribe(d => assert.strictEqual(d, this.test))
        );
      }
    }

    const { run } = setup(app, {
      first: new TestDriver('test'),
      second: new TestDriver('answer'),
    });
    run();

    const { run: run2 } = setup(app2, {
      first: new TestDriver(''),
      second: new TestDriver('test'),
    });
    run2();
  });

  it('should return a connect() which in turn returns a dispose()', done => {
    type TestSources = {
      other: Producer<number>;
    };

    let dispose: any;
    function app(sources: TestSources) {
      pipe(
        sources.other,
        subscribe(x => {
          assert.strictEqual(x, 97);
          dispose();
        }, done)
      );

      return {
        other: merge(
          pipe(sources.other, take(6), map(String), startWith('a')),
          never()
        ),
      };
    }

    class TestDriver implements Driver<number, string> {
      private subject = makeSubject<number>();

      provideSource() {
        return this.subject;
      }

      consumeSink(sink: Producer<string>) {
        return pipe(
          sink,
          subscribe(x => {
            setTimeout(() => this.subject(1, x.charCodeAt(0)), 1);
          })
        );
      }
    }

    const { run } = setup(app, { other: new TestDriver() });
    dispose = run();
  });

  it('should not work after has been disposed', done => {
    type MySources = {
      other: Producer<string>;
    };

    function inverval(n: number): Producer<number> {
      return (_, sink) => {
        let id: any;
        let i = 0;

        sink(0, () => {
          clearInterval(id);
        });

        id = setInterval(() => {
          sink(1, i++);
        }, n);
      };
    }

    let dispose: any;
    function app(sources: MySources) {
      pipe(
        sources.other,
        subscribe(x => {
          assert.notStrictEqual(x, 'x3');
          if (x === 'x2') {
            dispose();
          }
        }, done)
      );

      return {
        other: pipe(
          inverval(100),
          map(i => i + 1)
        ),
      };
    }

    class TestDriver implements Driver<string, number> {
      private subject = makeSubject<string>();
      provideSource() {
        return this.subject;
      }

      consumeSink(sink: Producer<number>) {
        return pipe(
          sink,
          subscribe(x => {
            this.subject(1, 'x' + x);
          })
        );
      }
    }

    const { run } = setup(app, { other: new TestDriver() });

    dispose = run();
  });
});
