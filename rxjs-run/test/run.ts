// tslint:disable-next-line
import 'mocha';
import * as assert from 'assert';
import * as sinon from 'sinon';
import {run} from '../src/index';
import {Observable, of, from, range} from 'rxjs';
import {take, startWith, map, delay, concatMap, tap} from 'rxjs/operators';

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
    const sandbox = sinon.sandbox.create();
    const spy = sandbox.spy();
    function app(sources: any): any {
      return {
        other: sources.other.pipe(take(1), startWith('a')),
      };
    }
    function driver() {
      return of('b').pipe(tap(spy));
    }
    const dispose = run(app, {other: driver});
    assert.strictEqual(typeof dispose, 'function');
    sinon.assert.calledOnce(spy);
    dispose();
  });

  it('should report main() errors in the console', function(done) {
    const sandbox = sinon.sandbox.create();
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
