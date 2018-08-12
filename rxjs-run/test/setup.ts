// tslint:disable-next-line
import 'mocha';
import * as assert from 'assert';
import {setup} from '../src/index';
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

    function app(_sources: MySources): MySinks {
      return {
        other: _sources.other.pipe(
          take(1),
          startWith('a')
        ),
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

    function app(_sources: MySources): MySinks {
      return {
        other: _sources.other.pipe(
          take(1),
          startWith('a')
        ),
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

    function app(_sources: TestSources): TestSinks {
      return {
        other: _sources.other.pipe(
          take(6),
          map(String),
          startWith('a')
        ),
      };
    }
    function driver(xsSink: any): Observable<number> {
      return from(xsSink).pipe(
        map((x: string) => x.charCodeAt(0)),
        delay(1)
      );
    }
    const {sources, run} = setup(app, {other: driver});
    let dispose: any;
    sources.other.subscribe(x => {
      assert.strictEqual(x, 97);
      dispose();
      done();
    });
    dispose = run();
  });

  it('should not work after has been disposed', function(done) {
    const number$ = range(1, 3).pipe(concatMap(x => of(x).pipe(delay(150))));

    function app(_sources: any): any {
      return {other: number$};
    }

    const {sources, run} = setup(app, {
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
