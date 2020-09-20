import * as assert from 'assert';
import { pipe, subscribe, of, map } from '@cycle/callbags';
import { isolate } from '../src/index';

describe('isolate', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof isolate, 'function');
  });

  it('should throw if first argument is not a function', () => {
    assert.throws(() => {
      isolate('not a function' as any, null as any);
    }, /First argument given to isolate\(\) must be a main function/i);
  });

  it('should throw if second argument is null', () => {
    assert.throws(() => {
      isolate(() => {}, null as any);
    }, /Second argument given to isolate\(\) must not be null/i);
  });

  it('should return a function', () => {
    function MyDataflowComponent() {}
    const scopedMyDataflowComponent = isolate(MyDataflowComponent, `myScope`);
    assert.strictEqual(typeof scopedMyDataflowComponent, `function`);
  });

  it('should accept a scopes-per-channel object as the second argument', done => {
    function Component(_sources: any) {
      return {
        first: _sources.first.getSink(),
        second: _sources.second.getSink(),
      };
    }

    const scopedComponent = isolate(Component, {
      first: 'scope1',
      second: 'scope2',
    });
    let actual1 = '';
    let actual2 = '';
    let actual3 = '';
    let actual4 = '';

    const sources = {
      first: {
        getSink() {
          return of(10);
        },
        isolateSource(scope: string) {
          actual1 = scope;
          return this;
        },
        isolateSink(sink: any, scope: string) {
          actual2 = scope;
          return sink;
        },
      },

      second: {
        getSink() {
          return of(20);
        },
        isolateSource(scope: string) {
          actual3 = scope;
          return this;
        },
        isolateSink(sink: any, scope: string) {
          actual4 = scope;
          return sink;
        },
      },
    };
    const sinks = scopedComponent(sources);

    assert.strictEqual(actual1, 'scope1');
    assert.strictEqual(actual2, 'scope1');
    assert.strictEqual(actual3, 'scope2');
    assert.strictEqual(actual4, 'scope2');
    let hasFirst = false;
    pipe(
      sinks.first,
      subscribe((x: any) => {
        assert.strictEqual(hasFirst, false);
        assert.strictEqual(x, 10);
        hasFirst = true;
      })
    );
    pipe(
      sinks.second,
      subscribe((x: any) => {
        assert.strictEqual(hasFirst, true);
        assert.strictEqual(x, 20);
        done();
      })
    );
  });

  it('should not isolate a channel given null scope', done => {
    function Component(_sources: any) {
      return {
        first: _sources.first.getSink(),
        second: _sources.second.getSink(),
      };
    }

    const scopedComponent = isolate(Component, {
      first: null,
      second: 'scope2',
    });
    let actual1 = '';
    let actual2 = '';
    let actual3 = '';
    let actual4 = '';

    const sources = {
      first: {
        getSink() {
          return of(10);
        },
        isolateSource(scope: string) {
          actual1 = scope;
          return this;
        },
        isolateSink(sink: any, scope: string) {
          actual2 = scope;
          return sink;
        },
      },

      second: {
        getSink() {
          return of(20);
        },
        isolateSource(scope: string) {
          actual3 = scope;
          return this;
        },
        isolateSink(sink: any, scope: string) {
          actual4 = scope;
          return sink;
        },
      },
    };
    const sinks = scopedComponent(sources);

    assert.strictEqual(actual1, '');
    assert.strictEqual(actual2, '');
    assert.strictEqual(actual3, 'scope2');
    assert.strictEqual(actual4, 'scope2');
    let hasFirst = false;
    pipe(
      sinks.first,
      subscribe((x: any) => {
        assert.strictEqual(hasFirst, false);
        assert.strictEqual(x, 10);
        hasFirst = true;
      })
    );
    pipe(
      sinks.second,
      subscribe((x: any) => {
        assert.strictEqual(hasFirst, true);
        assert.strictEqual(x, 20);
        done();
      })
    );
  });

  it('should not isolate if a channel is undefined in scopes-per-channel', done => {
    function Component(_sources: any) {
      return {
        first: _sources.first.getSink(),
        second: _sources.second.getSink(),
      };
    }

    const scopedComponent = isolate(Component, {
      second: 'scope2',
    });
    let actual1 = '';
    let actual2 = '';
    let actual3 = '';
    let actual4 = '';

    const sources = {
      first: {
        getSink() {
          return of(10);
        },
        isolateSource(scope: string) {
          actual1 = scope;
          return this;
        },
        isolateSink(sink: any, scope: string) {
          actual2 = scope;
          return sink;
        },
      },

      second: {
        getSink() {
          return of(20);
        },
        isolateSource(scope: string) {
          actual3 = scope;
          return this;
        },
        isolateSink(sink: any, scope: string) {
          actual4 = scope;
          return sink;
        },
      },
    };
    const sinks = scopedComponent(sources);

    assert.strictEqual(actual1, '');
    assert.strictEqual(actual2, '');
    assert.strictEqual(actual3, 'scope2');
    assert.strictEqual(actual4, 'scope2');
    let hasFirst = false;
    pipe(
      sinks.first,
      subscribe((x: any) => {
        assert.strictEqual(hasFirst, false);
        assert.strictEqual(x, 10);
        hasFirst = true;
      })
    );
    pipe(
      sinks.second,
      subscribe((x: any) => {
        assert.strictEqual(hasFirst, true);
        assert.strictEqual(x, 20);
        done();
      })
    );
  });

  it('should accept a wildcard * in the scopes-per-channel object', done => {
    function Component(_sources: any) {
      return {
        first: _sources.first.getSink(),
        second: _sources.second.getSink(),
      };
    }

    const scopedComponent = isolate(Component, {
      first: 'scope1',
      '*': 'default',
    });
    let actual1 = '';
    let actual2 = '';
    let actual3 = '';
    let actual4 = '';

    const sources = {
      first: {
        getSink() {
          return of(10);
        },
        isolateSource(scope: string) {
          actual1 = scope;
          return this;
        },
        isolateSink(sink: any, scope: string) {
          actual2 = scope;
          return sink;
        },
      },

      second: {
        getSink() {
          return of(20);
        },
        isolateSource(scope: string) {
          actual3 = scope;
          return this;
        },
        isolateSink(sink: any, scope: string) {
          actual4 = scope;
          return sink;
        },
      },
    };
    const sinks = scopedComponent(sources);

    assert.strictEqual(actual1, 'scope1');
    assert.strictEqual(actual2, 'scope1');
    assert.strictEqual(actual3, 'default');
    assert.strictEqual(actual4, 'default');
    let hasFirst = false;
    pipe(
      sinks.first,
      subscribe((x: any) => {
        assert.strictEqual(hasFirst, false);
        assert.strictEqual(x, 10);
        hasFirst = true;
      })
    );
    pipe(
      sinks.second,
      subscribe((x: any) => {
        assert.strictEqual(hasFirst, true);
        assert.strictEqual(x, 20);
        done();
      })
    );
  });

  it('should not isolate a non-specified channel if wildcard * is null', done => {
    function Component(_sources: any) {
      return {
        first: _sources.first.getSink(),
        second: _sources.second.getSink(),
      };
    }

    const scopedComponent = isolate(Component, {
      first: 'scope1',
      '*': null,
    });
    let actual1 = '';
    let actual2 = '';
    let actual3 = '';
    let actual4 = '';

    const sources = {
      first: {
        getSink() {
          return of(10);
        },
        isolateSource(scope: string) {
          actual1 = scope;
          return this;
        },
        isolateSink(sink: any, scope: string) {
          actual2 = scope;
          return sink;
        },
      },

      second: {
        getSink() {
          return of(20);
        },
        isolateSource(scope: string) {
          actual3 = scope;
          return this;
        },
        isolateSink(sink: any, scope: string) {
          actual4 = scope;
          return sink;
        },
      },
    };
    const sinks = scopedComponent(sources);

    assert.strictEqual(actual1, 'scope1');
    assert.strictEqual(actual2, 'scope1');
    assert.strictEqual(actual3, '');
    assert.strictEqual(actual4, '');
    let hasFirst = false;
    pipe(
      sinks.first,
      subscribe((x: any) => {
        assert.strictEqual(hasFirst, false);
        assert.strictEqual(x, 10);
        hasFirst = true;
      })
    );
    pipe(
      sinks.second,
      subscribe((x: any) => {
        assert.strictEqual(hasFirst, true);
        assert.strictEqual(x, 20);
        done();
      })
    );
  });

  describe('isolatedMain', () => {
    it('should return a valid main function', done => {
      function MyDataflowComponent(
        _sources: { other: unknown },
        foo: string,
        bar: string
      ) {
        return {
          other: of([foo, bar]),
        };
      }
      const scopedMyDataflowComponent = isolate(MyDataflowComponent, 'scope');
      const scopedSinks = scopedMyDataflowComponent(
        { other: {} },
        `foo`,
        `bar`
      );

      assert.strictEqual(typeof scopedSinks, 'object');
      pipe(
        scopedSinks.other,
        subscribe((strings: string[]) => {
          assert.strictEqual(strings.join(), 'foo,bar');
          done();
        })
      );
    });

    it('should not call `isolateSink` for a sink-only driver', () => {
      function driver(_sink: any) {}

      function MyDataflowComponent(_sources: { other: any }) {
        return {
          other: of('a'),
        };
      }
      let scopedMyDataflowComponent: any;
      assert.doesNotThrow(function () {
        scopedMyDataflowComponent = isolate(MyDataflowComponent, `myScope`);
      });
      const scopedSinks = (scopedMyDataflowComponent as any)({
        other: driver(null),
      });
      pipe(
        scopedSinks.other,
        subscribe((x: any) => assert.strictEqual(x, 'a'))
      );
    });

    it('should call `isolateSink` of APIs', done => {
      class TestApi {
        isolateSource(_scope: any) {
          return this;
        }

        isolateSink(sink: any, scope: string) {
          return pipe(
            sink,
            map((v: string) => `${v} ${scope}`)
          );
        }
      }

      function MyDataflowComponent(_sources: { other: unknown }) {
        return {
          other: of('a'),
        };
      }
      const scopedMyDataflowComponent = isolate(MyDataflowComponent, 'myScope');
      const scopedSinks = scopedMyDataflowComponent({ other: new TestApi() });
      pipe(
        scopedSinks.other,
        subscribe(x => {
          assert.strictEqual(x, 'a myScope');
          done();
        })
      );
    });

    it('should handle undefined cases gracefully', function () {
      const MyDataflowComponent = () => ({});
      const scopedMyDataflowComponent = isolate(MyDataflowComponent, 'myScope');
      assert.doesNotThrow(() =>
        scopedMyDataflowComponent({ noSource: void 0 as any })
      );
    });
  });
});
