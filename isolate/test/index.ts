import 'mocha';
import * as assert from 'assert';
import * as Rx from 'rxjs';
import {isolate, defaultIsolation, Scope} from '../lib/cjs/index';
import * as sinon from 'sinon';

describe('isolate', function() {
  it('should be a function', function() {
    assert.strictEqual(typeof isolate, 'function');
  });

  it('should throw if first argument is not a function', function() {
    assert.throws(() => {
      isolate('not a function' as any, {});
    }, /First argument given to isolate\(\) must be a 'dataflowComponent' function/i);
  });

  it('should throw if second argument is null', function() {
    function MyDataflowComponent() {}
    assert.throws(() => {
      isolate(MyDataflowComponent, null as any);
    }, /scope is not allowed to be a falsy value/i);
  });

  it('should return a function', function() {
    function MyDataflowComponent() {}
    const scopedMyDataflowComponent = isolate(
      MyDataflowComponent,
      defaultIsolation(`myScope`),
    );
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
      first: defaultIsolation('scope1'),
      second: defaultIsolation('scope2'),
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
        isolateSource(source: any, scope: Scope) {
          actual1 = scope.payload;
          return source;
        },
        isolateSink(sink: any, scope: Scope) {
          actual2 = scope.payload;
          return sink;
        },
      },

      second: {
        getSink() {
          return 20;
        },
        isolateSource(source: any, scope: Scope) {
          actual3 = scope.payload;
          return source;
        },
        isolateSink(sink: any, scope: Scope) {
          actual4 = scope.payload;
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

  it('should accept a wildcard * in the scopes-per-channel object', function() {
    function Component(sources: any) {
      return {
        first: sources.first.getSink(),
        second: sources.second.getSink(),
      };
    }

    const scopedComponent = isolate(Component, {
      first: defaultIsolation('scope1'),
      '*': defaultIsolation('default'),
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
        isolateSource(source: any, scope: Scope) {
          actual1 = scope.payload;
          return source;
        },
        isolateSink(sink: any, scope: Scope) {
          actual2 = scope.payload;
          return sink;
        },
      },

      second: {
        getSink() {
          return 20;
        },
        isolateSource(source: any, scope: Scope) {
          actual3 = scope.payload;
          return source;
        },
        isolateSink(sink: any, scope: Scope) {
          actual4 = scope.payload;
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

  it('should not isolate a non-specified channel', function() {
    function Component(sources: any) {
      return {
        first: sources.first.getSink(),
        second: sources.second.getSink(),
      };
    }

    const scopedComponent = isolate(Component, {
      first: defaultIsolation('scope1'),
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
        isolateSource(source: any, scope: Scope) {
          actual1 = scope.payload;
          return source;
        },
        isolateSink(sink: any, scope: Scope) {
          actual2 = scope.payload;
          return sink;
        },
      },

      second: {
        getSink() {
          return 20;
        },
        isolateSource(source: any, scope: Scope) {
          actual3 = scope.payload;
          return source;
        },
        isolateSink(sink: any, scope: Scope) {
          actual4 = scope.payload;
          return sink;
        },
      },
    };
    const sinks = scopedComponent(sources);

    assert.strictEqual(actual1, 'scope1');
    assert.strictEqual(actual2, 'scope1');
    assert.strictEqual(actual3, '');
    assert.strictEqual(actual4, '');
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
      const scopedMyDataflowComponent = isolate(
        MyDataflowComponent,
        defaultIsolation('foo'),
      );
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
        function isolateSource(source: any, scope: Scope) {
          return source.someFunc(scope.payload);
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
      const scopedMyDataflowComponent = isolate(
        MyDataflowComponent,
        defaultIsolation(`myScope`),
      );
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
        scopedMyDataflowComponent = isolate(
          MyDataflowComponent,
          defaultIsolation(`myScope`),
        );
      });
      const scopedSinks = (scopedMyDataflowComponent as any)({
        other: driver(null),
      });
      assert.strictEqual(scopedSinks.other.length, 1);
      assert.strictEqual(scopedSinks.other[0], 'a');
    });

    it('should call `isolateSink` of drivers', function() {
      function driver() {
        function isolateSink(sink: any, scope: Scope) {
          return sink.map((v: string) => `${v} ${scope.payload}`);
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
      const scopedMyDataflowComponent = isolate(
        MyDataflowComponent,
        defaultIsolation(`myScope`),
      );
      const scopedSinks = scopedMyDataflowComponent({other: driver()});
      assert.strictEqual(scopedSinks.other.length, 1);
      assert.strictEqual(scopedSinks.other[0], `a myScope`);
    });

    it('should handle undefined cases gracefully', function() {
      const MyDataflowComponent = () => ({});
      const scopedMyDataflowComponent = isolate(
        MyDataflowComponent,
        defaultIsolation('myScope'),
      );
      assert.doesNotThrow(() =>
        scopedMyDataflowComponent({noSource: void 0 as any}),
      );
    });
  });
});
