import 'mocha';
import * as assert from 'assert';
import * as sinon from 'sinon';
import {run, setup} from '../lib/cjs/index';
import xs, {Stream} from 'xstream';
import {Observable, of, from, range} from 'rxjs';
import {take, startWith, map, delay, concatMap, tap} from 'rxjs/operators';

describe('setup', function() {
  it('should be a function', function() {
    assert.strictEqual(typeof setup, 'function');
  });

  it('should throw if first argument is not a function', function() {
    assert.throws(() => {
      (setup as any)('not a function');
    }, /First argument given to Cycle must be the 'main' function/i);
  });

  it('should throw if second argument is not an object', function() {
    assert.throws(() => {
      (setup as any)(() => {}, 'not an object');
    }, /Second argument given to Cycle must be an object with driver functions/i);
  });

  it('should throw if second argument is an empty object', function() {
    assert.throws(() => {
      (setup as any)(() => {}, {});
    }, /Second argument given to Cycle must be an object with at least one/i);
  });

  it('should return sinks object and sources object', function() {
    type MySources = {
      other: Observable<string>;
    };

    type MySinks = {
      other: Observable<string>;
    };

    function app(sources: MySources): MySinks {
      return {
        other: sources.other.pipe(take(1), startWith('a')),
      };
    }
    function driver() {
      return of('b');
    }

    const {sinks, sources} = setup(app, {other: driver});
    assert.strictEqual(typeof sinks, 'object');
    assert.strictEqual(typeof sinks.other.subscribe, 'function');
    assert.strictEqual(typeof sources, 'object');
    assert.notStrictEqual(typeof sources.other, 'undefined');
    assert.notStrictEqual(sources.other, null);
    assert.strictEqual(typeof sources.other.subscribe, 'function');
  });

  it('should not type check drivers that use xstream', function() {
    type MySources = {
      other: Observable<string>;
    };

    type MySinks = {
      other: Observable<string>;
    };

    function app(sources: MySources): MySinks {
      return {
        other: sources.other.pipe(take(1), startWith('a')),
      };
    }
    function xsdriver(): Stream<string> {
      return xs.of('b');
    }

    const {sinks, sources} = setup(app, {other: xsdriver});
    assert.strictEqual(typeof sinks, 'object');
    assert.strictEqual(typeof sinks.other.subscribe, 'function');
    assert.strictEqual(typeof sources, 'object');
    assert.notStrictEqual(typeof sources.other, 'undefined');
    assert.notStrictEqual(sources.other, null);
    assert.strictEqual(typeof sources.other.subscribe, 'function');
  });

  it('should return a run() which in turn returns a dispose()', function(done) {
    type TestSources = {
      other: Observable<number>;
    };

    type TestSinks = {
      other: Observable<string>;
    };

    function app(sources: TestSources): TestSinks {
      return {
        other: sources.other.pipe(take(6), map(x => String(x)), startWith('a')),
      };
    }
    function driver(xsSink: any): Observable<number> {
      return from(xsSink).pipe(map((x: string) => x.charCodeAt(0)), delay(1));
    }
    let {sources, run} = setup(app, {other: driver});
    let dispose: any;
    sources.other.subscribe(x => {
      assert.strictEqual(x, 97);
      dispose();
      done();
    });
    dispose = run();
  });

  it('should not work after has been disposed', function(done) {
    let number$ = range(1, 3).pipe(concatMap(x => of(x).pipe(delay(150))));

    function app(sources: any): any {
      return {other: number$};
    }

    let {sources, run} = setup(app, {
      other: (num$: any) => from(num$).pipe(map((num: any) => 'x' + num)),
    });

    let dispose: any;
    sources.other.subscribe(function(x: any) {
      assert.notStrictEqual(x, 'x3');
      if (x === 'x2') {
        dispose();
        setTimeout(() => {
          done();
        }, 100);
      }
    });
    dispose = run();
  });
});

describe('run', function() {
  it('should be a function', function() {
    assert.strictEqual(typeof run, 'function');
  });

  it('should throw if first argument is not a function', function() {
    assert.throws(() => {
      (run as any)('not a function');
    }, /First argument given to Cycle must be the 'main' function/i);
  });

  it('should throw if second argument is not an object', function() {
    assert.throws(() => {
      (run as any)(() => {}, 'not an object');
    }, /Second argument given to Cycle must be an object with driver functions/i);
  });

  it('should throw if second argument is an empty object', function() {
    assert.throws(() => {
      (run as any)(() => {}, {});
    }, /Second argument given to Cycle must be an object with at least one/i);
  });

  it('should return a dispose function', function() {
    let sandbox = sinon.sandbox.create();
    const spy = sandbox.spy();
    function app(sources: any): any {
      return {
        other: sources.other.pipe(take(1), startWith('a')),
      };
    }
    function driver() {
      return of('b').pipe(tap(spy));
    }
    let dispose = run(app, {other: driver});
    assert.strictEqual(typeof dispose, 'function');
    sinon.assert.calledOnce(spy);
    dispose();
  });

  it('should report main() errors in the console', function(done) {
    let sandbox = sinon.sandbox.create();
    sandbox.stub(console, 'error');

    function main(sources: any): any {
      const sink = sources.other.pipe(
        take(1),
        startWith('a'),
        delay(10),
        map(() => {
          throw new Error('malfunction');
        }),
      );

      return {
        other: sink,
      };
    }

    function driver(xsSink: any) {
      from(xsSink).subscribe({
        next: () => {},
        error: err => {},
      });
      return of('b');
    }

    let caught = false;
    try {
      run(main, {other: driver});
    } catch (e) {
      assert.strictEqual(e.message, 'malfunction');
      caught = true;
    }
    setTimeout(() => {
      sinon.assert.calledOnce(console.error as any);
      sinon.assert.calledWithExactly(
        console.error as any,
        sinon.match((err: any) => err.message === 'malfunction'),
      );

      // Should be false because the error was already reported in the console.
      // Otherwise we would have double reporting of the error.
      assert.strictEqual(caught, false);

      sandbox.restore();
      done();
    }, 80);
  });
});
