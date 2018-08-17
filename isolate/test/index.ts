// tslint:disable-next-line
import 'mocha';
import 'symbol-observable'; // tslint:disable-line
import * as assert from 'assert';
import {of, from, Observable} from 'rxjs';
import isolate from '../src/index';
import {setAdapt} from '@cycle/run/lib/adapt';

setAdapt(from as any);

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

  it('should accept a scopes-per-channel object as the second argument', function(done) {
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
          return of(20);
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
    let hasFirst = false;
    sinks.first.subscribe((x: any) => {
      assert.strictEqual(hasFirst, false);
      assert.strictEqual(x, 10);
      hasFirst = true;
    });
    sinks.second.subscribe((x: any) => {
      assert.strictEqual(hasFirst, true);
      assert.strictEqual(x, 20);
      done();
    });
  });

  it('should not isolate a channel given null scope', function(done) {
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
          return of(20);
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

    assert.strictEqual(actual1, '');
    assert.strictEqual(actual2, '');
    assert.strictEqual(actual3, 'scope2');
    assert.strictEqual(actual4, 'scope2');
    let hasFirst = false;
    sinks.first.subscribe((x: any) => {
      assert.strictEqual(hasFirst, false);
      assert.strictEqual(x, 10);
      hasFirst = true;
    });
    sinks.second.subscribe((x: any) => {
      assert.strictEqual(hasFirst, true);
      assert.strictEqual(x, 20);
      done();
    });
  });

  it('should generate a scope if a channel is undefined in scopes-per-channel', function(done) {
    function Component(_sources: any) {
      return {
        first: _sources.first.getSink(),
        second: _sources.second.getSink(),
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
          return of(10);
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
          return of(20);
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
    let hasFirst = false;
    sinks.first.subscribe((x: any) => {
      assert.strictEqual(hasFirst, false);
      assert.strictEqual(x, 10);
      hasFirst = true;
    });
    sinks.second.subscribe((x: any) => {
      assert.strictEqual(hasFirst, true);
      assert.strictEqual(x, 20);
      done();
    });
  });

  it('should accept a wildcard * in the scopes-per-channel object', function(done) {
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
          return of(20);
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
    let hasFirst = false;
    sinks.first.subscribe((x: any) => {
      assert.strictEqual(hasFirst, false);
      assert.strictEqual(x, 10);
      hasFirst = true;
    });
    sinks.second.subscribe((x: any) => {
      assert.strictEqual(hasFirst, true);
      assert.strictEqual(x, 20);
      done();
    });
  });

  it('should not isolate a non-specified channel if wildcard * is null', function(done) {
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
          return of(20);
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
    assert.strictEqual(actual3, '');
    assert.strictEqual(actual4, '');
    let hasFirst = false;
    sinks.first.subscribe((x: any) => {
      assert.strictEqual(hasFirst, false);
      assert.strictEqual(x, 10);
      hasFirst = true;
    });
    sinks.second.subscribe((x: any) => {
      assert.strictEqual(hasFirst, true);
      assert.strictEqual(x, 20);
      done();
    });
  });

  it('should not convert to string values in scopes-per-channel object', function(done) {
    function Component(_sources: any) {
      return {
        first: _sources.first.getSink(),
        second: _sources.second.getSink(),
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
          return of(10);
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
          return of(20);
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
    let hasFirst = false;
    sinks.first.subscribe((x: any) => {
      assert.strictEqual(hasFirst, false);
      assert.strictEqual(x, 10);
      hasFirst = true;
    });
    sinks.second.subscribe((x: any) => {
      assert.strictEqual(hasFirst, true);
      assert.strictEqual(x, 20);
      done();
    });
  });

  describe('scopedDataflowComponent', function() {
    it('should return a valid dataflow component', function(done) {
      function driver() {
        return {};
      }

      function MyDataflowComponent(
        sources: {other: any},
        foo: string,
        bar: string
      ) {
        return {
          other: of([foo, bar]),
        };
      }
      const scopedMyDataflowComponent = isolate(MyDataflowComponent);
      const scopedSinks = scopedMyDataflowComponent(
        {other: driver()},
        `foo`,
        `bar`
      );

      assert.strictEqual(typeof scopedSinks, `object`);
      scopedSinks.other.subscribe((x: Array<string>) => {
        assert.strictEqual(x.join(), `foo,bar`);
        done();
      });
    });

    it('should return correct types when all inputs are typed', function(done) {
      class MyTestSource {
        constructor() {}

        public isolateSource(so: MyTestSource, scope: string) {
          return new MyTestSource();
        }

        public isolateSink(
          sink: Observable<Array<string>>,
          scope: string
        ): Observable<Array<string>> {
          return sink;
        }
      }

      function MyDataflowComponent(
        sources: {other: MyTestSource},
        foo: string,
        bar: string
      ) {
        return {
          other: of([foo, bar]),
        };
      }
      const scopedMyDataflowComponent = isolate(MyDataflowComponent);
      const scopedSinks = scopedMyDataflowComponent(
        {other: new MyTestSource()},
        `foo`,
        `bar`
      );

      assert.strictEqual(typeof scopedSinks, `object`);
      scopedSinks.other.subscribe((x: Array<string>) => {
        assert.strictEqual(x.join(), `foo,bar`);
        done();
      });
    });

    it('should return correct types when all inputs are typed', function(done) {
      class MyTestSource {
        constructor() {}

        public isolateSource(so: MyTestSource, scope: string) {
          return new MyTestSource();
        }

        public isolateSink(
          sink: Observable<Array<string>>,
          scope: string
        ): Observable<Array<number>> {
          return of([123, 456]);
        }
      }

      function MyDataflowComponent(
        sources: {other: MyTestSource},
        foo: string,
        bar: string
      ) {
        return {
          other: of([foo, bar]),
        };
      }
      const scopedMyDataflowComponent = isolate(MyDataflowComponent);
      const scopedSinks = scopedMyDataflowComponent(
        {other: new MyTestSource()},
        `foo`,
        `bar`
      );

      assert.strictEqual(typeof scopedSinks, `object`);
      scopedSinks.other.subscribe((x: Array<number>) => {
        assert.strictEqual(x.join(), `123,456`);
        done();
      });
    });

    it('should return correct types when all inputs are typed', function(done) {
      function MyDataflowComponent(
        sources: {other: Observable<string>},
        foo: string,
        bar: string
      ) {
        return {
          other: of([foo, bar]),
        };
      }
      const scopedMyDataflowComponent = isolate(MyDataflowComponent);
      const scopedSinks = scopedMyDataflowComponent(
        {other: of<string>('foo')},
        `foo`,
        `bar`
      );

      assert.strictEqual(typeof scopedSinks, `object`);
      scopedSinks.other.subscribe((x: Array<string>) => {
        assert.strictEqual(x.join(), `foo,bar`);
        done();
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
          other: of('a'),
        };
      }
      let scopedMyDataflowComponent;
      assert.doesNotThrow(function() {
        scopedMyDataflowComponent = isolate(MyDataflowComponent, `myScope`);
      });
      const scopedSinks = (scopedMyDataflowComponent as any)({
        other: driver(null),
      });
      scopedSinks.other.subscribe((x: any) => assert.strictEqual(x, 'a'));
    });

    it('should call `isolateSink` of drivers', function(done) {
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
          other: of('a'),
        };
      }
      const scopedMyDataflowComponent = isolate(MyDataflowComponent, `myScope`);
      const scopedSinks = scopedMyDataflowComponent({other: driver()});
      const i = 0;
      scopedSinks.other.subscribe((x: any) => {
        assert.strictEqual(x, 'a myScope');
        done();
      });
    });

    it('should handle undefined cases gracefully', function() {
      const MyDataflowComponent = () => ({});
      const scopedMyDataflowComponent = isolate(MyDataflowComponent, 'myScope');
      assert.doesNotThrow(() =>
        scopedMyDataflowComponent({noSource: void 0 as any})
      );
    });
  });
});
