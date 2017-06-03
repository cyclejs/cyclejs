import 'mocha';
import * as assert from 'assert';
import * as Rx from 'rxjs';
import isolate from '../lib/index';
import * as sinon from 'sinon';

describe('isolate', function() {
  beforeEach(function() {
    (isolate as any).reset();
  });

  it('should be a function', function() {
    assert.strictEqual(typeof isolate, 'function');
  });

  it('should throw if first argument is not a function', function() {
    assert.throws(() => {
      isolate('not a function' as any);
    }, /First argument given to isolate\(\) must be a 'dataflowComponent' function/i);
  });

  it('should throw if second argument is null', function() {
    function MyDataflowComponent() {}
    assert.throws(() => {
      isolate(MyDataflowComponent, null);
    }, /Second argument given to isolate\(\) must not be null/i);
  });

  it('should convert the 2nd argument to string if it is not a string', function() {
    function MyDataflowComponent() {}
    assert.doesNotThrow(() => {
      isolate(MyDataflowComponent, 12);
    });
  });

  it('should return a function', function() {
    function MyDataflowComponent() {}
    const scopedMyDataflowComponent = isolate(MyDataflowComponent, `myScope`);
    assert.strictEqual(typeof scopedMyDataflowComponent, `function`);
  });

  it('should make a new scope if second argument is undefined', function() {
    function MyDataflowComponent() {}
    const scopedMyDataflowComponent = isolate(MyDataflowComponent);
    assert.strictEqual(typeof scopedMyDataflowComponent, `function`);
  });

  it('should accept a scopes-per-channel object as the second argument', function() {
    function Component(sources: any) {
      return {
        first: sources.first.getSink(),
        second: sources.second.getSink(),
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
          return 10;
        },
        isolateSource(source: any, scope: string) {
          actual1 = scope;
          return source;
        },
        isolateSink(sink: any, scope: string) {
          actual2 = scope;
          return sink;
        },
      },

      second: {
        getSink() {
          return 20;
        },
        isolateSource(source: any, scope: string) {
          actual3 = scope;
          return source;
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
    assert.strictEqual(sinks.first, 10);
    assert.strictEqual(sinks.second, 20);
  });

  it('should generate a scope if a channel is undefined in scopes-per-channel', function() {
    function Component(sources: any) {
      return {
        first: sources.first.getSink(),
        second: sources.second.getSink(),
      };
    }

    const scopedComponent = isolate(Component, {first: 'scope1'});
    let actual1 = '';
    let actual2 = '';
    let actual3 = '';
    let actual4 = '';

    const sources = {
      first: {
        getSink() {
          return 10;
        },
        isolateSource(source: any, scope: string) {
          actual1 = scope;
          return source;
        },
        isolateSink(sink: any, scope: string) {
          actual2 = scope;
          return sink;
        },
      },

      second: {
        getSink() {
          return 20;
        },
        isolateSource(source: any, scope: string) {
          actual3 = scope;
          return source;
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
    assert.strictEqual(actual3, 'cycle1');
    assert.strictEqual(actual4, 'cycle1');
    assert.strictEqual(sinks.first, 10);
    assert.strictEqual(sinks.second, 20);
  });

  it('should accept a wildcard * in the scopes-per-channel object', function() {
    function Component(sources: any) {
      return {
        first: sources.first.getSink(),
        second: sources.second.getSink(),
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
          return 10;
        },
        isolateSource(source: any, scope: string) {
          actual1 = scope;
          return source;
        },
        isolateSink(sink: any, scope: string) {
          actual2 = scope;
          return sink;
        },
      },

      second: {
        getSink() {
          return 20;
        },
        isolateSource(source: any, scope: string) {
          actual3 = scope;
          return source;
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
    assert.strictEqual(sinks.first, 10);
    assert.strictEqual(sinks.second, 20);
  });

  it('should not convert to string values in scopes-per-channel object', function() {
    function Component(sources: any) {
      return {
        first: sources.first.getSink(),
        second: sources.second.getSink(),
      };
    }

    const scopedComponent = isolate(Component, {first: 123, second: 456});
    let actual1 = '';
    let actual2 = '';
    let actual3 = '';
    let actual4 = '';

    const sources = {
      first: {
        getSink() {
          return 10;
        },
        isolateSource(source: any, scope: string) {
          actual1 = scope;
          return source;
        },
        isolateSink(sink: any, scope: string) {
          actual2 = scope;
          return sink;
        },
      },

      second: {
        getSink() {
          return 20;
        },
        isolateSource(source: any, scope: string) {
          actual3 = scope;
          return source;
        },
        isolateSink(sink: any, scope: string) {
          actual4 = scope;
          return sink;
        },
      },
    };
    const sinks = scopedComponent(sources);

    assert.strictEqual(actual1, 123);
    assert.strictEqual(actual2, 123);
    assert.strictEqual(actual3, 456);
    assert.strictEqual(actual4, 456);
    assert.strictEqual(sinks.first, 10);
    assert.strictEqual(sinks.second, 20);
  });

  describe('scopedDataflowComponent', function() {
    it('should return a valid dataflow component', function() {
      function driver() {
        return {};
      }

      function MyDataflowComponent(
        sources: {other: any},
        foo: string,
        bar: string,
      ) {
        return {
          other: Rx.Observable.of([foo, bar]),
        };
      }
      const scopedMyDataflowComponent = isolate(MyDataflowComponent);
      const scopedSinks = scopedMyDataflowComponent(
        {other: driver()},
        `foo`,
        `bar`,
      );

      assert.strictEqual(typeof scopedSinks, `object`);
      scopedSinks.other.subscribe((x: Array<string>) => {
        assert.strictEqual(x.join(), `foo,bar`);
      });
    });

    it('should call `isolateSource` of drivers', function() {
      function driver() {
        function isolateSource(source: any, scope: string) {
          return source.someFunc(scope);
        }
        function someFunc(v: string) {
          const scope = this.scope;
          return {
            scope: scope.concat(v),
            someFunc,
            isolateSource,
          };
        }
        return {
          scope: [],
          someFunc,
          isolateSource,
        };
      }

      function MyDataflowComponent(sources: {other: any}) {
        return {
          other: sources.other.someFunc('a'),
        };
      }
      const scopedMyDataflowComponent = isolate(MyDataflowComponent, `myScope`);
      const scopedSinks = scopedMyDataflowComponent({other: driver()});
      assert.strictEqual(scopedSinks.other.scope.length, 2);
      assert.strictEqual(scopedSinks.other.scope[0], `myScope`);
      assert.strictEqual(scopedSinks.other.scope[1], `a`);
    });

    it('should not call `isolateSink` for a sink-only driver', function() {
      function driver(sink: any) {}

      function MyDataflowComponent(sources: {other: any}) {
        return {
          other: ['a'],
        };
      }
      let scopedMyDataflowComponent;
      assert.doesNotThrow(function() {
        scopedMyDataflowComponent = isolate(MyDataflowComponent, `myScope`);
      });
      const scopedSinks = (scopedMyDataflowComponent as any)({
        other: driver(null),
      });
      assert.strictEqual(scopedSinks.other.length, 1);
      assert.strictEqual(scopedSinks.other[0], 'a');
    });

    it('should call `isolateSink` of drivers', function() {
      function driver() {
        function isolateSink(sink: any, scope: string) {
          return sink.map((v: string) => `${v} ${scope}`);
        }
        return {
          isolateSink,
        };
      }

      function MyDataflowComponent(sources: {other: any}) {
        return {
          other: ['a'],
        };
      }
      const scopedMyDataflowComponent = isolate(MyDataflowComponent, `myScope`);
      const scopedSinks = scopedMyDataflowComponent({other: driver()});
      assert.strictEqual(scopedSinks.other.length, 1);
      assert.strictEqual(scopedSinks.other[0], `a myScope`);
    });

    it('should handle undefined cases gracefully', function() {
      const MyDataflowComponent = () => ({});
      const scopedMyDataflowComponent = isolate(MyDataflowComponent, 'myScope');
      assert.doesNotThrow(() =>
        scopedMyDataflowComponent({noSource: void 0 as any}),
      );
    });
  });
});
